import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  NgZone,
  Output,
  SimpleChanges,
  inject,
  HostListener,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, timer } from 'rxjs';
import { DataPlatformFunnelStepResult } from '../../data-platform.model';

export const EVENT_TYPE_LABELS: Record<string, string> = {
  'widget-open': 'data-platform.event-type-widget-open',
  'widget-clickthrough': 'data-platform.event-type-widget-clickthrough',
  'widget-conversion': 'data-platform.event-type-widget-conversion',
  'widget-copy-coupon': 'data-platform.event-type-widget-copy-coupon',
  'widget-dismissal': 'data-platform.event-type-widget-dismissal',
  'widget-survey-response': 'data-platform.event-type-widget-survey-response',
  goal: 'data-platform.event-type-goal',
  pageview: 'data-platform.event-type-pageview',
  purchase: 'data-platform.event-type-purchase',
  session: 'data-platform.event-type-session',
  event: 'data-platform.event-type-event',
};

export function mapToChartSteps(rawSteps: DataPlatformFunnelStepResult[]): FunnelChartStep[] {
  const baseCount = rawSteps[0]?.count ?? 1;
  return rawSteps.map((s, i) => ({
    value: s.eventType,
    label: EVENT_TYPE_LABELS[s.eventType] ?? s.eventType,
    count: s.count,
    percentage: baseCount > 0 ? (s.count / baseCount) * 100 : 0,
    dropoff: i === 0 ? null : calcDropoff(rawSteps[i - 1].count, s.count),
  }));
}

function calcDropoff(prevCount: number, currCount: number): FunnelChartStep['dropoff'] {
  return {
    count: prevCount - currCount,
    percentage: prevCount > 0 ? ((prevCount - currCount) / prevCount) * 100 : 0,
  };
}

export interface FunnelChartStep {
  value: string;
  label: string;
  count: number;
  percentage: number;
  dropoff: { count: number; percentage: number } | null;
}

interface FunnelChartDisplayStep extends FunnelChartStep {
  height: number;
  conversionPct: number;
}

type FunnelChartMode = 'columns' | 'bars';

