import {
  Component,
  AfterViewInit,
  DestroyRef,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FunnelNameDialogComponent } from '../funnel-name-dialog/funnel-name-dialog.component';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DataPlatformService } from '../../data-platform.service';
import { DataPlatformEventFilter, DataPlatformFunnelStep } from '../../data-platform.model';
import { WidgetService } from '../../../shared/services/widget.service';
import { WidgetSimpleInfo } from '../../../campaign/widgets.model';
import { AccountService } from '../../../account/account.service';
import { GoalModel } from '../../../account-settings/models/events.model';
import { SnackBarService } from '../../../core/snack-bar.service';
import { FunnelChartStep, mapToChartSteps } from '../funnel-chart/funnel-chart.component';
import { FunnelStorageService } from '../funnel-storage.service';

interface FunnelPreset {
  labelKey: string;
  steps: DataPlatformFunnelStep[];
}

const FUNNEL_PRESETS: FunnelPreset[] = [
  {
    labelKey: 'data-platform.funnel-preset-widget-engagement',
    steps: [
      { eventType: 'widget-open' },
      { eventType: 'widget-clickthrough' },
      { eventType: 'widget-conversion' },
    ],
  },
  {
    labelKey: 'data-platform.funnel-preset-purchase-funnel',
    steps: [{ eventType: 'session' }, { eventType: 'pageview' }, { eventType: 'purchase' }],
  },
  {
    labelKey: 'data-platform.funnel-preset-goal-tracking',
    steps: [{ eventType: 'session' }, { eventType: 'goal' }],
  },
  {
    labelKey: 'data-platform.funnel-preset-coupon-claim',
    steps: [{ eventType: 'widget-open' }, { eventType: 'widget-copy-coupon' }],
  },
  {
    labelKey: 'data-platform.funnel-preset-survey',
    steps: [{ eventType: 'widget-open' }, { eventType: 'widget-survey-response' }],
  },
];

interface EventTypeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-custom-funnel-builder',
  templateUrl: './custom-funnel-builder.component.html',
  styleUrls: ['./custom-funnel-builder.component.scss'],
  standalone: false,
})
export class CustomFunnelBuilderComponent implements OnInit, AfterViewInit, OnDestroy {
  public readonly eventTypes: EventTypeOption[] = [
    { value: 'goal', label: 'data-platform.event-type-goal' },
    { value: 'pageview', label: 'data-platform.event-type-pageview' },
    { value: 'purchase', label: 'data-platform.event-type-purchase' },
    { value: 'widget-clickthrough', label: 'data-platform.event-type-widget-clickthrough' },
    { value: 'widget-conversion', label: 'data-platform.event-type-widget-conversion' },
    { value: 'widget-copy-coupon', label: 'data-platform.event-type-widget-copy-coupon' },
    { value: 'widget-dismissal', label: 'data-platform.event-type-widget-dismissal' },
    { value: 'widget-open', label: 'data-platform.event-type-widget-open' },
    { value: 'widget-survey-response', label: 'data-platform.event-type-widget-survey-response' },
    { value: 'session', label: 'data-platform.event-type-session' },
    { value: 'event', label: 'data-platform.event-type-event' },
  ];

  public readonly presets = FUNNEL_PRESETS;
  private readonly storageService = inject(FunnelStorageService);

  public readonly widgets = signal<WidgetSimpleInfo[]>([]);
  public readonly goals = signal<GoalModel[]>([]);
  public readonly widgetEventTypes = signal<Map<number, Set<string>>>(new Map());
  public readonly selectedCampaignId = signal<number | null>(null);
  public readonly filteredWidgets = computed(() => {
    const id = this.selectedCampaignId();
    if (id === null) return this.widgets();
    const campaignId = this.widgets().find((w) => w.id === id)?.campaignId;
    if (!campaignId) return this.widgets().filter((w) => w.id === id);
    return this.widgets().filter((w) => w.campaignId === campaignId);
  });
  public readonly stepEventTypes = signal<string[]>([]);
  public readonly availableEventTypes = computed((): EventTypeOption[] => {
    const id = this.selectedCampaignId();
    if (id === null) return this.eventTypes;
    const types = this.widgetEventTypes().get(id) ?? new Set<string>();
    return this.eventTypes.filter((et) => !et.value.startsWith('widget-') || types.has(et.value));
  });
  public readonly unavailableEventTypes = computed((): Set<string> => {
    const id = this.selectedCampaignId();
    if (id === null) return new Set();
    const availTypes = this.widgetEventTypes().get(id) ?? new Set<string>();
    return new Set(
      this.eventTypes
        .filter((et) => et.value.startsWith('widget-') && !availTypes.has(et.value))
        .map((et) => et.value),
    );
  });
  public readonly inactiveStepIndexes = computed((): Set<number> => {
    const unavail = this.unavailableEventTypes();
    const result = new Set<number>();
    this.stepEventTypes().forEach((et, i) => {
      if (et && unavail.has(et)) result.add(i);
    });
    return result;
  });
  public readonly savedFunnels = this.storageService.savedFunnels;
  public readonly savedFunnelNames = computed(() => this.savedFunnels().map((f) => f.name));
  public readonly activeFunnelId = signal<string | null>(null);
  public readonly funnelChartSteps = signal<FunnelChartStep[]>([]);
  public readonly loading = signal(false);
  public readonly hasResults = signal(false);
  public readonly isSideBySide = signal(false);
  public readonly activePresetKey = computed<string | null>(() => {
    const types = this.stepEventTypes();
    const match = this.presets.find((p) => {
      const pt = p.steps.map((s) => s.eventType);
      return pt.length === types.length && pt.every((t, i) => t === types[i]);
    });
    return match?.labelKey ?? null;
  });
  public readonly isActiveFunnelPinned = computed(() => {
    const id = this.activeFunnelId();
    if (!id) return false;
    return this.savedFunnels().find((f) => f.id === id)?.pinned ?? false;
  });

