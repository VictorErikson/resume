import { Component, DestroyRef, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, filter, take, timer } from 'rxjs';
import { CurrentContextService } from '../../core/current-context.service';
import { DataPlatformService } from '../../data-platform/data-platform.service';
import { getDimensionTypeLabel } from '../../data-platform/data-platform.utils';
import { DUMMY_ROWS, USE_DUMMY_DATA } from './hot-dimensions.dummy-data';

interface DimRow {
  label: string;
  count: number;
  barWidth: number;
  barBackground: string;
  trendPct: number | null;
  trendUp: boolean;
}

@Component({
  selector: 'app-hot-dimensions',
  standalone: false,
  providers: [DataPlatformService],
  templateUrl: './hot-dimensions.component.html',
  styleUrl: './hot-dimensions.component.scss',
})
export class HotDimensionsComponent implements OnInit {
  private readonly ctx = inject(CurrentContextService);
  private readonly dataPlatformService = inject(DataPlatformService);
  private readonly destroyRef = inject(DestroyRef);

  @Output() hasData = new EventEmitter<boolean>();

  public loading = true;
  public rows: DimRow[] = [];

  public ngOnInit(): void {
    this.ctx.currentContextBS
      .pipe(
        filter((c) => !!c?.account?.siteId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((c) => this.loadData(c!.account.siteId as number));
  }

  private loadData(siteId: number): void {
    this.loading = true;

    if (USE_DUMMY_DATA) {
      timer(300)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.rows = this.withBarBackgrounds(DUMMY_ROWS);
          this.loading = false;
          this.hasData.emit(this.rows.length > 0);
        });
      return;
    }

    const now = new Date();
    const last24h = {
      siteIds: [siteId],
      from: new Date(+now - 86_400_000).toISOString(),
      to: now.toISOString(),
    };
    const last30d = {
      siteIds: [siteId],
      from: new Date(+now - 30 * 86_400_000).toISOString(),
      to: now.toISOString(),
    };

    forkJoin({
      recent: this.dataPlatformService.getBreakdown(
        { filter: last24h, dimension: 'dimensions', topN: 20 },
        'hot-dimensions',
      ),
      baseline: this.dataPlatformService.getBreakdown(
        { filter: last30d, dimension: 'dimensions', topN: 20 },
        'hot-dimensions',
      ),
    })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ recent, baseline }) => {
        const recentRows = recent.data?.rows ?? [];
        const baselineMap = new Map((baseline.data?.rows ?? []).map((r) => [r.label, r.value]));

        const mapped = recentRows
          .filter((r) => !!r.label && !r.label.includes('[object Object]'))
          .map((r) => {
            const baselineTotal = baselineMap.get(r.label) ?? 0;
            const dailyAvg = baselineTotal / 30;
            const trendPct =
              dailyAvg > 0 ? Math.round(((r.value - dailyAvg) / dailyAvg) * 100) : null;
            return {
              label: this.formatLabel(r.label),
              count: r.value,
              barWidth: 0,
              trendPct,
              trendUp: (trendPct ?? 0) >= 0,
            };
          });

        const maxCount = Math.max(...mapped.map((r) => r.count), 1);
        const sized = mapped.map((r) => ({
          ...r,
          barWidth: Math.round((r.count / maxCount) * 100),
        }));
        this.rows = this.withBarBackgrounds(sized);
        this.loading = false;
        this.hasData.emit(this.rows.length > 0);
      });
  }

  private withBarBackgrounds<T extends { barWidth: number }>(rows: T[]): DimRow[] {
    const n = Math.max(rows.length, 1);
    return rows.map((r, i) => ({
      ...(r as unknown as DimRow),
      barBackground: `linear-gradient(to right,${this.interpolateColor(i / n)},${this.interpolateColor((i + 1) / n)})`,
    }));
  }

  private interpolateColor(t: number): string {
    const g = Math.round(217 + (153 - 217) * t);
    const b = Math.round(102 + (153 - 102) * t);
    return `rgb(255,${g},${b})`;
  }

  private formatLabel(composite: string): string {
    const idx = composite.indexOf(':');
    if (idx === -1) return composite;
    const type = composite.substring(0, idx);
    const value = composite.substring(idx + 1);
    return `${getDimensionTypeLabel(type)}: ${value}`;
  }
}
