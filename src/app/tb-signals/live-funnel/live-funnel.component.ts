import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, Observable, Subscription, take, timer } from 'rxjs';
import { CurrentContextService } from '../../core/current-context.service';
import { DataPlatformService } from '../../data-platform/data-platform.service';
import {
  FunnelChartStep,
  mapToChartSteps,
} from '../../data-platform/funnels/funnel-chart/funnel-chart.component';
import {
  DataPlatformBreakdownRow,
  DataPlatformEventFilter,
  DataPlatformFunnelStep,
} from '../../data-platform/data-platform.model';
import { DUMMY_STEPS_BY_TAB, USE_DUMMY_DATA } from './live-funnel.dummy-data';

type FunnelChartMode = 'columns' | 'bars';

export type LiveFunnelTabId =
  | 'pageType'
  | 'referrer'
  | 'device'
  | 'category'
  | 'campaign'
  | 'conversion';

interface FunnelChartDisplayStep extends FunnelChartStep {
  height: number;
  conversionPct: number;
}

interface LiveFunnelTabDef {
  id: LiveFunnelTabId;
  labelKey: string;
  comparisonNoun: 'dropoff' | 'vs-previous';
  fetch: (filter: DataPlatformEventFilter) => Observable<FunnelChartStep[]>;
}

const PAGETYPE_ORDER = [
  'home',
  'category',
  'listing',
  'product',
  'cart',
  'checkout',
  'confirmation',
  'thankyou',
];
const TOP_N_RANKED = 6;
const CONVERSION_STEPS: DataPlatformFunnelStep[] = [
  { eventType: 'session' },
  { eventType: 'pageview' },
  { eventType: 'purchase' },
];

