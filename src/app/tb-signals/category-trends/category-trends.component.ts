import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { take, forkJoin, map, timer } from 'rxjs';
import { DataPlatformService } from '../../data-platform/data-platform.service';
import {
  DataPlatformBreakdownRow,
  DataPlatformEventFilter,
  DataPlatformGraphSeries,
} from '../../data-platform/data-platform.model';
import { getDimensionTypeLabel } from '../../data-platform/data-platform.utils';
import { USE_DUMMY_DATA, DUMMY_SERIES } from './category-trends.dummy-data';

const SVG_W = 760;
const SVG_H = 248;
const CL = 40;
const CT = 12;
const CR = 12;
const CB = 28;
const CW = SVG_W - CL - CR;
const CH = SVG_H - CT - CB;

const COLORS = ['#f9ab10', '#6366f1', '#10b981', '#f43f5e'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CategoryLine {
  label: string;
  color: string;
  linePath: string;
  areaPath: string;
  points: { x: number; y: number; value: number; display: string }[];
  total: number;
}

interface InsightCard {
  label: string;
  category: string;
  sub: string;
  color: string;
}

interface YLabel {
  value: number;
  y: number;
}

export interface DimensionTab {
  prefix: string;
  label: string;
  rows: DataPlatformBreakdownRow[];
}

@Component({
  selector: 'app-category-trends',
  standalone: false,
  providers: [DataPlatformService],
  templateUrl: './category-trends.component.html',
  styleUrl: './category-trends.component.scss',
})
export class CategoryTrendsComponent implements AfterViewInit {
  lines: CategoryLine[] = [];
  insights: InsightCard[] = [];
  xLabels: { label: string; x: number }[] = [];
  yLabels: YLabel[] = [];
  loading = true;
  empty = false;
  tabs: DimensionTab[] = [];
  selectedPrefix = '';
  hoverIndex: number | null = null;
  hoverPixelX: number | null = null;
  svgRenderedW = SVG_W;

  readonly svgW = SVG_W;
  readonly svgH = SVG_H;
  readonly svgChartTop = CT;
  readonly chartBottom = CT + CH;

  get axisLabelSize(): number {
    return (12 * SVG_W) / this.svgRenderedW;
  }

  private _siteIds: number[] = [];
  private _dateFilter: { from: string; to: string } | null = null;
  private baseFilter: DataPlatformEventFilter | null = null;

  private readonly dataPlatformService = inject(DataPlatformService);
  private readonly translate = inject(TranslateService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input() set siteIds(ids: number[]) {
    this._siteIds = ids ?? [];
    this.tryRefresh();
  }

  @Input() set dateFilter(f: { from: string; to: string } | null) {
    this._dateFilter = f;
    this.tryRefresh();
  }

  ngAfterViewInit(): void {
    this.measureSvg();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.measureSvg();
  }

  onChartMouseMove(event: MouseEvent): void {
    if (!this.lines.length || !this.lines[0].points.length) return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * SVG_W;
    const pts = this.lines[0].points;
    let nearestIdx = 0;
    let minDist = Math.abs(pts[0].x - svgX);
    for (let i = 1; i < pts.length; i++) {
      const dist = Math.abs(pts[i].x - svgX);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    if (svgX >= CL && svgX <= SVG_W - CR) {
      this.hoverIndex = nearestIdx;
      this.hoverPixelX = (pts[nearestIdx].x / SVG_W) * rect.width;
    } else {
      this.hoverIndex = null;
      this.hoverPixelX = null;
    }
  }

  onChartMouseLeave(): void {
    this.hoverIndex = null;
    this.hoverPixelX = null;
  }

  private fmt(value: number): string {
    if (!value) return '0';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return Math.round(value).toLocaleString('sv-SE');
  }

  private measureSvg(): void {
    const svg = this.elementRef.nativeElement.querySelector('.ct-svg');
    const w = svg?.getBoundingClientRect().width;
    if (w && w > 0) this.svgRenderedW = w;
  }

  private tryRefresh(): void {
    if (!this._siteIds.length || !this._dateFilter) return;
    this.loading = true;
    this.lines = [];
    this.insights = [];
    this.empty = false;
    this.tabs = [];
    this.selectedPrefix = '';
    this.fetchData();
  }

  private fetchData(): void {
    if (USE_DUMMY_DATA) {
      this.tabs = [{ prefix: 'category', label: 'Category', rows: [] }];
      this.selectedPrefix = 'category';
      timer(400)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.build(DUMMY_SERIES);
          this.loading = false;
        });
      return;
    }

    this.baseFilter = {
      siteIds: this._siteIds,
      from: this._dateFilter!.from,
      to: this._dateFilter!.to,
    };

    this.dataPlatformService
      .getBreakdown(
        { filter: this.baseFilter, dimension: 'dimensions', topN: 50 },
        'category-trends',
      )
      .pipe(take(1))
      .subscribe((r) => {
        const groups = new Map<string, DataPlatformBreakdownRow[]>();
        for (const row of r.data?.rows ?? []) {
          const prefix = row.label?.split(':')[0];
          if (!prefix || prefix === 'url' || row.label.includes('[object Object]')) continue;
          if (!groups.has(prefix)) groups.set(prefix, []);
          groups.get(prefix)!.push(row);
        }

        if (!groups.size) {
          this.empty = true;
          this.loading = false;
          return;
        }

        this.tabs = Array.from(groups.entries())
          .map(([prefix, rows]) => ({
            prefix,
            label: getDimensionTypeLabel(prefix) || prefix,
            rows,
            total: rows.reduce((sum, r) => sum + r.value, 0),
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map(({ prefix, label, rows }) => ({ prefix, label, rows }));

        forkJoin(
          this.tabs.map((tab) => {
            const topRows = tab.rows.slice(0, 4);
            return forkJoin(
              topRows.map((row) =>
                this.dataPlatformService.getGraph(
                  {
                    filter: this.baseFilter!,
                    granularity: 'month',
                    metric: 'sessions',
                    dimensionFilter: row.label,
                  },
                  'category-trends',
                ),
              ),
            ).pipe(
              map((results) => ({
                tab,
                series: topRows.map((row, i) => ({
                  label: row.label.replace(tab.prefix + ':', ''),
                  dataPoints: results[i].data?.series?.[0]?.dataPoints ?? [],
                })),
              })),
            );
          }),
        )
          .pipe(take(1))
          .subscribe((tabResults) => {
            const valid = tabResults.filter((tr) => tr.series.some((s) => s.dataPoints.length > 0));
            this.tabs = valid.map((tr) => tr.tab);

            if (!this.tabs.length) {
              this.empty = true;
              this.loading = false;
              return;
            }

            const first = valid[0];
            this.selectedPrefix = first.tab.prefix;
            this.build(first.series.filter((s) => s.dataPoints.length > 0));
            this.loading = false;
          });
      });
  }

  selectTab(tab: DimensionTab): void {
    if (tab.prefix === this.selectedPrefix || !this._dateFilter) return;
    this.selectedPrefix = tab.prefix;
    this.loading = true;
    this.lines = [];
    this.insights = [];
    this.empty = false;
    this.fetchGraphs(tab);
  }

  private fetchGraphs(tab: DimensionTab): void {
    const topRows = tab.rows.slice(0, 4);
    const graphRequests = topRows.map((row) => ({
      filter: this.baseFilter!,
      granularity: 'month' as const,
      metric: 'sessions' as const,
      dimensionFilter: row.label,
    }));

    forkJoin(graphRequests.map((req) => this.dataPlatformService.getGraph(req, 'category-trends')))
      .pipe(take(1))
      .subscribe({
        next: (results) => {
          const series = topRows.map((row, i) => ({
            label: row.label.replace(tab.prefix + ':', ''),
            dataPoints: results[i].data?.series?.[0]?.dataPoints ?? [],
          }));
          const hasData = series.some((s) => s.dataPoints.length > 0);
          if (!hasData) {
            this.tabs = this.tabs.filter((t) => t.prefix !== tab.prefix);
            const next = this.tabs[0];
            if (next) {
              this.selectedPrefix = next.prefix;
              this.fetchGraphs(next);
              return;
            }
            this.empty = true;
            this.loading = false;
          } else {
            this.build(series.filter((s) => s.dataPoints.length > 0));
            this.loading = false;
          }
        },
        error: () => {
          this.empty = true;
          this.loading = false;
        },
      });
  }

  private build(series: DataPlatformGraphSeries[]): void {
    const withTotals = series
      .map((s) => ({
        ...s,
        dataPoints: [...s.dataPoints].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
        total: s.dataPoints.reduce((sum, p) => sum + p.value, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    const n = withTotals[0].dataPoints.length;
    const xStep = n > 1 ? CW / (n - 1) : 0;
    const xs = Array.from({ length: n }, (_, i) => CL + i * xStep);

    this.xLabels = withTotals[0].dataPoints.map((p, i) => {
      const iso =
        p.timestamp.includes('Z') || p.timestamp.includes('+') ? p.timestamp : p.timestamp + 'Z';
      const d = new Date(iso);
      return { label: MONTHS[d.getUTCMonth()] ?? String(i + 1), x: xs[i] };
    });

    this.yLabels = [0, 25, 50, 75, 100].map((pct) => ({
      value: pct,
      y: CT + CH - (pct / 100) * CH,
    }));

    this.lines = withTotals.map((s, idx) => {
      const seriesMax = Math.max(...s.dataPoints.map((p) => p.value)) || 1;
      const points = s.dataPoints.map((p, i) => ({
        x: xs[i],
        y: CT + CH - (p.value / seriesMax) * CH,
        value: p.value,
        display: this.fmt(p.value),
      }));
      return {
        label: s.label,
        color: COLORS[idx],
        linePath: this.smoothPath(points),
        areaPath: this.areaPath(points),
        points,
        total: s.total,
      };
    });

    this.insights = this.buildInsights(withTotals);
  }

  private buildInsights(series: (DataPlatformGraphSeries & { total: number })[]): InsightCard[] {
    const top = series[0];
    let fastGrow = series[0];
    let maxGrowth = -Infinity;
    for (const s of series) {
      const pts = s.dataPoints.map((p) => p.value);
      const half = Math.floor(pts.length / 2);
      const h1 = pts.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
      const h2 = pts.slice(-half).reduce((a, b) => a + b, 0) / (half || 1);
      const growth = h1 === 0 ? 0 : (h2 - h1) / h1;
      if (growth > maxGrowth) {
        maxGrowth = growth;
        fastGrow = s;
      }
    }
    let spikeEntry = series[0];
    let maxSpike = -Infinity;
    let spikePeakLabel = '';
    for (const s of series) {
      const vals = s.dataPoints.map((p) => p.value);
      const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const spike = avg === 0 ? 0 : (Math.max(...vals) - Math.min(...vals)) / avg;
      if (spike > maxSpike) {
        maxSpike = spike;
        spikeEntry = s;
        const peakIdx = vals.indexOf(Math.max(...vals));
        spikePeakLabel = this.xLabels[peakIdx]?.label ?? '';
      }
    }
    let consistent = series[0];
    let minCV = Infinity;
    for (const s of series) {
      const vals = s.dataPoints.map((p) => p.value);
      const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (vals.length || 1);
      const cv = mean === 0 ? Infinity : Math.sqrt(variance) / mean;
      if (cv < minCV) {
        minCV = cv;
        consistent = s;
      }
    }

    const growthPct = `${maxGrowth >= 0 ? '+' : ''}${Math.round(maxGrowth * 100)}% H1→H2`;
    const topIdx = series.indexOf(top);
    const growIdx = series.indexOf(fastGrow);
    const spikeIdx = series.indexOf(spikeEntry);
    const conIdx = series.indexOf(consistent);

    const t = (key: string, params?: object) =>
      this.translate.instant(`tb-signals.category-trends.insights.${key}`, params);
    return [
      {
        label: t('top'),
        category: top.label,
        sub: t('sessions', { count: top.total.toLocaleString() }),
        color: COLORS[topIdx] ?? COLORS[0],
      },
      {
        label: t('fastest-growing'),
        category: fastGrow.label,
        sub: growthPct,
        color: COLORS[growIdx] ?? COLORS[1],
      },
      {
        label: t('seasonal-spike'),
        category: spikeEntry.label,
        sub: spikePeakLabel ? t('peak-in', { month: spikePeakLabel }) : t('high-variance'),
        color: COLORS[spikeIdx] ?? COLORS[2],
      },
      {
        label: t('most-consistent'),
        category: consistent.label,
        sub: t('low-variance'),
        color: COLORS[conIdx] ?? COLORS[3],
      },
    ];
  }

  private smoothPath(pts: { x: number; y: number }[]): string {
    if (!pts.length) return '';
    if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  private areaPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    const bottom = CT + CH;
    return `${this.smoothPath(pts)} L${pts[pts.length - 1].x},${bottom} L${pts[0].x},${bottom}Z`;
  }
}
