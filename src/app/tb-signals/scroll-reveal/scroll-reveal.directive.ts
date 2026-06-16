import { AfterViewInit, Directive, ElementRef, DestroyRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: false,
})
export class ScrollRevealDirective implements AfterViewInit {
  readonly revealOffsetVh = input<number>(20);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    const offsetPx = Math.round((this.revealOffsetVh() / 100) * window.innerHeight);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.host.nativeElement.classList.add('is-revealed');
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: `0px 0px -${offsetPx}px 0px` },
    );
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