@Component({
  selector: 'app-funnel-chart',
  templateUrl: './funnel-chart.component.html',
  styleUrls: ['./funnel-chart.component.scss'],
  standalone: false,
})
export class FunnelChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @HostListener('window:resize')
  onResize() {
    this.scheduleShadowUpdate();
  }

  @Input() public steps: FunnelChartStep[] = [];
  @Input() public defaultMode: FunnelChartMode = 'columns';
  @Input() public title: string | null = null;
  @Input() public editableTitle = false;
  @Input() public takenNames: string[] = [];
  @Input() public loadingFunnel = false;
  @Input() public compactHeader = false;
  @Input() public showPin = false;
  @Input() public isPinned = false;
  @Input() public compactView = false;
  @Input() public showModeToggle = true;
  @Output() public titleChange = new EventEmitter<string>();
  @Output() public pinToggle = new EventEmitter<void>();

  public activeMode: FunnelChartMode = 'columns';
  public displaySteps: FunnelChartDisplayStep[] = [];
  public isEditingTitle = false;
  public titleInputValue = '';

  public get isTitleDuplicate(): boolean {
    const trimmed = this.titleInputValue.trim();
    return !!trimmed && trimmed !== this.title && this.takenNames.includes(trimmed);
  }

  private readonly elRef = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chartHeight = 200;
  private shadowSubscription: Subscription | null = null;
  private computeSubscription: Subscription | null = null;
  private animationSubscription: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private columnAnimating = false;

  ngAfterViewInit() {
    this.scheduleShadowUpdate();
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.scheduleShadowUpdate());
    });
    this.resizeObserver.observe(this.elRef.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['defaultMode']) {
      this.activeMode = this.defaultMode;
    }

    if (changes['steps']) {
      this.computeDisplaySteps();
    } else if (changes['defaultMode'] && !changes['defaultMode'].isFirstChange()) {
      this.setMode(this.defaultMode);
    } else {
      this.scheduleShadowUpdate();
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  public startTitleEdit() {
    if (!this.editableTitle) return;
    this.titleInputValue = this.title ?? '';
    this.isEditingTitle = true;
    timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const input = this.elRef.nativeElement.querySelector(
          '.funnel-title-input',
        ) as HTMLInputElement | null;
        if (!input) return;
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      });
  }

  public onTitleInput(value: string) {
    this.titleInputValue = value;
  }

  public commitTitleEdit(value: string) {
    const trimmed = value.trim();
    if (this.isTitleDuplicate) {
      this.isEditingTitle = false;
      return;
    }
    if (trimmed) this.titleChange.emit(trimmed);
    this.isEditingTitle = false;
  }

  public cancelTitleEdit() {
    this.isEditingTitle = false;
  }

  public setMode(mode: FunnelChartMode) {
    this.activeMode = mode;
    const real = [...this.displaySteps];
    this.animationSubscription?.unsubscribe();
    this.animationSubscription = null;
    this.hideShadowLines();
    this.displaySteps = real.map((s) => ({ ...s, percentage: 0 }));
    this.computeSubscription?.unsubscribe();
    this.computeSubscription = timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.displaySteps = real;
        this.cdr.detectChanges();
        this.computeSubscription = null;
        this.animationSubscription?.unsubscribe();
        this.animationSubscription = timer(620)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.animationSubscription = null;
            this.columnAnimating = false;
            this.scheduleShadowUpdate();
          });
      });
  }

  private computeDisplaySteps() {
    this.computeSubscription?.unsubscribe();
    this.computeSubscription = null;
    this.animationSubscription?.unsubscribe();
    this.animationSubscription = null;
    this.hideShadowLines();

    const max = this.steps.length > 0 ? Math.max(...this.steps.map((s) => s.count)) : 0;
    const real: FunnelChartDisplayStep[] = this.steps.map((s, i) => {
      const prevCount = i === 0 ? s.count : this.steps[i - 1].count;
      const conversionPct = i === 0 ? 100 : prevCount > 0 ? (s.count / prevCount) * 100 : 0;
      return {
        ...s,
        height: max === 0 ? 0 : Math.round((s.count / max) * this.chartHeight),
        conversionPct,
      };
    });

    if (this.displaySteps.length === 0) {
      this.displaySteps = real.map((s) => ({ ...s, percentage: 0 }));
    } else {
      const currentByIndex = [...this.displaySteps];
      this.displaySteps = real.map((s, i) => ({
        ...s,
        percentage: currentByIndex[i]?.percentage ?? 0,
      }));
    }

    this.computeSubscription = timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.displaySteps = real;
        this.cdr.detectChanges();
        this.computeSubscription = null;
        this.animationSubscription?.unsubscribe();
        this.animationSubscription = timer(620)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.animationSubscription = null;
            this.columnAnimating = false;
            this.scheduleShadowUpdate();
          });
      });
  }

  private hideShadowLines() {
    this.columnAnimating = true;
    const host = this.elRef.nativeElement as HTMLElement;
    host.querySelectorAll<HTMLElement>('.shadow-line').forEach((line) => {
      line.classList.remove('shadow-line--visible');
    });
  }

  private scheduleShadowUpdate() {
    this.shadowSubscription?.unsubscribe();
    this.shadowSubscription = timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateShadowLines());
  }

  private updateShadowLines() {
    if (this.activeMode !== 'columns' || this.columnAnimating) return;

    const host = this.elRef.nativeElement as HTMLElement;
    const columns = host.querySelectorAll<HTMLElement>('.funnel-col');
    const barAreas = host.querySelectorAll<HTMLElement>('.col-wrapper');

    if (!columns.length || !barAreas.length) return;

    columns.forEach((col) => col.classList.remove('shadow-block'));

    const gapWidth = barAreas[0].offsetWidth - columns[0].offsetWidth;

    columns.forEach((col, i) => {
      const nextCol = columns[i + 1];
      const barArea = barAreas[i];
      if (!barArea) return;

      const lineEl = barArea.querySelector<HTMLElement>('.shadow-line');
      if (!lineEl) return;

      if (!nextCol) {
        lineEl.classList.remove('shadow-line--visible');
        return;
      }

      lineEl.classList.add('shadow-line--visible');

      const hCurrent = col.offsetHeight;
      const hNext = nextCol.offsetHeight;

      lineEl.style.left = `${col.offsetWidth}px`;
      lineEl.style.top = `${barArea.offsetHeight - hCurrent}px`;

      let difHeight = hCurrent - hNext;
      if (difHeight < 0 && hCurrent !== 0) {
        difHeight = Math.abs(difHeight);
      }

      const hypotenuse = Math.sqrt(difHeight * difHeight + gapWidth * gapWidth);
      const angleAlpha = (Math.atan(gapWidth / (difHeight || 1)) * 180) / Math.PI;

      lineEl.style.height = `${hypotenuse + 3}px`;

      if (hCurrent === 0 || (hCurrent > 0 && hNext > hCurrent)) {
        const modifAngle = -angleAlpha + 179.5;
        lineEl.style.transform = `rotate(${modifAngle}deg)`;
        if (hCurrent > 0 && hNext > hCurrent) {
          lineEl.style.transform = `rotate(-${modifAngle}deg)`;
          col.classList.add('shadow-block');
        }
      } else {
        lineEl.style.transform = `rotate(-${angleAlpha}deg)`;
      }
    });
  }
}
