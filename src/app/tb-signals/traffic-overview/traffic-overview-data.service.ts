import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, forkJoin, take } from 'rxjs';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';

import { CurrentContextService, CurrentContext } from '../../core/current-context.service';
import { SiteContextService } from '../../core/site-context.service';
import { DataPlatformService } from '../../data-platform/data-platform.service';
import { DataPlatformEventFilter } from '../../data-platform/data-platform.model';
import { FlyoutService } from '../../flyout/flyout.service';
import { FlyoutDataType } from '../../flyout/flyout-models';
import {
  CustomerDashboardDataService,
  ProfileCount,
  RevenueWidgetsCount,
  SignupAnalyticsCount,
} from '../../customer-dashboard/customer-dashboard-data.service';
import { AnalyticsService } from '../../shared/services/analytics.service';
import { AudienceService } from '../../audience/audience.service';
import { AccountService } from '../../account/account.service';
import { Currency } from '../../shared/account/Currency';
import { ThousandSuffixPipe } from '../../shared/pipes/thousand-suffix.pipe';
import {
  AnalyticsIdentifiedPerDate,
  IdentifiedRateSiteResponse,
  RevenueResponse,
} from '../../shared/services/analytics-models';
import { WidgetStatistics } from '../../campaign/widgets.model';
import {
  DUMMY_KPI_CHANGES,
  DUMMY_KPI_TRENDS,
  DUMMY_PAGES,
  DUMMY_SCALARS,
  DUMMY_TREND,
  USE_DUMMY_DATA,
} from './traffic-overview.dummy-data';
import type { VisibleKpiCard } from './kpi-menu/kpi-menu.component';

Chart.register(...registerables);

const LS_KEY_SELECTION = 'tb-signals.traffic-overview.kpi-selection';
const LS_KEY_LAYOUT = 'tb-signals.traffic-overview.kpi-layout';
const DEFAULT_KPI_KEYS = ['sessions', 'visitors', 'avgDuration', 'bounceRate', 'pageViews'];

interface TrafficKpiDef {
  key: string;
  labelKey: string;
  tooltipKey?: string;
  format: 'number' | 'percent' | 'currency' | 'duration';
  icon?: string;
  placeholder?: boolean;
}

interface NamedGroup {
  name: string;
  count?: number;
  items: { date: string; count: number }[];
}

const SIGNALS_KPI_DEFS: TrafficKpiDef[] = [
  {
    key: 'sessions',
    labelKey: 'tb-signals.kpi.sessions.label',
    tooltipKey: 'tb-signals.kpi.sessions.tooltip',
    format: 'number',
    icon: 'timeline',
  },
  {
    key: 'visitors',
    labelKey: 'tb-signals.kpi.visitors.label',
    tooltipKey: 'tb-signals.kpi.visitors.tooltip',
    format: 'number',
    icon: 'group',
  },
  {
    key: 'avgDuration',
    labelKey: 'tb-signals.kpi.avg-duration.label',
    tooltipKey: 'tb-signals.kpi.avg-duration.tooltip',
    format: 'duration',
    icon: 'schedule',
  },
  {
    key: 'bounceRate',
    labelKey: 'tb-signals.kpi.bounce-rate.label',
    tooltipKey: 'tb-signals.kpi.bounce-rate.tooltip',
    format: 'percent',
    icon: 'bolt',
  },
  {
    key: 'pageViews',
    labelKey: 'tb-signals.kpi.page-views.label',
    tooltipKey: 'tb-signals.kpi.page-views.tooltip',
    format: 'number',
    icon: 'visibility',
  },
];

