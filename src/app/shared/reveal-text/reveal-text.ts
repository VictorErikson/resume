import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Renders `text` as a sequence of words that "rise + fade" into view when the
 * element scrolls into the viewport — a lightweight, pure-CSS analog of the
 * anime.js SplitText effect. Words are split reactively from the `text` signal,
 * so translations (EN/SV toggle) re-render correctly without stale DOM.
 */
@Component({
  selector: 'app-reveal-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (word of words(); track $index) {<span class="rw"
      ><span class="rw-i" [style.--wi]="$index">{{ word }}</span></span
    >@if (!$last) {<span class="rw-space">{{ ' ' }}</span>}}`,
  styles: `
    :host {
      display: inline;
    }
    .rw {
      display: inline-block;
      overflow: hidden;
      vertical-align: top;
      padding-bottom: 0.12em;
      margin-bottom: -0.12em;
    }
    .rw-i {
      display: inline-block;
      transform: translateY(110%);
      opacity: 0;
      transition:
        transform 0.9s cubic-bezier(0.22, 0.61, 0.36, 1),
        opacity 0.8s ease;
      transition-delay: calc(var(--wi) * 90ms);
    }
    :host(.revealed) .rw-i {
      transform: none;
      opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
      .rw-i {
        transform: none;
        opacity: 1;
        transition: none;
      }
    }
  `,
  host: {
    '[class.revealed]': 'revealed()',
  },
})
export class RevealTextComponent {
  readonly text = input.required<string>();

  protected readonly words = computed(() => this.text().trim().split(/\s+/));
  protected readonly revealed = signal(false);

  private readonly hostEl = inject(ElementRef<HTMLElement>);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const reducedMotion =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion || typeof IntersectionObserver === 'undefined') {
        this.revealed.set(true);
        return;
      }

      const el = this.hostEl.nativeElement as HTMLElement;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.revealed.set(true);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 },
      );
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
