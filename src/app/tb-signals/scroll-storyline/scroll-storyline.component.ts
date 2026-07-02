import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  NgZone,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-scroll-storyline',
  standalone: false,
  templateUrl: './scroll-storyline.component.html',
  styleUrl: './scroll-storyline.component.scss',
})
export class ScrollStorylineComponent implements AfterViewInit {
  readonly pathD = input<string>(
    'M 85 10 C 85 8 85 38 40 43 C -5 48 -5 70 60 76 C 105 80 80 100 68 100',
  );
  readonly viewBox = input<string>('0 0 100 100');
  readonly pathColor = input<string>('var(--tb-signals-storyline-color, #f9ab10)');
  readonly pathWidth = input<number>(2);
  readonly dashPattern = input<string>('8 6');
  readonly startAnchor = input<HTMLElement | null>(null);
  readonly endAnchor = input<HTMLElement | null>(null);
  readonly startOffsetPx = input<number>(0);
  readonly endOffsetPx = input<number>(0);
  readonly checkpoints = input<HTMLElement[]>([]);

  @ViewChild('maskPath', { static: true }) private maskPathRef!: ElementRef<SVGPathElement>;
  @ViewChild('dot', { static: true }) private dotRef!: ElementRef<HTMLDivElement>;

  protected readonly maskId = `storyline-${Math.random().toString(36).slice(2, 10)}`;

  private readonly viewBoxDims = computed(() => {
    const parts = this.viewBox().trim().split(/\s+/).map(Number);
    return { width: parts[2] || 100, height: parts[3] || 100 };
  });

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  private scrollTarget: HTMLElement | Window = window;
  private totalLength = 0;
  private readonly SAMPLE_COUNT = 240;
  private readonly samplesX = new Float32Array(this.SAMPLE_COUNT + 1);
  private readonly samplesY = new Float32Array(this.SAMPLE_COUNT + 1);
  private rafScheduled = false;
  private cachedStartY = 0;
  private cachedEndY = 0;
  private cachedContainerW = 0;
  private cachedContainerH = 0;
  private boundsValid = false;
  private lastWrittenProgress = -1;
  private resizeObserver: ResizeObserver | null = null;

  private readonly isTouch =
    typeof matchMedia === 'function' && matchMedia('(hover: none), (pointer: coarse)').matches;

  private checkpointProgress: number[] = [0, 1];
  private targetProgress = -1;
  private currentProgress = 0;
  private tweenFrom = 0;
  private tweenTo = 0;
  private tweenStart = 0;
  private tweenRaf = 0;
  private readonly TWEEN_MS = 650;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const maskPath = this.maskPathRef.nativeElement;
      this.totalLength = maskPath.getTotalLength();
      maskPath.style.strokeDasharray = `${this.totalLength}`;
      maskPath.style.strokeDashoffset = `${this.totalLength}`;

      for (let i = 0; i <= this.SAMPLE_COUNT; i++) {
        const p = maskPath.getPointAtLength((i / this.SAMPLE_COUNT) * this.totalLength);
        this.samplesX[i] = p.x;
        this.samplesY[i] = p.y;
      }

      this.scrollTarget = this.findScrollContainer(this.host.nativeElement);

