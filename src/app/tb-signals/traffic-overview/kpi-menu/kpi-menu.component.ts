import { Component, ElementRef, input, output, ViewChild, ViewEncapsulation } from '@angular/core';
import type { ChartConfiguration } from 'chart.js';

export interface VisibleKpiCard {
  key: string;
  labelKey: string;
  tooltipKey?: string;
  icon?: string;
  formattedValue: string;
  suffix?: string;
  loading: boolean;
  error: boolean;
  changePercent: number | null;
  chartData?: ChartConfiguration['data'];
  chartOptions?: ChartConfiguration['options'];
}

@Component({
  selector: 'app-traffic-kpi-menu',
  standalone: false,
  templateUrl: './kpi-menu.component.html',
  styleUrl: './kpi-menu.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TrafficKpiMenuComponent {
  readonly siteEntries = input<{ id: number; name: string }[]>([]);
  readonly selectedSiteLabel = input<string>('');
  readonly selectedDateLabelKey = input<string>('dateRange.last30days');
  readonly kpiLayout = input<'horizontal' | 'stacked'>('horizontal');
  readonly visibleKpiCards = input<VisibleKpiCard[]>([]);
  readonly emptyKpiSlots = input<number[]>([]);
  readonly showKpiScrollChevrons = input<boolean>(false);
  readonly kpiScrollDisabled = input<boolean>(false);

  readonly selectedChartKpiKey = input<string>('sessions');

  readonly siteChanged = output<number>();
  readonly dateRangeChanged = output<{ days: number; labelKey: string }>();
  readonly layoutChanged = output<'horizontal' | 'stacked'>();
  readonly openKpiSettings = output<void>();
  readonly kpiCardClicked = output<string>();

  @ViewChild('kpiGridEl') kpiGridEl?: ElementRef<HTMLElement>;

  onSiteChanged(id: number): void {
    this.siteChanged.emit(id);
  }

  setDateRange(days: number, labelKey: string): void {
    this.dateRangeChanged.emit({ days, labelKey });
  }

  setKpiLayout(layout: 'horizontal' | 'stacked'): void {
    this.layoutChanged.emit(layout);
  }

  openKpiSettingsFlyout(): void {
    this.openKpiSettings.emit();
  }

  scrollKpiGrid(direction: 'left' | 'right'): void {
    const el = this.kpiGridEl?.nativeElement;
    if (!el) return;
    const cardWidth = el.querySelector('.dashboard-new-kpi-card')?.clientWidth ?? 260;
    el.scrollBy({
      left: direction === 'right' ? (cardWidth + 16) * 2 : -(cardWidth + 16) * 2,
      behavior: 'smooth',
    });
  }
}