const DASHBOARD_KPI_DEFS: TrafficKpiDef[] = [
  {
    key: 'totalImpressions',
    labelKey: 'dashboard.statistics-bar.total-impressions',
    tooltipKey: 'dashboard-new.kpi.tooltip.total-impressions',
    format: 'number',
  },
  {
    key: 'totalFormResponses',
    labelKey: 'dashboard.statistics-bar.total-signups',
    tooltipKey: 'dashboard-new.kpi.tooltip.total-form-responses',
    format: 'number',
  },
  {
    key: 'totalSurveyResponses',
    labelKey: 'dashboard.statistics-bar.total-survey-responses',
    tooltipKey: 'dashboard-new.kpi.tooltip.total-survey-responses',
    format: 'number',
  },
  {
    key: 'totalProfiles',
    labelKey: 'dashboard.statistics-bar.total-profiles',
    tooltipKey: 'dashboard-new.kpi.tooltip.total-profiles',
    format: 'number',
  },
  {
    key: 'avgIdentifiedRate',
    labelKey: 'dashboard.statistics-bar.avg-identified-visitors',
    tooltipKey: 'dashboard-new.kpi.tooltip.avg-identified-rate',
    format: 'percent',
  },
  {
    key: 'newEmails',
    labelKey: 'chart.legends.createdSubscribers',
    tooltipKey: 'dashboard-new.kpi.tooltip.new-emails',
    format: 'number',
  },
  {
    key: 'duplicatesPrevented',
    labelKey: 'chart.legends.duplicatesPrevented',
    tooltipKey: 'dashboard-new.kpi.tooltip.duplicates-prevented',
    format: 'number',
  },
  {
    key: 'purchasesToday',
    labelKey: 'dashboard.statistics-bar.todays-purchases',
    tooltipKey: 'dashboard-new.kpi.tooltip.purchases-today',
    format: 'number',
  },
  {
    key: 'totalAssistedSales',
    labelKey: 'analytics.sales.totalAssistedSales.title',
    tooltipKey: 'dashboard-new.kpi.tooltip.total-assisted-sales',
    format: 'currency',
  },
  {
    key: 'totalValueSignups',
    labelKey: 'analytics.sales.totalValueSignups.title',
    tooltipKey: 'dashboard-new.kpi.tooltip.total-value-signups',
    format: 'currency',
  },
  {
    key: 'periodImpressions',
    labelKey: 'dashboard-new.kpi.period-impressions',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-impressions',
    format: 'number',
  },
  {
    key: 'periodConversions',
    labelKey: 'dashboard-new.kpi.period-conversions',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-conversions',
    format: 'number',
  },
  {
    key: 'periodClickthroughs',
    labelKey: 'dashboard-new.kpi.period-clickthroughs',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-clickthroughs',
    format: 'number',
  },
  {
    key: 'periodSurveyResponses',
    labelKey: 'dashboard-new.kpi.period-survey-responses',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-survey-responses',
    format: 'number',
  },
  {
    key: 'periodCouponsCopied',
    labelKey: 'dashboard-new.kpi.period-coupons-copied',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-coupons-copied',
    format: 'number',
  },
  {
    key: 'periodShares',
    labelKey: 'dashboard-new.kpi.period-shares',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-shares',
    format: 'number',
  },
  {
    key: 'periodConversionRate',
    labelKey: 'dashboard-new.kpi.period-conversion-rate',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-conversion-rate',
    format: 'percent',
  },
  {
    key: 'periodCtr',
    labelKey: 'dashboard-new.kpi.period-ctr',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-ctr',
    format: 'percent',
  },
  {
    key: 'totalDataPointsCollected',
    labelKey: 'dashboard-new.kpi.total-data-points',
    tooltipKey: 'dashboard-new.kpi.tooltip.total-data-points',
    format: 'number',
  },
  {
    key: 'periodCouponCopyRate',
    labelKey: 'dashboard-new.kpi.period-coupon-copy-rate',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-coupon-copy-rate',
    format: 'percent',
  },
  {
    key: 'periodSurveyResponseRate',
    labelKey: 'dashboard-new.kpi.period-survey-response-rate',
    tooltipKey: 'dashboard-new.kpi.tooltip.period-survey-response-rate',
    format: 'percent',
  },
  {
    key: 'placeholderNewMembers',
    labelKey: 'dashboard-new.kpi.new-members',
    format: 'number',
    placeholder: true,
  },
  {
    key: 'placeholderMemberSignupRate',
    labelKey: 'dashboard-new.kpi.member-signup-rate',
    format: 'percent',
    placeholder: true,
  },
  {
    key: 'placeholderProfileEnrichmentRate',
    labelKey: 'dashboard-new.kpi.profile-enrichment-rate',
    format: 'percent',
    placeholder: true,
  },
  {
    key: 'placeholderLoginRate',
    labelKey: 'dashboard-new.kpi.login-rate',
    format: 'percent',
    placeholder: true,
  },
  {
    key: 'placeholderPurchaseRate',
    labelKey: 'dashboard-new.kpi.purchase-rate',
    format: 'percent',
    placeholder: true,
  },
  {
    key: 'placeholderCompletedGoal',
    labelKey: 'dashboard-new.kpi.completed-goal',
    format: 'number',
    placeholder: true,
  },
  {
    key: 'placeholderFeedbackVolume',
    labelKey: 'dashboard-new.kpi.feedback-volume',
    format: 'number',
    placeholder: true,
  },
  {
    key: 'placeholderNpsScore',
    labelKey: 'dashboard-new.kpi.nps-score',
    format: 'number',
    placeholder: true,
  },
  {
    key: 'placeholderCsatScore',
    labelKey: 'dashboard-new.kpi.csat-score',
    format: 'number',
    placeholder: true,
  },
  {
    key: 'placeholderGamesPlayed',
    labelKey: 'dashboard-new.kpi.games-played',
    format: 'number',
    placeholder: true,
  },
];

export const ALL_KPI_DEFS: TrafficKpiDef[] = [...SIGNALS_KPI_DEFS, ...DASHBOARD_KPI_DEFS];