@Component({
  selector: 'app-live-funnel',
  standalone: false,
  providers: [DataPlatformService],
  templateUrl: './live-funnel.component.html',
  styleUrl: './live-funnel.component.scss',
})
export class LiveFunnelComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostListener('window:resize')
  onResize() {
    this.scheduleShadowUpdate();
  }

  private readonly ctx = inject(CurrentContextService);
  private readonly dataPlatformService = inject(DataPlatformService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elRef = inject(ElementRef);
  private readonly zone = inject(NgZone);

  @Output() hasData = new EventEmitter<boolean>();

  public initialLoading = true;
  public tabLoading = false;
  public activeMode: FunnelChartMode = 'columns';
  public activeTabId: LiveFunnelTabId = 'pageType';
  public displaySteps: FunnelChartDisplayStep[] = [];

  public readonly tabs: LiveFunnelTabDef[] = [
    {
      id: 'pageType',
      labelKey: 'tb-signals.live-funnel.tabs.page-type',
      comparisonNoun: 'dropoff',
      fetch: (f) => this.fetchPageTypeFunnel(f),
    },
    {
      id: 'referrer',
      labelKey: 'tb-signals.live-funnel.tabs.referrer',
      comparisonNoun: 'vs-previous',
      fetch: (f) => this.fetchRankedBreakdown(f, 'referrer_type'),
    },
    {
      id: 'device',
      labelKey: 'tb-signals.live-funnel.tabs.device',
      comparisonNoun: 'vs-previous',
      fetch: (f) => this.fetchRankedBreakdown(f, 'browser'),
    },
    {
      id: 'category',
      labelKey: 'tb-signals.live-funnel.tabs.category',
      comparisonNoun: 'vs-previous',
      fetch: (f) => this.fetchCompositeBreakdown(f, 'category'),
    },
    {
      id: 'campaign',
      labelKey: 'tb-signals.live-funnel.tabs.campaign',
      comparisonNoun: 'vs-previous',
      fetch: (f) => this.fetchRankedBreakdown(f, 'utm_campaign_name'),
    },
    {
      id: 'conversion',
      labelKey: 'tb-signals.live-funnel.tabs.conversion',
      comparisonNoun: 'dropoff',
      fetch: (f) => this.fetchConversionFunnel(f),
    },
  ];

  private steps: FunnelChartStep[] = [];
  private currentFilter: DataPlatformEventFilter | null = null;
  private readonly chartHeight = 200;
  private shadowSubscription: Subscription | null = null;
  private computeSubscription: Subscription | null = null;
  private animationSubscription: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private columnAnimating = false;

  public get activeTab(): LiveFunnelTabDef {
    return this.tabs.find((t) => t.id === this.activeTabId) ?? this.tabs[0];
  }

  public get dropoffLabelKey(): string {
    return this.activeTab.comparisonNoun === 'dropoff'
      ? 'generic.dropoff'
      : 'tb-signals.live-funnel.vs-previous';
  }

  public get emptyMessageKey(): string {
    return `tb-signals.live-funnel.empty.${this.activeTabId}`;
  }

  public ngOnInit(): void {
    this.ctx.currentContextBS
      .pipe(
        filter((c) => !!c?.account?.siteId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((c) => this.onSiteIdChanged(c!.account?.siteId as number));
  }

  public ngAfterViewInit(): void {
    this.scheduleShadowUpdate();
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.scheduleShadowUpdate());
    });
    this.resizeObserver.observe(this.elRef.nativeElement);
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  public setMode(mode: FunnelChartMode): void {
    this.activeMode = mode;
    this.animateSteps(this.displaySteps);
  }

  public selectTab(id: LiveFunnelTabId): void {
    if (id === this.activeTabId || this.tabLoading) return;
    this.activeTabId = id;
    this.tabLoading = true;
    this.steps = [];
    this.displaySteps = [];
    this.hideShadowLines();
    if (!this.currentFilter) return;
    this.activeTab
      .fetch(this.currentFilter)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((steps) => {
        this.steps = steps;
        this.computeDisplaySteps();
        this.tabLoading = false;
      });
  }

  private onSiteIdChanged(siteId: number): void {
    const now = new Date();
    const from = new Date(+now - 60 * 60 * 1000 * 24);
    this.currentFilter = { siteIds: [siteId], from: from.toISOString(), to: now.toISOString() };
    this.initialLoading = true;
    this.activeTab
      .fetch(this.currentFilter)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((steps) => {
        this.steps = steps;
        this.computeDisplaySteps();
        this.initialLoading = false;
        this.hasData.emit(steps.length > 0);
      });
  }

  private fetchPageTypeFunnel(eventFilter: DataPlatformEventFilter): Observable<FunnelChartStep[]> {
    if (USE_DUMMY_DATA) return this.dummy('pageType');
    return this.dataPlatformService
      .getBreakdown({ filter: eventFilter, dimension: 'dimensions', topN: 50 }, 'live-funnel')
      .pipe(
        map((r) => {
          const rows = (r.data?.rows ?? []).filter((row) => row.label?.startsWith('pageType:'));
          const byName = new Map<string, DataPlatformBreakdownRow>();
          for (const row of rows) {
            const name = row.label.replace('pageType:', '').toLowerCase();
            const existing = byName.get(name);
            if (!existing || row.value > existing.value) byName.set(name, row);
          }
          const ordered = PAGETYPE_ORDER.map((name) => byName.get(name)).filter(
            (row): row is DataPlatformBreakdownRow => !!row,
          );
          return this.toFunnelSteps(ordered, (row) => this.formatPageType(row.label));
        }),
      );
  }

  private fetchRankedBreakdown(
    eventFilter: DataPlatformEventFilter,
    dimension: string,
  ): Observable<FunnelChartStep[]> {
    if (USE_DUMMY_DATA) return this.dummy(this.tabForDimension(dimension));
    return this.dataPlatformService
      .getBreakdown({ filter: eventFilter, dimension, topN: TOP_N_RANKED }, 'live-funnel')
      .pipe(
        map((r) => {
          const rows = [...(r.data?.rows ?? [])]
            .sort((a, b) => b.value - a.value)
            .slice(0, TOP_N_RANKED);
          return this.toFunnelSteps(rows, (row) => this.titleCase(row.label));
        }),
      );
  }

  private fetchCompositeBreakdown(
    eventFilter: DataPlatformEventFilter,
    prefix: string,
  ): Observable<FunnelChartStep[]> {
    if (USE_DUMMY_DATA) return this.dummy('category');
    return this.dataPlatformService
      .getBreakdown({ filter: eventFilter, dimension: 'dimensions', topN: 100 }, 'live-funnel')
      .pipe(
        map((r) => {
          const rows = (r.data?.rows ?? [])
            .filter((row) => row.label?.startsWith(`${prefix}:`))
            .sort((a, b) => b.value - a.value)
            .slice(0, TOP_N_RANKED);
          return this.toFunnelSteps(rows, (row) =>
            this.titleCase(row.label.replace(`${prefix}:`, '')),
          );
        }),
      );
  }

  private fetchConversionFunnel(
    eventFilter: DataPlatformEventFilter,
  ): Observable<FunnelChartStep[]> {
    if (USE_DUMMY_DATA) return this.dummy('conversion');
    return this.dataPlatformService
      .getFunnel({ filter: eventFilter, steps: CONVERSION_STEPS }, 'live-funnel')
      .pipe(map((r) => mapToChartSteps(r.data?.steps ?? [])));
  }

  private toFunnelSteps(
    rows: DataPlatformBreakdownRow[],
    labelFor: (row: DataPlatformBreakdownRow) => string,
  ): FunnelChartStep[] {
    const firstCount = rows[0]?.value ?? 1;
    return rows.map((row, i) => {
      const prev = i > 0 ? rows[i - 1].value : null;
      return {
        value: row.label,
        label: labelFor(row),
        count: row.value,
        percentage: firstCount > 0 ? (row.value / firstCount) * 100 : 0,
        dropoff:
          prev !== null
            ? {
                count: prev - row.value,
                percentage: prev > 0 ? ((prev - row.value) / prev) * 100 : 0,
              }
            : null,
      };
    });
  }

  private dummy(tabId: LiveFunnelTabId): Observable<FunnelChartStep[]> {
    return timer(350).pipe(map(() => DUMMY_STEPS_BY_TAB[tabId] ?? []));
  }

  private tabForDimension(dimension: string): LiveFunnelTabId {
    if (dimension === 'referrer_type') return 'referrer';
    if (dimension === 'browser' || dimension === 'os') return 'device';
    if (dimension === 'utm_campaign_name') return 'campaign';
    return 'pageType';
  }

  private computeDisplaySteps(): void {
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

    this.animateSteps(real);
  }

  private animateSteps(real: FunnelChartDisplayStep[]): void {
    this.animationSubscription?.unsubscribe();
    this.animationSubscription = null;
    this.hideShadowLines();

    if (this.displaySteps.length === 0) {
      this.displaySteps = real.map((s) => ({ ...s, percentage: 0 }));
    } else {
      const current = [...this.displaySteps];
      this.displaySteps = real.map((s, i) => ({ ...s, percentage: current[i]?.percentage ?? 0 }));
    }

    this.computeSubscription?.unsubscribe();
    this.computeSubscription = timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.displaySteps = real;
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

  private hideShadowLines(): void {
    this.columnAnimating = true;
    const host = this.elRef.nativeElement as HTMLElement;
    host.querySelectorAll<HTMLElement>('.shadow-line').forEach((line) => {
      line.classList.remove('shadow-line--visible');
    });
  }

  private scheduleShadowUpdate(): void {
    this.shadowSubscription?.unsubscribe();
    this.shadowSubscription = timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateShadowLines());
  }

  private updateShadowLines(): void {
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

  private formatPageType(composite: string): string {
    const value = composite.replace('pageType:', '');
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private titleCase(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
