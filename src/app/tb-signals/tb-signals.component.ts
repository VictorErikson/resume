import {
  Component,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TrafficOverviewDataService } from './traffic-overview/traffic-overview-data.service';
import { STAT_CARDS, StatCard } from './live-feed/live-feed.dummy-data';
import { FlyoutService } from '../flyout/flyout.service';
@Component({
  selector: 'app-tb-signals',
  standalone: false,
  templateUrl: './tb-signals.component.html',
  styleUrl: './tb-signals.component.scss',
})
export class TbSignalsComponent implements OnInit, OnDestroy {
  readonly trafficData = inject(TrafficOverviewDataService);
  readonly flyout = inject(FlyoutService);
  readonly statCards: StatCard[] = STAT_CARDS;
  hotDimensionsHasData = true;
  liveFunnelHasData = true;
  @ViewChild('cv', { static: false }) private set canvasRef(el: ElementRef<HTMLCanvasElement>) {
    if (!el) return;
    this.initCanvas(el.nativeElement);
  }

  protected readonly pointerFine =
    typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

  private readonly hexW = 76;
  private readonly hexH = 66;
  private readonly colPitchX = 60;
  private readonly rowPitch = 69;
  private readonly colOffsetY = this.rowPitch / 2;
  private readonly xShift = -this.colPitchX / 2;

  private readonly GLOW_RADIUS = 160;
  private readonly GLOW_PEAK_ALPHA = 0.08;
  private readonly TRAIL_FADE_ALPHA = 0.04;
  private readonly GLOW_RGB = '244, 199, 73';

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private trailCanvas: HTMLCanvasElement | null = null;
  private trailCtx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private mouseX = 0;
  private mouseY = 0;
  private mouseActive = false;
  private lastMoveTime = 0;
  private readonly IDLE_THRESHOLD_MS = 250;
  private rafId = 0;
  private hexPath: Path2D | null = null;
  private bgColor = '#ffffff';

  private zone = inject(NgZone);

  private initCanvas(canvas: HTMLCanvasElement): void {
    if (!this.pointerFine) return;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.hexPath = this.buildHexPath();
    this.bgColor =
      getComputedStyle(document.documentElement).getPropertyValue('--appBg').trim() || '#f2f5f8';
    this.trailCanvas = document.createElement('canvas');
    this.trailCtx = this.trailCanvas.getContext('2d');
    this.resize();
    this.zone.runOutsideAngular(() => {
      const tick = () => {
        this.render();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }

  ngOnInit(): void {
    this.trafficData.initialize();
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resize();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.mouseActive = true;
    this.lastMoveTime = Date.now();
  }

  @HostListener('window:mouseout', ['$event'])
  onMouseOut(e: MouseEvent): void {
    if (!e.relatedTarget) this.mouseActive = false;
  }

  private resize(): void {
    const canvas = this.canvas;
    if (!canvas) return;
    this.dpr = window.devicePixelRatio || 1;
    this.cssW = window.innerWidth;
    this.cssH = window.innerHeight;
    const pw = Math.floor(this.cssW * this.dpr);
    const ph = Math.floor(this.cssH * this.dpr);
    canvas.width = pw;
    canvas.height = ph;
    canvas.style.width = `${this.cssW}px`;
    canvas.style.height = `${this.cssH}px`;
    this.ctx!.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.trailCanvas && this.trailCtx) {
      this.trailCanvas.width = pw;
      this.trailCanvas.height = ph;
      this.trailCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  private buildHexPath(): Path2D {
    const w = this.hexW;
    const h = this.hexH;
    const p = new Path2D();
    p.moveTo(0.25 * w, 0);
    p.lineTo(0.75 * w, 0);
    p.lineTo(w, 0.5 * h);
    p.lineTo(0.75 * w, h);
    p.lineTo(0.25 * w, h);
    p.lineTo(0, 0.5 * h);
    p.closePath();
    return p;
  }

  private render(): void {
    const ctx = this.ctx;
    const tCtx = this.trailCtx;
    if (!ctx || !tCtx || !this.trailCanvas || !this.hexPath) return;

    tCtx.globalCompositeOperation = 'destination-out';
    tCtx.fillStyle = `rgba(0, 0, 0, ${this.TRAIL_FADE_ALPHA})`;
    tCtx.fillRect(0, 0, this.cssW, this.cssH);

    if (this.mouseActive && Date.now() - this.lastMoveTime < this.IDLE_THRESHOLD_MS) {
      tCtx.globalCompositeOperation = 'source-over';
      const grad = tCtx.createRadialGradient(
        this.mouseX,
        this.mouseY,
        0,
        this.mouseX,
        this.mouseY,
        this.GLOW_RADIUS,
      );
      grad.addColorStop(0, `rgba(${this.GLOW_RGB}, ${this.GLOW_PEAK_ALPHA})`);
      grad.addColorStop(1, `rgba(${this.GLOW_RGB}, 0)`);
      tCtx.fillStyle = grad;
      tCtx.fillRect(
        this.mouseX - this.GLOW_RADIUS,
        this.mouseY - this.GLOW_RADIUS,
        this.GLOW_RADIUS * 2,
        this.GLOW_RADIUS * 2,
      );
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.drawImage(this.trailCanvas, 0, 0, this.cssW, this.cssH);

    ctx.fillStyle = this.bgColor;
    const cols = Math.ceil(this.cssW / this.colPitchX) + 2;
    const rows = Math.ceil(this.cssH / this.rowPitch) + 2;
    for (let c = 0; c < cols; c++) {
      const isOddCol = c % 2 === 1;
      const y0 = isOddCol ? -this.colOffsetY : 0;
      const left = this.xShift + c * this.colPitchX;
      for (let r = 0; r < rows; r++) {
        const top = y0 + r * this.rowPitch;
        ctx.save();
        ctx.translate(left, top);
        ctx.fill(this.hexPath);
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
