import {
  AfterViewInit,
  Directive,
  ElementRef,
  DestroyRef,
  inject,
  input,
  NgZone,
} from '@angular/core';

@Directive({
  selector: '[appScrollPin]',
  standalone: false,
})
export class ScrollPinDirective implements AfterViewInit {
  readonly pinId = input<string>('');
  readonly pinScrollDistanceVh = input<number>(150);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  private scrollTarget: HTMLElement | Window = window;
  private rafScheduled = false;
  private cachedTopY = 0;
  private cachedRangePx = 0;
  private lastWritten = -1;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.scrollTarget = this.findScrollContainer(this.host.nativeElement);

      const onScrollOrResize = () => this.scheduleUpdate();
      this.scrollTarget.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize, { passive: true });

      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleUpdate();
      });
      this.resizeObserver.observe(this.host.nativeElement);

      this.destroyRef.onDestroy(() => {
        this.scrollTarget.removeEventListener('scroll', onScrollOrResize);
        window.removeEventListener('resize', onScrollOrResize);
        this.resizeObserver?.disconnect();
        const id = this.pinId();
        if (id) document.body.style.removeProperty(`--pin-${id}-progress`);
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
    this.recomputeBounds();
    if (this.cachedRangePx <= 0) return;

    const scrollY = this.getScrollTop();
    const raw = (scrollY - this.cachedTopY) / this.cachedRangePx;
    const progress = raw < 0 ? 0 : raw > 1 ? 1 : raw;

    if (Math.abs(progress - this.lastWritten) < 0.001) return;
    this.lastWritten = progress;

    const value = progress.toFixed(4);
    this.host.nativeElement.style.setProperty('--pin-progress', value);
    const id = this.pinId();
    if (id) {
      document.body.style.setProperty(`--pin-${id}-progress`, value);

      if (id === 'whatshot') {
        const progNum = parseFloat(value);
        const sessionsCard = document.querySelector('.wh-card--sessions') as HTMLElement;
        const topPagesCard = document.querySelector('.wh-card--toppages') as HTMLElement;

        if (sessionsCard) {
          const sessionsTranslate = (0.45 - progNum) * 160;
          sessionsCard.style.setProperty('transform', `translateX(${sessionsTranslate}vw)`);
        }
        if (topPagesCard) {
          const topPagesTranslate = (0.8 - progNum) * 160;
          topPagesCard.style.setProperty('transform', `translateX(${topPagesTranslate}vw)`);
        }

        const kpiSlot = document.querySelector('.wh-kpi-slot') as HTMLElement;
        if (kpiSlot) {
          const kpiTranslate = (1 - Math.min(1, progNum / 0.25)) * -100;
          kpiSlot.style.setProperty('transform', `translateX(${kpiTranslate}%)`);
        }
      }
    }
  }

  private recomputeBounds(): void {
    const hostEl = this.host.nativeElement;
    const rect = hostEl.getBoundingClientRect();
    const scrollTop = this.getScrollTop();
    const containerOffset = this.getContainerTopOffset();
    this.cachedTopY = rect.top + scrollTop - containerOffset;
    this.cachedRangePx = hostEl.clientHeight - window.innerHeight;
    if (this.cachedRangePx < 1) this.cachedRangePx = 1;
  }

  private getScrollTop(): number {
    return this.scrollTarget === window
      ? window.scrollY
      : (this.scrollTarget as HTMLElement).scrollTop;
  }

  private getContainerTopOffset(): number {
    if (this.scrollTarget === window) return 0;
    return (this.scrollTarget as HTMLElement).getBoundingClientRect().top;
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
