import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  ViewEncapsulation,
} from '@angular/core';

const SVG_W = 680;
const SVG_H = 200;
const CL = 44;
const CT = 12;
const CR = 12;
const CB = 28;
const CW = SVG_W - CL - CR;
const CH = SVG_H - CT - CB;

@Component({
  selector: 'app-traffic-sessions-chart',
  standalone: false,
  templateUrl: './sessions-chart.component.html',
  styleUrl: './sessions-chart.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TrafficSessionsChartComponent implements AfterViewInit {
  private readonly elementRef = inject(ElementRef);

  @Input() loading = false;
  @Input() titleKey = 'tb-signals.kpi.sessions.label';
  @Input() descriptionKey = 'tb-signals.sessions-chart.description';

  private _valueFormat: 'number' | 'percent' | 'duration' = 'number';
  private _lastDataPoints: { timestamp: string; value: number }[] = [];

  @Input() set valueFormat(f: 'number' | 'percent' | 'duration') {
    this._valueFormat = f;
    this.buildSessionChart(this._lastDataPoints);
  }

  @Input() set dataPoints(pts: { timestamp: string; value: number }[]) {
    this._lastDataPoints = pts ?? [];
    this.buildSessionChart(this._lastDataPoints);
  }

  readonly svgW = SVG_W;
  readonly svgH = SVG_H;
  readonly svgChartTop = CT;
  readonly svgChartBottom = CT + CH;
  svgRenderedW = SVG_W;

  sessionLinePath = '';
  sessionAreaPath = '';
  sessionXLabels: { label: string; x: number }[] = [];
  sessionYLabels: { value: string; y: number }[] = [];
  sessionPoints: { x: number; y: number; value: number; display: string }[] = [];
  hoverPoint: { x: number; y: number; value: number; display: string } | null = null;

  get axisLabelSize(): number {
    return (10 * SVG_W) / this.svgRenderedW;
  }
  get hoverLabelSize(): number {
    return (12 * SVG_W) / this.svgRenderedW;
  }

  ngAfterViewInit(): void {
    this.measureSvg();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.measureSvg();
  }

  onChartMouseMove(event: MouseEvent): void {
    if (!this.sessionPoints.length) return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * SVG_W;
    let nearest = this.sessionPoints[0];
    let minDist = Math.abs(nearest.x - svgX);
    for (const pt of this.sessionPoints) {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        nearest = pt;
      }
    }
    this.hoverPoint = svgX >= CL && svgX <= SVG_W - CR ? nearest : null;
  }

  onChartMouseLeave(): void {
    this.hoverPoint = null;
  }

  private fmt(value: number): string {
    if (this._valueFormat === 'percent') {
      return value % 1 === 0 ? `${value}%` : `${value.toFixed(1)}%`;
    }
    if (this._valueFormat === 'duration') {
      if (!value) return '0s';
      const m = Math.floor(value / 60);
      const s = Math.round(value % 60);
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }
    if (!value) return '0';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return Math.round(value).toLocaleString('sv-SE');
  }

  private measureSvg(): void {
    const svg = this.elementRef.nativeElement.querySelector('.session-chart');
    const w = svg?.getBoundingClientRect().width;
    if (w && w > 0) this.svgRenderedW = w;
  }

  private buildSessionChart(dataPoints: { timestamp: string; value: number }[]): void {
    if (!dataPoints.length || dataPoints.length < 2) {
      this.sessionLinePath = '';
      this.sessionAreaPath = '';
      this.sessionXLabels = [];
      this.sessionYLabels = [];
      this.sessionPoints = [];
      this.hoverPoint = null;
      return;
    }

    const maxVal = Math.max(...dataPoints.map((p) => p.value)) || 1;
    const yMax = Math.ceil(maxVal / 10) * 10 || 10;
    const xStep = CW / (dataPoints.length - 1);

    const pts = dataPoints.map((p, i) => ({
      x: CL + i * xStep,
      y: CT + CH - (p.value / yMax) * CH,
      value: p.value,
      display: this.fmt(p.value),
    }));
    this.sessionPoints = pts;
    this.sessionLinePath = this.smoothPath(pts);
    this.sessionAreaPath = `${this.sessionLinePath} L${pts[pts.length - 1].x},${CT + CH} L${pts[0].x},${CT + CH}Z`;

    const labelStep = Math.max(1, Math.floor(dataPoints.length / 7));
    const lastIdx = dataPoints.length - 1;
    this.sessionXLabels = dataPoints.reduce<{ label: string; x: number }[]>((acc, p, i) => {
      if (i === lastIdx || (i % labelStep === 0 && i < lastIdx - labelStep + 1)) {
        const iso =
          p.timestamp.includes('Z') || p.timestamp.includes('+') ? p.timestamp : p.timestamp + 'Z';
        const d = new Date(iso);
        acc.push({ label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, x: CL + i * xStep });
      }
      return acc;
    }, []);

    this.sessionYLabels = [0, 0.33, 0.67, 1].map((frac) => ({
      value: this.fmt(Math.round(yMax * frac)),
      y: CT + CH - frac * CH,
    }));
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
}