@Injectable()
export class TrafficOverviewDataService {
  private readonly currentContextService = inject(CurrentContextService);
  private readonly siteContextService = inject(SiteContextService);
  private readonly dataPlatformService = inject(DataPlatformService);
  private readonly flyoutService = inject(FlyoutService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dataService = inject(CustomerDashboardDataService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly audienceService = inject(AudienceService);
  private readonly accountService = inject(AccountService);
  private readonly thousandSuffixPipe = inject(ThousandSuffixPipe);

  public siteEntries = signal<{ id: number; name: string }[]>([]);
  public selectedSiteId = signal<number>(0);
  public selectedDateLabelKey = signal<string>('dateRange.last30days');
  private dateRangeDays = signal<number>(30);
  private activeSiteId = 0;
  private allCustomerSiteIds: number[] = [];
  private dashboardFromDate = signal<string | undefined>(undefined);
  private dashboardToDate = signal<string | undefined>(undefined);
  private currency = signal<string>('');
  private subscriberWorth = 0;
  private initialized = false;

  public selectedSiteLabel = computed(() => {
    const id = this.selectedSiteId();
    if (id === 0) return this.siteEntries().length ? 'All accounts' : 'Account';
    return this.siteEntries().find((e) => e.id === id)?.name ?? 'Account';
  });

  public kpiLayout = signal<'horizontal' | 'stacked'>(this.loadLayout());
  public selectedKpiKeys = signal<string[]>(this.loadSelection());

  private kpiValues = signal<Record<string, number>>({});
  private kpiLoading = signal<Record<string, boolean>>(
    Object.fromEntries(ALL_KPI_DEFS.filter((d) => !d.placeholder).map((d) => [d.key, true])),
  );
  private kpiErrors = signal<Record<string, boolean>>({});
  private kpiChanges = signal<Record<string, number | null>>({});
  private kpiChartData = signal<Record<string, { date: string; value: number }[]>>({});
  private isDark = signal<boolean>(false);
  private signalsStringValue: Record<string, string> = {};

  public visibleKpiCards = computed<VisibleKpiCard[]>(() => {
    const keys = this.selectedKpiKeys();
    const values = this.kpiValues();
    const loading = this.kpiLoading();
    const errors = this.kpiErrors();
    const changes = this.kpiChanges();
    const chartData = this.kpiChartData();
    const isDark = this.isDark();
    const cur = this.currency();

    const cards: VisibleKpiCard[] = [];
    for (const key of keys) {
      const def = ALL_KPI_DEFS.find((d) => d.key === key);
      if (!def) continue;
      const points = chartData[key] ?? [];
      const sparkline = points.length ? this.createSparklineConfig(points, isDark) : null;
      const rawValue = values[key] ?? 0;
      const formattedValue =
        def.format === 'duration'
          ? (this.signalsStringValue[key] ?? this.formatDuration(rawValue))
          : this.formatKpiValue(rawValue, def.format);
      const suffix = def.format === 'currency' && cur ? cur.toUpperCase() : undefined;

      cards.push({
        key,
        labelKey: def.labelKey,
        tooltipKey: def.tooltipKey,
        icon: def.icon,
        formattedValue,
        suffix,
        loading: loading[key] ?? false,
        error: errors[key] ?? false,
        changePercent: changes[key] ?? null,
        chartData: sparkline?.data,
        chartOptions: sparkline?.options,
      });
    }
    return cards;
  });

  public emptyKpiSlots = computed(() => {
    const capacity = this.kpiLayout() === 'stacked' ? 8 : 4;
    return Array.from(
      { length: Math.max(0, capacity - this.selectedKpiKeys().length) },
      (_, i) => i,
    );
  });

  public showKpiScrollChevrons = computed(() => this.kpiLayout() === 'horizontal');
  public kpiScrollDisabled = computed(
    () => this.selectedKpiKeys().length + this.emptyKpiSlots().length <= 4,
  );

  public readonly dateFilter = computed<{ from: string; to: string } | null>(() => {
    const from = this.dashboardFromDate();
    const to = this.dashboardToDate();
    return from && to ? { from, to } : null;
  });

  public readonly effectiveSiteIds = computed<number[]>(() => {
    const id = this.selectedSiteId();
    if (id !== 0) return [id];
    return this.siteEntries().map((e) => e.id);
  });

  public selectedChartKpiKey = signal<string>('sessions');

  public selectChartKpi(key: string): void {
    this.selectedChartKpiKey.set(key);
  }

  public selectedChartDataPoints = computed<{ timestamp: string; value: number }[]>(() => {
    const key = this.selectedChartKpiKey();
    const pts = this.kpiChartData()[key] ?? [];
    return pts.map((p) => ({ timestamp: p.date, value: p.value }));
  });

  public selectedChartLabelKey = computed<string>(
    () =>
      ALL_KPI_DEFS.find((d) => d.key === this.selectedChartKpiKey())?.labelKey ??
      'tb-signals.kpi.sessions.label',
  );

  public selectedChartFormat = computed<'number' | 'percent' | 'duration'>(() => {
    const fmt = ALL_KPI_DEFS.find((d) => d.key === this.selectedChartKpiKey())?.format ?? 'number';
    return (fmt === 'currency' ? 'number' : fmt) as 'number' | 'percent' | 'duration';
  });

  public loading = true;
  public sessionDataPoints: { timestamp: string; value: number }[] = [];
  public pageRows: { label: string; value: number }[] = [];

  public initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.subscribeToKpiStreams();

    this.flyoutService.flyoutKpiSettingsBS
      .pipe(
        filter((r) => !!r),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((r) => {
        this.selectedKpiKeys.set(r.selectedKeys);
        localStorage.setItem(LS_KEY_SELECTION, JSON.stringify(r.selectedKeys));
      });

    this.currentContextService.currentContextBS
      .pipe(
        filter((ctx): ctx is CurrentContext => !!ctx?.account?.siteId),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(async (ctx) => {
        this.activeSiteId = ctx.account!.siteId as number;
        this.currency.set(ctx.account?.currency ?? '');
        this.subscriberWorth =
          ctx.account?.subscriberWorth ??
          this.accountService.getDefaultSubscriberWorth(ctx.account?.currency as Currency) ??
          0;

        const allSites = await this.siteContextService.getAllSitesAsync();
        const customerSiteIds = ctx.customer?.siteIds;
        const sites =
          customerSiteIds && customerSiteIds.length
            ? allSites.filter((s) => s.id != null && new Set(customerSiteIds).has(s.id!))
            : allSites.filter((s) => s.id === this.activeSiteId);
        this.siteEntries.set(sites.map((s) => ({ id: s.id!, name: s.name ?? '' })));
        this.allCustomerSiteIds = sites.map((s) => s.id!);
        if (!this.allCustomerSiteIds.length) this.allCustomerSiteIds = [this.activeSiteId];

        this.dataService.initialize(this.allCustomerSiteIds);
        this.computeDateRange();
        this.refetchAllKpis();
      });
  }

  public onSiteChanged(siteId: number): void {
    this.selectedSiteId.set(siteId);
    const siteIds = siteId === 0 ? this.allCustomerSiteIds : [siteId];
    if (siteIds.length) this.dataService.switchSites(siteIds);
    this.refetchAllKpis();
  }

  public setDateRange(days: number, labelKey: string): void {
    this.selectedDateLabelKey.set(labelKey);
    this.dateRangeDays.set(days);
    this.computeDateRange();
    this.refetchAllKpis();
  }

  public setKpiLayout(layout: 'horizontal' | 'stacked'): void {
    this.kpiLayout.set(layout);
    localStorage.setItem(LS_KEY_LAYOUT, layout);
  }

  public openKpiSettingsFlyout(): void {
    this.flyoutService.open({
      type: FlyoutDataType.KpiSettings,
      kpiDefinitions: ALL_KPI_DEFS.map((d) => ({
        key: d.key,
        labelKey: d.labelKey,
        tooltipKey: d.tooltipKey,
        format: d.format === 'duration' ? 'number' : d.format,
        placeholder: d.placeholder,
      })),
      kpiSelectedKeys: this.selectedKpiKeys(),
    });
  }

  private computeDateRange(): void {
    const days = this.dateRangeDays();
    const end = new Date();
    let start: Date;
    if (days === 1) {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      const monthEnd = new Date(end.getFullYear(), end.getMonth(), 0);
      this.dashboardFromDate.set(start.toISOString());
      this.dashboardToDate.set(monthEnd.toISOString());
    } else {
      start = new Date(end);
      start.setDate(start.getDate() - days);
      this.dashboardFromDate.set(start.toISOString());
      this.dashboardToDate.set(end.toISOString());
    }
  }

  private refetchAllKpis(): void {
    const from = this.dashboardFromDate();
    const to = this.dashboardToDate();
    if (!from || !to) return;
    const siteIds = this.selectedSiteId() === 0 ? this.allCustomerSiteIds : [this.selectedSiteId()];
    const effectiveSiteId = this.selectedSiteId() === 0 ? this.activeSiteId : this.selectedSiteId();
    if (effectiveSiteId) this.fetchSignalsKpiData(effectiveSiteId);
    if (siteIds.length) this.fetchKpiChartData(siteIds, from, to);
  }

  private updateKpiValue(key: string, value: number): void {
    this.kpiValues.update((v) => ({ ...v, [key]: value }));
  }

  private updateKpiLoading(keys: string[], loading: boolean): void {
    this.kpiLoading.update((l) => {
      const updated = { ...l };
      keys.forEach((k) => (updated[k] = loading));
      return updated;
    });
  }

  private updateKpiError(keys: string[], error: boolean): void {
    this.kpiErrors.update((e) => {
      const updated = { ...e };
      keys.forEach((k) => (updated[k] = error));
      return updated;
    });
  }

  private updateKpiChange(key: string, value: number | null): void {
    this.kpiChanges.update((c) => ({ ...c, [key]: value }));
  }

  private computeHalfSplitChange(
    points: { date: string; value: number }[],
    mode: 'sum' | 'avg',
  ): number | null {
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length < 2) return null;
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    let firstVal: number;
    let secondVal: number;
    if (mode === 'avg') {
      firstVal = firstHalf.reduce((s, p) => s + p.value, 0) / firstHalf.length;
      secondVal = secondHalf.reduce((s, p) => s + p.value, 0) / secondHalf.length;
    } else {
      firstVal = firstHalf.reduce((s, p) => s + p.value, 0);
      secondVal = secondHalf.reduce((s, p) => s + p.value, 0);
    }
    return firstVal > 0 ? ((secondVal - firstVal) / firstVal) * 100 : secondVal > 0 ? 100 : 0;
  }

  private createSparklineConfig(
    points: { value: number }[],
    isDark: boolean,
  ): { data: ChartConfiguration['data']; options: ChartConfiguration['options'] } {
    const color = isDark ? '#fbbf24' : '#f9ab10';
    const fill = isDark ? 'rgba(251,191,36,0.18)' : 'rgba(249,171,16,0.12)';
    return {
      data: {
        labels: points.map((_, i) => i),
        datasets: [
          {
            type: 'line' as const,
            data: points.map((p) => p.value),
            borderColor: color,
            backgroundColor: fill,
            borderWidth: 1.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
        animation: false,
      },
    };
  }

  private formatKpiValue(value: number, format: string): string {
    if (format === 'percent') return value != null ? value.toFixed(1) + '%' : '0.0%';
    return this.thousandSuffixPipe.transform(value, 1);
  }

  private formatDuration(seconds: number): string {
    if (!seconds) return '–';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  private subscribeToKpiStreams(): void {
    this.dataService.widgetStatistics$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.updateKpiLoading(
          [
            'totalImpressions',
            'totalFormResponses',
            'totalSurveyResponses',
            'totalDataPointsCollected',
          ],
          state.loading,
        );
        this.updateKpiError(
          [
            'totalImpressions',
            'totalFormResponses',
            'totalSurveyResponses',
            'totalDataPointsCollected',
          ],
          state.error,
        );
        if (state.data?.data) {
          let totalViews = 0,
            totalConversions = 0,
            totalConversionsPartial = 0,
            totalSurveyResponses = 0,
            totalSurveyResponsesPartial = 0;
          state.data.data.forEach((ws: WidgetStatistics) => {
            totalViews += ws.open ?? 0;
            totalConversions += ws.conversion ?? 0;
            totalConversionsPartial += ws.conversionPartial ?? 0;
            totalSurveyResponses += ws.surveyResponses ?? 0;
            totalSurveyResponsesPartial += ws.surveyResponsesPartial ?? 0;
          });
          this.updateKpiValue('totalImpressions', totalViews);
          this.updateKpiValue('totalFormResponses', totalConversions + totalConversionsPartial);
          this.updateKpiValue(
            'totalSurveyResponses',
            totalSurveyResponses + totalSurveyResponsesPartial,
          );
          this.updateKpiValue(
            'totalDataPointsCollected',
            totalConversions +
              totalConversionsPartial +
              totalSurveyResponses +
              totalSurveyResponsesPartial,
          );
        }
      });

    this.dataService.profileCount$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.updateKpiLoading(['totalProfiles'], state.loading);
      this.updateKpiError(['totalProfiles'], state.error);
      if (state.data) {
        const total = state.data.reduce(
          (sum: number, item: ProfileCount) => sum + (item.count ?? 0),
          0,
        );
        this.updateKpiValue('totalProfiles', total);
      }
    });

    this.dataService.identifiedRate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.updateKpiLoading(['avgIdentifiedRate'], state.loading);
        this.updateKpiError(['avgIdentifiedRate'], state.error);
        if (state.data) {
          const allItems: AnalyticsIdentifiedPerDate[] = [];
          state.data.forEach((site: IdentifiedRateSiteResponse) => {
            if (site.items) allItems.push(...site.items);
          });
          let sum = 0;
          allItems.forEach((stat: AnalyticsIdentifiedPerDate) => {
            let pct = 0;
            if (stat.identified > 0) {
              pct =
                stat.unidentified > 0
                  ? (stat.identified / (stat.identified + stat.unidentified)) * 100
                  : 100;
            }
            sum += pct;
          });
          this.updateKpiValue('avgIdentifiedRate', allItems.length > 0 ? sum / allItems.length : 0);
        }
      });