      const onScrollOrResize = () => this.scheduleUpdate();
      this.scrollTarget.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize, { passive: true });

      this.resizeObserver = new ResizeObserver(() => {
        this.boundsValid = false;
        this.scheduleUpdate();
      });
      this.resizeObserver.observe(this.host.nativeElement);

      this.destroyRef.onDestroy(() => {
        this.scrollTarget.removeEventListener('scroll', onScrollOrResize);
        window.removeEventListener('resize', onScrollOrResize);
        this.resizeObserver?.disconnect();
        if (this.tweenRaf) cancelAnimationFrame(this.tweenRaf);
      });

      this.scheduleUpdate();
    });
  }

  private scheduleUpdate(): void {
    if (this.rafScheduled) return;
    this.rafScheduled = true;
    requestAnimationFrame(() => {
      this.rafScheduled = false;
      this.update();
    });
  }

  private update(): void {
    if (!this.boundsValid) {
      this.recomputeBounds();
    }
    if (this.cachedEndY <= this.cachedStartY) return;

    const scrollY = this.getScrollTop();
    const range = this.cachedEndY - this.cachedStartY;
    const raw = (scrollY - this.cachedStartY) / range;
    const progress = raw < 0 ? 0 : raw > 1 ? 1 : raw;

    if (this.isTouch) {
      this.updateCheckpointTarget(progress);
      return;
    }

    if (Math.abs(progress - this.lastWrittenProgress) < 0.0005) return;
    this.lastWrittenProgress = progress;
    this.render(progress);
  }

  private render(progress: number): void {
    this.maskPathRef.nativeElement.style.strokeDashoffset = `${this.totalLength * (1 - progress)}`;

    const dims = this.viewBoxDims();
    const scaleX = this.cachedContainerW / dims.width;
    const scaleY = this.cachedContainerH / dims.height;

    const pA = this.sampleAt(progress - 0.02);
    const pB = this.sampleAt(progress + 0.02);
    const angle = Math.atan2((pB.y - pA.y) * scaleY, (pB.x - pA.x) * scaleX) * (180 / Math.PI);

    const point = this.sampleAt(progress);
    const x = point.x * scaleX;
    const y = point.y * scaleY;
    this.dotRef.nativeElement.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${angle + 90}deg)`;
    this.dotRef.nativeElement.style.opacity = progress > 0 ? '1' : '0';
  }

  private updateCheckpointTarget(rawProgress: number): void {
    const cps = this.checkpointProgress;
    let reached = cps[0];
    for (let i = 0; i < cps.length; i++) {
      if (cps[i] <= rawProgress + 1e-4) reached = cps[i];
      else break;
    }
    if (reached === this.targetProgress) return;

    if (this.targetProgress < 0) {
      this.targetProgress = reached;
      this.currentProgress = reached;
      this.render(reached);
      return;
    }

    this.targetProgress = reached;
    this.tweenFrom = this.currentProgress;
    this.tweenTo = reached;
    this.tweenStart = performance.now();
    if (!this.tweenRaf) this.tweenRaf = requestAnimationFrame(this.tweenTick);
  }

  private readonly tweenTick = (): void => {
    const t = Math.min(1, (performance.now() - this.tweenStart) / this.TWEEN_MS);
    const eased = 1 - Math.pow(1 - t, 3);
    this.currentProgress = this.tweenFrom + (this.tweenTo - this.tweenFrom) * eased;
    this.render(this.currentProgress);
    if (t < 1) {
      this.tweenRaf = requestAnimationFrame(this.tweenTick);
    } else {
      this.currentProgress = this.tweenTo;
      this.render(this.currentProgress);
      this.tweenRaf = 0;
    }
  };

  private sampleAt(progress: number): { x: number; y: number } {
    const clamped = progress < 0 ? 0 : progress > 1 ? 1 : progress;
    const f = clamped * this.SAMPLE_COUNT;
    const i = Math.min(this.SAMPLE_COUNT - 1, Math.floor(f));
    const t = f - i;
    return {
      x: this.samplesX[i] + (this.samplesX[i + 1] - this.samplesX[i]) * t,
      y: this.samplesY[i] + (this.samplesY[i + 1] - this.samplesY[i]) * t,
    };
  }

  private recomputeBounds(): void {
    const hostEl = this.host.nativeElement;
    const hostRect = hostEl.getBoundingClientRect();
    this.cachedContainerW = hostEl.clientWidth;
    this.cachedContainerH = hostEl.clientHeight;

    const scrollTop = this.getScrollTop();
    const containerOffset = this.getContainerTopOffset();

    const startEl = this.startAnchor();
    const endEl = this.endAnchor();
    const viewportH = window.innerHeight;

    if (startEl) {
      const r = startEl.getBoundingClientRect();
      this.cachedStartY =
        r.top + scrollTop - containerOffset - viewportH * 0.3 + this.startOffsetPx();
    } else {
      this.cachedStartY = hostRect.top + scrollTop - containerOffset + this.startOffsetPx();
    }

    if (endEl) {
      const r = endEl.getBoundingClientRect();
      this.cachedEndY =
        r.bottom + scrollTop - containerOffset - viewportH * 1.2 - this.endOffsetPx();
    } else {
      this.cachedEndY =
        hostRect.bottom + scrollTop - containerOffset - viewportH - this.endOffsetPx();
    }

    if (this.isTouch) {
      this.recomputeCheckpoints(scrollTop, containerOffset, viewportH);
    }

    this.boundsValid = true;
  }

  private recomputeCheckpoints(scrollTop: number, containerOffset: number, viewportH: number): void {
    const range = this.cachedEndY - this.cachedStartY;
    if (range <= 0) {
      this.checkpointProgress = [0, 1];
      return;
    }
    const values = new Set<number>([0, 1]);
    for (const el of this.collectCheckpointEls()) {
      const r = el.getBoundingClientRect();
      const y = r.top + scrollTop - containerOffset - viewportH * 0.6;
      const p = (y - this.cachedStartY) / range;
      values.add(p < 0 ? 0 : p > 1 ? 1 : p);
    }
    this.checkpointProgress = [...values].sort((a, b) => a - b);
    this.targetProgress = -1;
  }

  private collectCheckpointEls(): HTMLElement[] {
    const provided = this.checkpoints();
    if (provided.length) return provided;
    const root: ParentNode = this.host.nativeElement.parentElement ?? document;
    return Array.from(root.querySelectorAll('[appscrollreveal]')) as HTMLElement[];
  }

  private getScrollTop(): number {
    const t = this.scrollTarget;
    return t === window ? window.scrollY : (t as HTMLElement).scrollTop;
  }

  private getContainerTopOffset(): number {
    const t = this.scrollTarget;
    if (t === window) return 0;
    return (t as HTMLElement).getBoundingClientRect().top;
  }

  private findScrollContainer(start: HTMLElement): HTMLElement | Window {
    let el: HTMLElement | null = start.parentElement;
    while (el && el !== document.body) {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        return el;
      }
      el = el.parentElement;
    }
    return window;
  }
}