  private readonly fb = inject(FormBuilder);
  private readonly dataPlatformService = inject(DataPlatformService);
  private readonly widgetService = inject(WidgetService);
  private readonly accountService = inject(AccountService);
  private readonly snackBarService = inject(SnackBarService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elRef = inject(ElementRef);
  private readonly zone = inject(NgZone);

  private currentFilter: DataPlatformEventFilter | null = null;
  private readonly cancelRun$ = new Subject<void>();
  private resizeObserver?: ResizeObserver;
  private hintTimeout: ReturnType<typeof setTimeout> | null = null;
  public readonly maxSteps = 7;

  public readonly showHint = signal(false);

  public readonly funnelNameCtrl: FormControl<string | null> = new FormControl('');
  public readonly funnelForm = this.fb.group({
    steps: this.fb.array([this.buildStepGroup(), this.buildStepGroup()]),
  });

  public readonly compareFunnelId = (a: string | null, b: string | null) => a === b;

  public get stepsArray(): FormArray {
    return this.funnelForm.get('steps') as FormArray;
  }

  public get hasEnoughSteps(): boolean {
    const unavail = this.unavailableEventTypes();
    return (
      this.stepsArray.controls.filter((c) => {
        const et = c.get('eventType')?.value as string;
        return !!et && !unavail.has(et);
      }).length >= 2
    );
  }

  ngOnInit() {
    this.funnelNameCtrl.setValue(this.generateDefaultName());

    this.dataPlatformService.filterBS.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((f) => {
      if (f) {
        this.currentFilter = f;
        this.selectedCampaignId.set(null);
        this.widgetEventTypes.set(new Map());
        this.dataPlatformService
          .getBreakdown(
            { filter: f, dimension: 'widget_id', eventType: 'widget-open', metric: 'count' },
            'funnels-filters',
          )
          .pipe(
            switchMap((result) => {
              const widgetIds = (result.data?.rows ?? []).map((r) => Number(r.label));
              if (!widgetIds.length) return of([]);
              return forkJoin(
                widgetIds.map((id) =>
                  this.dataPlatformService
                    .getBreakdown(
                      { filter: f, dimension: 'event_type', widgetIds: [id] },
                      'funnels-filters',
                    )
                    .pipe(
                      map((r) => ({
                        widgetId: id,
                        types: new Set<string>((r.data?.rows ?? []).map((row) => row.label)),
                      })),
                    ),
                ),
              );
            }),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe((items) => {
            const typeMap = new Map<number, Set<string>>();
            items.forEach(({ widgetId, types }) => typeMap.set(widgetId, types));
            this.widgetEventTypes.set(typeMap);
          });
        if (this.hasEnoughSteps) {
          this.runFunnel();
        }
      }
    });

    this.dataPlatformService.refreshBS.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.hasEnoughSteps && this.currentFilter) {
        this.runFunnel();
      }
    });

    this.widgetService
      .getAllWidgetsSimpleInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((widgets) => {
        this.widgets.set(widgets ?? []);
      });

    this.accountService
      .getGoals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((goals) => {
        this.goals.set((goals ?? []).filter((g) => !g.name?.startsWith('oc_')));
      });

