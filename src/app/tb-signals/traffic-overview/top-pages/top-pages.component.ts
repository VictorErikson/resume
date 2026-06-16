import { Component, Input, ViewEncapsulation } from '@angular/core';

interface PageRow {
  label: string;
  count: number;
  barWidth: number;
  barBackground: string;
  countDisplay: string;
}

@Component({
  selector: 'app-traffic-top-pages',
  standalone: false,
  templateUrl: './top-pages.component.html',
  styleUrl: './top-pages.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TrafficTopPagesComponent {
  @Input() loading = false;

  pages: PageRow[] = [];
  barYLabels: string[] = [];

  @Input() set pageRows(rows: { label: string; value: number }[]) {
    if (!rows?.length) {
      this.pages = [];
      this.barYLabels = [];
      return;
    }
    const maxPage = Math.max(...rows.map((r) => r.value), 1);
    const n = Math.max(rows.length, 1);
    this.pages = rows.map((r, i) => ({
      label: r.label,
      count: r.value,
      barWidth: Math.round((r.value / maxPage) * 100),
      barBackground: `linear-gradient(to right,${this.interpolateColor(i / n)},${this.interpolateColor((i + 1) / n)})`,
      countDisplay: this.formatCount(r.value),
    }));
    this.barYLabels = [1, 0.67, 0.33, 0].map((f) => this.formatCount(Math.round(maxPage * f)));
  }

  private formatCount(value: number): string {
    if (!value) return '0';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return Math.round(value).toLocaleString('sv-SE');
  }

  private interpolateColor(t: number): string {
    const g = Math.round(217 + (153 - 217) * t);
    const b = Math.round(102 + (153 - 102) * t);
    return `rgb(255,${g},${b})`;
  }
}