    this.dataService.revenue$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.updateKpiLoading(['purchasesToday'], state.loading);
      this.updateKpiError(['purchasesToday'], state.error);
      if (state.data) {
        this.updateKpiValue('purchasesToday', (state.data as RevenueResponse).count ?? 0);
      }
    });

    this.dataService.signupAnalyticsCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.updateKpiLoading(
          ['newEmails', 'duplicatesPrevented', 'totalValueSignups'],
          state.loading,
        );
        this.updateKpiError(['newEmails', 'duplicatesPrevented', 'totalValueSignups'], state.error);
        if (state.data) {
          const created = state.data.reduce(
            (s: number, i: SignupAnalyticsCount) => s + (i.createdSubscribers ?? 0),
            0,
          );
          const dupes = state.data.reduce(
            (s: number, i: SignupAnalyticsCount) => s + (i.duplicatesPrevented ?? 0),
            0,
          );
          this.updateKpiValue('newEmails', created);
          this.updateKpiValue('duplicatesPrevented', dupes);
          this.updateKpiValue(
            'totalValueSignups',
            this.subscriberWorth ? created * this.subscriberWorth : 0,
          );
        }
      });

    this.dataService.revenueWidgetsCountRaw$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.updateKpiLoading(['totalAssistedSales'], state.loading);
        this.updateKpiError(['totalAssistedSales'], state.error);
        if (state.data) {
          const total = state.data.reduce(
            (s: number, i: RevenueWidgetsCount) => s + (i.lastTouchRevenue ?? 0),
            0,
          );
          this.updateKpiValue('totalAssistedSales', total);
        }
      });

    this.dataService.dailyPerformance$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        const periodKeys = [
          'periodImpressions',
          'periodConversions',
          'periodClickthroughs',
          'periodSurveyResponses',
          'periodCouponsCopied',
          'periodShares',
          'periodConversionRate',
          'periodCtr',
          'periodCouponCopyRate',
          'periodSurveyResponseRate',
        ];
        this.updateKpiLoading(periodKeys, state.loading);
        this.updateKpiError(periodKeys, state.error);
        if (state.data?.data?.items?.length) {
          const namedItems = state.data.data.items as NamedGroup[];

          const getDaily = (name: string): { date: string; value: number }[] =>
            (namedItems.find((i) => i.name === name)?.items ?? []).map((i) => ({
              date: i.date,
              value: i.count ?? 0,
            }));

          const getMergedDaily = (
            name1: string,
            name2: string,
          ): { date: string; value: number }[] => {
            const byDate = new Map<string, number>();
            [
              ...(namedItems.find((i) => i.name === name1)?.items ?? []),
              ...(namedItems.find((i) => i.name === name2)?.items ?? []),
            ].forEach((i) => byDate.set(i.date, (byDate.get(i.date) ?? 0) + (i.count ?? 0)));
            return Array.from(byDate.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, value]) => ({ date, value }));
          };

          const getTotal = (name: string): number =>
            namedItems.find((i) => i.name === name)?.count ?? 0;
          const getMergedTotal = (n1: string, n2: string): number => getTotal(n1) + getTotal(n2);

          this.updateKpiValue('periodImpressions', getTotal('open'));
          this.updateKpiValue(
            'periodConversions',
            getMergedTotal('conversion', 'conversionPartial'),
          );
          this.updateKpiValue('periodClickthroughs', getTotal('clickthrough'));
          this.updateKpiValue(
            'periodSurveyResponses',
            getMergedTotal('surveyResponses', 'surveyResponsesPartial'),
          );
          this.updateKpiValue('periodCouponsCopied', getTotal('couponsCopied'));
          this.updateKpiValue('periodShares', getTotal('share'));

          const totalOpen = getTotal('open');
          const totalConversions = getMergedTotal('conversion', 'conversionPartial');
          const totalClickthroughs = getTotal('clickthrough');
          this.updateKpiValue(
            'periodConversionRate',
            totalOpen > 0 ? (totalConversions / totalOpen) * 100 : 0,
          );
          this.updateKpiValue(
            'periodCtr',
            totalOpen > 0 ? (totalClickthroughs / totalOpen) * 100 : 0,
          );

          const totalCoupons = getTotal('couponsCopied');
          const totalSurveys = getMergedTotal('surveyResponses', 'surveyResponsesPartial');
          this.updateKpiValue(
            'periodCouponCopyRate',
            totalOpen > 0 ? (totalCoupons / totalOpen) * 100 : 0,
          );
          this.updateKpiValue(
            'periodSurveyResponseRate',
            totalOpen > 0 ? (totalSurveys / totalOpen) * 100 : 0,
          );

          const getDailyRate = (
            numeratorNames: string[],
            denominatorName: string,
          ): { date: string; value: number }[] => {
            const denomByDate = new Map<string, number>(
              (namedItems.find((i) => i.name === denominatorName)?.items ?? []).map((i) => [
                i.date,
                i.count ?? 0,
              ]),
            );
            const numerByDate = new Map<string, number>();
            numeratorNames.forEach((name) => {
              (namedItems.find((i) => i.name === name)?.items ?? []).forEach((i) => {
                numerByDate.set(i.date, (numerByDate.get(i.date) ?? 0) + (i.count ?? 0));
              });
            });
            return Array.from(denomByDate.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, denom]) => ({
                date,
                value: denom > 0 ? ((numerByDate.get(date) ?? 0) / denom) * 100 : 0,
              }));
          };

          const dailyOpen = getDaily('open');
          const dailyConversions = getMergedDaily('conversion', 'conversionPartial');
          const dailySurveys = getMergedDaily('surveyResponses', 'surveyResponsesPartial');
          const dailyClickthroughs = getDaily('clickthrough');
          const dailyCoupons = getDaily('couponsCopied');
          const dailyShares = getDaily('share');
          const dailyConversionRate = getDailyRate(['conversion', 'conversionPartial'], 'open');
          const dailyCtrRate = getDailyRate(['clickthrough'], 'open');
          const dailyCouponRate = getDailyRate(['couponsCopied'], 'open');
          const dailySurveyRate = getDailyRate(
            ['surveyResponses', 'surveyResponsesPartial'],
            'open',
          );

          const dailyDataPoints: { date: string; value: number }[] = [];
          const byDate = new Map<string, number>();
          [
            ...(namedItems.find((i) => i.name === 'conversion')?.items ?? []),
            ...(namedItems.find((i) => i.name === 'conversionPartial')?.items ?? []),
            ...(namedItems.find((i) => i.name === 'surveyResponses')?.items ?? []),
            ...(namedItems.find((i) => i.name === 'surveyResponsesPartial')?.items ?? []),
          ].forEach((i) => byDate.set(i.date, (byDate.get(i.date) ?? 0) + (i.count ?? 0)));
          Array.from(byDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([date, value]) => dailyDataPoints.push({ date, value }));

          this.kpiChartData.update((d) => ({
            ...d,
            totalImpressions: dailyOpen,
            totalFormResponses: dailyConversions,
            totalSurveyResponses: dailySurveys,
            totalDataPointsCollected: dailyDataPoints,
            periodImpressions: dailyOpen,
            periodConversions: dailyConversions,
            periodClickthroughs: dailyClickthroughs,
            periodSurveyResponses: dailySurveys,
            periodCouponsCopied: dailyCoupons,
            periodShares: dailyShares,
            periodConversionRate: dailyConversionRate,
            periodCtr: dailyCtrRate,
            periodCouponCopyRate: dailyCouponRate,
            periodSurveyResponseRate: dailySurveyRate,
          }));

          this.updateKpiChange('totalImpressions', this.computeHalfSplitChange(dailyOpen, 'sum'));
          this.updateKpiChange(
            'totalFormResponses',
            this.computeHalfSplitChange(dailyConversions, 'sum'),
          );
          this.updateKpiChange(
            'totalSurveyResponses',
            this.computeHalfSplitChange(dailySurveys, 'sum'),
          );
          this.updateKpiChange(
            'totalDataPointsCollected',
            this.computeHalfSplitChange(dailyDataPoints, 'sum'),
          );
          this.updateKpiChange('periodImpressions', this.computeHalfSplitChange(dailyOpen, 'sum'));
          this.updateKpiChange(
            'periodConversions',
            this.computeHalfSplitChange(dailyConversions, 'sum'),
          );
          this.updateKpiChange(
            'periodClickthroughs',
            this.computeHalfSplitChange(dailyClickthroughs, 'sum'),
          );
          this.updateKpiChange(
            'periodSurveyResponses',
            this.computeHalfSplitChange(dailySurveys, 'sum'),
          );
          this.updateKpiChange(
            'periodCouponsCopied',
            this.computeHalfSplitChange(dailyCoupons, 'sum'),
          );
          this.updateKpiChange('periodShares', this.computeHalfSplitChange(dailyShares, 'sum'));
          this.updateKpiChange(
            'periodConversionRate',
            this.computeHalfSplitChange(dailyConversionRate, 'avg'),
          );
          this.updateKpiChange('periodCtr', this.computeHalfSplitChange(dailyCtrRate, 'avg'));
          this.updateKpiChange(
            'periodCouponCopyRate',
            this.computeHalfSplitChange(dailyCouponRate, 'avg'),
          );
          this.updateKpiChange(
            'periodSurveyResponseRate',
            this.computeHalfSplitChange(dailySurveyRate, 'avg'),
          );
        }
      });
  }

  private fetchKpiChartData(siteIds: number[], startDate: string, endDate: string): void {
    this.audienceService
      .getIdentifiedRateStatsBySiteIds(siteIds, startDate, endDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const byDate = new Map<string, { identified: number; total: number }>();
        (res ?? []).forEach((site) => {
          (site.items ?? []).forEach((item) => {
            const existing = byDate.get(item.date) ?? { identified: 0, total: 0 };
            byDate.set(item.date, {
              identified: existing.identified + item.identified,
              total: existing.total + item.identified + item.unidentified,
            });
          });
        });
        const points = Array.from(byDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, { identified, total }]) => ({
            date,
            value: total > 0 ? (identified / total) * 100 : 0,
          }));
        this.kpiChartData.update((d) => ({ ...d, avgIdentifiedRate: points }));
        this.updateKpiChange('avgIdentifiedRate', this.computeHalfSplitChange(points, 'avg'));
      });

    this.analyticsService
      .getSignupAnalyticsGraph(startDate, endDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const items = (res?.data?.items ?? []) as NamedGroup[];
        const getNamedDaily = (name: string) =>
          (items.find((i) => i.name === name)?.items ?? []).map((i) => ({
            date: i.date,
            value: i.count ?? 0,
          }));
        const emailPoints = getNamedDaily('CreatedSubscribers');
        const dupePoints = getNamedDaily('DuplicatesPrevented');
        this.kpiChartData.update((d) => ({
          ...d,
          newEmails: emailPoints,
          duplicatesPrevented: dupePoints,
        }));
        this.updateKpiChange('newEmails', this.computeHalfSplitChange(emailPoints, 'sum'));
        this.updateKpiChange('duplicatesPrevented', this.computeHalfSplitChange(dupePoints, 'sum'));
        this.updateKpiChange('totalValueSignups', this.computeHalfSplitChange(emailPoints, 'sum'));
      });

    this.analyticsService
      .getRevenueAudienceGraph(startDate, endDate, 'LastTouchRevenue')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const items = (res?.data?.items ?? []) as NamedGroup[];
        const totalItem = items.find((i) => i.name === 'Total');
        if (totalItem) {
          const points = (totalItem.items ?? []).map((i) => ({
            date: i.date,
            value: i.count ?? 0,
          }));
          this.kpiChartData.update((d) => ({ ...d, totalAssistedSales: points }));
          this.updateKpiChange('totalAssistedSales', this.computeHalfSplitChange(points, 'sum'));
        }
      });
  }

  private fetchSignalsKpiData(siteId: number): void {
    this.loading = true;
    this.updateKpiLoading(DEFAULT_KPI_KEYS, true);

    if (USE_DUMMY_DATA) {
      setTimeout(() => this.applyDummyData(), 400);
      return;
    }

    const eventFilter: DataPlatformEventFilter = {
      siteIds: [siteId],
      from: this.dashboardFromDate()!,
      to: this.dashboardToDate()!,
    };

    forkJoin({
      sessions: this.dataPlatformService.getScalar(
        { filter: eventFilter, metric: 'sessions' },
        'traffic-overview',
      ),
      visitors: this.dataPlatformService.getScalar(
        { filter: eventFilter, metric: 'unique_users' },
        'traffic-overview',
      ),
      avgDur: this.dataPlatformService.getScalar(
        { filter: eventFilter, metric: 'avg_session_duration' },
        'traffic-overview',
      ),
      sessionsGraph: this.dataPlatformService.getGraph(
        { filter: eventFilter, metric: 'sessions', granularity: 'day' },
        'traffic-overview',
      ),
      visitorsGraph: this.dataPlatformService.getGraph(
        { filter: eventFilter, metric: 'unique_users', granularity: 'day' },
        'traffic-overview',
      ),
      avgDurGraph: this.dataPlatformService.getGraph(
        { filter: eventFilter, metric: 'avg_session_duration', granularity: 'day' },
        'traffic-overview',
      ),
      bounces: this.dataPlatformService.getBounceGraph({ filter: eventFilter }, 'traffic-overview'),
      pages: this.dataPlatformService.getBreakdown(
        { filter: eventFilter, dimension: 'action_title', topN: 8 },
        'traffic-overview',
      ),
    }).subscribe((r) => {
      this.loading = false;

      const sessionsVal = r.sessions.data?.value ?? 0;
      this.updateKpiValue('sessions', sessionsVal);
      const sessionsPts = (r.sessionsGraph.data?.series?.[0]?.dataPoints ?? []).map((p) => ({
        date: p.timestamp,
        value: p.value,
      }));
      this.kpiChartData.update((d) => ({ ...d, sessions: sessionsPts }));
      this.updateKpiChange('sessions', this.computeHalfSplitChange(sessionsPts, 'sum'));
      this.sessionDataPoints = r.sessionsGraph.data?.series?.[0]?.dataPoints ?? [];

      const visitorsVal = r.visitors.data?.value ?? 0;
      this.updateKpiValue('visitors', visitorsVal);
      const visitorsPts = (r.visitorsGraph.data?.series?.[0]?.dataPoints ?? []).map((p) => ({
        date: p.timestamp,
        value: p.value,
      }));
      this.kpiChartData.update((d) => ({ ...d, visitors: visitorsPts }));
      this.updateKpiChange('visitors', this.computeHalfSplitChange(visitorsPts, 'sum'));

      const avgDurVal = r.avgDur.data?.value ?? 0;
      const avgDurStr = this.formatDuration(avgDurVal);
      this.signalsStringValue['avgDuration'] = avgDurStr;
      this.updateKpiValue('avgDuration', avgDurVal);
      const avgDurPts = (r.avgDurGraph.data?.series?.[0]?.dataPoints ?? []).map((p) => ({
        date: p.timestamp,
        value: p.value,
      }));
      this.kpiChartData.update((d) => ({ ...d, avgDuration: avgDurPts }));
      this.updateKpiChange('avgDuration', this.computeHalfSplitChange(avgDurPts, 'avg'));

      const bd = r.bounces.data;
      if (bd) {
        const totalVisits = bd.visits.reduce((s, d) => s + d.value, 0);
        const totalBounces = bd.bounces.reduce((s, d) => s + d.value, 0);
        const bouncePct = totalVisits > 0 ? (totalBounces / totalVisits) * 100 : 0;
        this.updateKpiValue('bounceRate', bouncePct);
        const visitsByDate = new Map<string, number>(bd.visits.map((p) => [p.timestamp, p.value]));
        const bouncePts = bd.bounces.map((b) => {
          const v = visitsByDate.get(b.timestamp) ?? 0;
          return { date: b.timestamp, value: v > 0 ? (b.value / v) * 100 : 0 };
        });
        this.kpiChartData.update((d) => ({ ...d, bounceRate: bouncePts }));
        this.updateKpiChange('bounceRate', this.computeHalfSplitChange(bouncePts, 'avg'));
      }

      const pageRowsRaw = r.pages.data?.rows ?? [];
      const totalPageViews = pageRowsRaw.reduce((s, row) => s + row.value, 0);
      this.updateKpiValue('pageViews', totalPageViews);
      this.kpiChartData.update((d) => ({ ...d, pageViews: sessionsPts }));
      this.updateKpiChange('pageViews', this.computeHalfSplitChange(sessionsPts, 'sum'));
      this.pageRows = pageRowsRaw.map((row) => ({ label: row.label, value: row.value }));

      this.updateKpiLoading(DEFAULT_KPI_KEYS, false);
    });
  }

  private applyDummyData(): void {
    this.loading = false;
    this.sessionDataPoints = DUMMY_TREND;
    this.pageRows = DUMMY_PAGES.map((p) => ({ label: p.label, value: p.count }));

    DEFAULT_KPI_KEYS.forEach((k) => {
      const pts = (DUMMY_KPI_TRENDS[k] ?? []).map((v, i) => ({
        date: DUMMY_TREND[i]?.timestamp ?? String(i),
        value: v,
      }));
      this.kpiChartData.update((d) => ({ ...d, [k]: pts }));
      this.updateKpiChange(k, DUMMY_KPI_CHANGES[k] ?? null);
    });
    this.updateKpiValue('sessions', 52340);
    this.updateKpiValue('visitors', 38910);
    this.updateKpiValue('avgDuration', 194);
    this.updateKpiValue('bounceRate', 41);
    this.updateKpiValue('pageViews', 124780);
    this.signalsStringValue['avgDuration'] = DUMMY_SCALARS.avgDuration;
    this.updateKpiLoading(DEFAULT_KPI_KEYS, false);
  }

  private loadSelection(): string[] {
    try {
      const stored = localStorage.getItem(LS_KEY_SELECTION);
      return stored ? (JSON.parse(stored) as string[]) : [...DEFAULT_KPI_KEYS];
    } catch {
      return [...DEFAULT_KPI_KEYS];
    }
  }

  private loadLayout(): 'horizontal' | 'stacked' {
    return (localStorage.getItem(LS_KEY_LAYOUT) as 'horizontal' | 'stacked') ?? 'horizontal';
  }
}