    this.funnelForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.stepEventTypes.set(
        this.stepsArray.controls.map((c) => c.get('eventType')?.value as string).filter(Boolean),
      );
      this.dismissHint();
    });

    this.funnelForm.valueChanges
      .pipe(
        debounceTime(400),
        filter(() => this.hasEnoughSteps && !!this.currentFilter),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.runFunnel();
      });

    this.funnelForm.valueChanges
      .pipe(
        debounceTime(400),
        filter(() => !!this.activeFunnelId()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.autoSave());

    this.funnelNameCtrl.valueChanges
      .pipe(
        debounceTime(400),
        filter(() => !!this.activeFunnelId()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.autoSave());
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => this.zone.run(() => this.updateLayout()));
    this.resizeObserver.observe(this.elRef.nativeElement);
    this.updateLayout();
    this.hintTimeout = setTimeout(() => {
      if (!this.activeFunnelId() && !this.hasEnoughSteps) this.showHint.set(true);
    }, 4000);
  }

  ngOnDestroy() {
    this.cancelRun$.complete();
    this.resizeObserver?.disconnect();
    if (this.hintTimeout !== null) clearTimeout(this.hintTimeout);
  }

  @HostListener('document:click')
  public dismissHint() {
    this.showHint.set(false);
  }

  public onEventTypeChanged(index: number) {
    this.stepsArray.at(index).patchValue({ widgetIds: [], goalName: '', actionUrl: '' });
  }

  public addStep() {
    if (this.stepsArray.length >= this.maxSteps) return;
    this.stepsArray.push(this.buildStepGroup());
    this.updateLayout();
  }

  public removeStep(index: number) {
    if (this.stepsArray.length > 2) {
      this.stepsArray.removeAt(index);
      this.updateLayout();
    }
  }

  public onDropStep(event: CdkDragDrop<AbstractControl[]>) {
    const values = this.stepsArray.controls.map((c) => ({ ...c.value }));
    moveItemInArray(values, event.previousIndex, event.currentIndex);
    this.stepsArray.controls.forEach((ctrl, i) =>
      (ctrl as FormGroup).patchValue(values[i], { emitEvent: false }),
    );
    this.funnelForm.updateValueAndValidity();
  }

  public runFunnel() {
    if (!this.currentFilter || !this.hasEnoughSteps) {
      this.funnelChartSteps.set([]);
      this.hasResults.set(false);
      return;
    }
    const campaignId = this.selectedCampaignId();
    const unavail = this.unavailableEventTypes();
    const steps = (this.stepsArray.value as DataPlatformFunnelStep[])
      .filter((s) => !!s.eventType && !unavail.has(s.eventType))
      .map((s) => {
        if (campaignId !== null && s.eventType.startsWith('widget-')) {
          return { ...s, widgetIds: [campaignId] };
        }
        return s;
      });
    this.cancelRun$.next();
    this.loading.set(!this.hasResults());

    this.dataPlatformService
      .getFunnel({ filter: this.currentFilter, steps }, 'funnels-run')
      .pipe(takeUntil(this.cancelRun$), takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.loading.set(false);
        if (result?.isPositive() && result.data) {
          this.funnelChartSteps.set(mapToChartSteps(result.data.steps ?? []));
          this.hasResults.set(true);
        } else {
          this.snackBarService.error('generic.errorOccurred');
        }
      });
  }

  public saveFunnel() {
    const generatedName = this.generateDefaultName();
    const name = this.funnelNameCtrl.value?.trim() || generatedName;
    const isUnnamed = name === generatedName;
    const isDuplicate = this.savedFunnels().some(
      (f) => f.name === name && f.id !== this.activeFunnelId(),
    );
    if (isUnnamed || isDuplicate) {
      this.dialog
        .open(FunnelNameDialogComponent, {
          data: {
            currentName: name,
            isDuplicate,
            existingNames: this.savedFunnels()
              .filter((f) => f.id !== this.activeFunnelId())
              .map((f) => f.name),
          },
          panelClass: 'funnel-name-dialog-panel',
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe((result: string | null | undefined) => {
          if (result === undefined) return;
          this.doSaveFunnel(result ?? name);
        });
    } else {
      this.doSaveFunnel(name);
    }
  }

  public renameFunnel(name: string) {
    this.funnelNameCtrl.setValue(name);
  }

  public togglePin() {
    const id = this.activeFunnelId();
    if (!id) return;
    const updated = this.savedFunnels().map((f) => (f.id === id ? { ...f, pinned: !f.pinned } : f));
    this.storageService.write(updated);
  }

  public loadFunnel(id: string) {
    const funnel = this.savedFunnels().find((f) => f.id === id);
    if (!funnel) return;
    this.activeFunnelId.set(id);
    this.funnelNameCtrl.setValue(funnel.name);
    funnel.steps.forEach((s, i) => {
      const values = {
        eventType: s.eventType ?? '',
        widgetIds: s.widgetIds ?? [],
        goalName: s.goalName ?? '',
        actionUrl: s.actionUrl ?? '',
      };
      if (i < this.stepsArray.length) {
        (this.stepsArray.at(i) as FormGroup).patchValue(values, { emitEvent: false });
      } else {
        this.stepsArray.push(this.buildStepGroup(s), { emitEvent: false });
      }
    });
    while (this.stepsArray.length > funnel.steps.length) {
      this.stepsArray.removeAt(this.stepsArray.length - 1, { emitEvent: false });
    }
    this.syncStepEventTypes();
    this.updateLayout();
    this.runFunnel();
  }

  public newFunnel() {
    this.activeFunnelId.set(null);
    this.funnelNameCtrl.setValue(this.generateDefaultName());
    this.funnelChartSteps.set([]);
    this.hasResults.set(false);
    while (this.stepsArray.length > 2) {
      this.stepsArray.removeAt(this.stepsArray.length - 1, { emitEvent: false });
    }
    while (this.stepsArray.length < 2) {
      this.stepsArray.push(this.buildStepGroup(), { emitEvent: false });
    }
    const empty = { eventType: '', widgetIds: [], goalName: '', actionUrl: '' };
    this.stepsArray.controls.forEach((c) =>
      (c as FormGroup).patchValue(empty, { emitEvent: false }),
    );
    this.syncStepEventTypes();
    this.updateLayout();
  }

  public applyPreset(preset: FunnelPreset) {
    while (this.stepsArray.length > preset.steps.length) {
      this.stepsArray.removeAt(this.stepsArray.length - 1, { emitEvent: false });
    }
    while (this.stepsArray.length < preset.steps.length) {
      this.stepsArray.push(this.buildStepGroup(), { emitEvent: false });
    }
    preset.steps.forEach((s, i) => {
      (this.stepsArray.at(i) as FormGroup).patchValue(
        { eventType: s.eventType ?? '', widgetIds: [], goalName: '', actionUrl: '' },
        { emitEvent: false },
      );
    });
    this.syncStepEventTypes();
    this.updateLayout();
    this.dismissHint();
    this.runFunnel();
  }

  public deleteFunnel() {
    const id = this.activeFunnelId();
    if (!id) return;
    const updated = this.savedFunnels().filter((f) => f.id !== id);
    this.storageService.write(updated);
    this.newFunnel();
    this.snackBarService.success('data-platform.funnel-deleted');
  }

  private doSaveFunnel(name: string) {
    const id = this.activeFunnelId() ?? this.generateId();
    const pinned = this.savedFunnels().find((f) => f.id === id)?.pinned;
    this.storageService.upsert({
      id,
      name,
      steps: this.stepsArray.value as DataPlatformFunnelStep[],
      pinned,
    });
    this.activeFunnelId.set(id);
    this.funnelNameCtrl.setValue(name);
    this.snackBarService.success('data-platform.funnel-saved');
  }

  private autoSave() {
    const id = this.activeFunnelId();
    const name = this.funnelNameCtrl.value?.trim();
    if (!id || !name) return;
    const pinned = this.savedFunnels().find((f) => f.id === id)?.pinned;
    this.storageService.upsert({
      id,
      name,
      steps: this.stepsArray.value as DataPlatformFunnelStep[],
      pinned,
    });
  }

  private buildStepGroup(step?: Partial<DataPlatformFunnelStep>): FormGroup {
    return this.fb.group({
      eventType: [step?.eventType ?? ''],
      widgetIds: [step?.widgetIds ?? []],
      goalName: [step?.goalName ?? ''],
      actionUrl: [step?.actionUrl ?? ''],
    });
  }

  private readonly stepColWidth = 535;
  private readonly builderGap = 24;
  private readonly stepMinWidth = 150;
  private readonly chartMinWidth = 40;
  private readonly chartMaxWidth = 540;

  private updateLayout() {
    const el = this.elRef.nativeElement as HTMLElement;
    const containerWidth = el.offsetWidth;
    const minRequired =
      this.stepColWidth +
      this.builderGap +
      this.stepsArray.length * this.stepMinWidth +
      this.chartMinWidth;
    const sbs = containerWidth >= minRequired;
    this.isSideBySide.set(sbs);
    if (sbs) {
      const bodyWidth = Math.min(
        containerWidth,
        this.stepColWidth + this.builderGap + this.chartMaxWidth,
      );
      el.style.setProperty('--builder-content-width', `${bodyWidth}px`);
    } else {
      el.style.removeProperty('--builder-content-width');
    }
  }

  private syncStepEventTypes(): void {
    this.stepEventTypes.set(
      this.stepsArray.controls.map((c) => c.get('eventType')?.value as string).filter(Boolean),
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private generateDefaultName(): string {
    const base = 'Unnamed Funnel';
    const existing = this.savedFunnels().map((f) => f.name);
    if (!existing.includes(base)) return base;
    let i = 2;
    while (existing.includes(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  }
}
