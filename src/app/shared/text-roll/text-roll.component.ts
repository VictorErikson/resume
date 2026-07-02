import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface RollChar {
  readonly ch: string;
  readonly index: number;
}

@Component({
  selector: 'app-text-roll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-roll.component.html',
  styleUrl: './text-roll.component.scss',
  host: {
    '[class.text-roll--reveal]': 'reveal()',
    '[class.text-roll--revealed]': 'revealed()',
    '[class.text-roll--rolling]': 'rolling()',
    '[style.--tr-duration]': "rollMs() + 'ms'",
  },
})
export class TextRollComponent {
  readonly text = input.required<string>();
  readonly mode = input<'hover' | 'auto'>('hover');
  readonly interval = input(6000);
  readonly jitter = input(4000);
  readonly startDelay = input(0);
  readonly reveal = input(false);

  protected readonly rolling = signal(false);
  protected readonly revealed = signal(false);

  private readonly revealDurationMs = 900;
  private readonly revealStaggerMs = 90;

  protected readonly rollMs = computed(() => (this.mode() === 'auto' ? 900 : 400));
  protected readonly waveMs = computed(() => (this.mode() === 'auto' ? 55 : 25));

  protected readonly words = computed<RollChar[][]>(() => {
    let index = 0;
    return this.text()
      .split(' ')
      .map((word) => Array.from(word).map((ch) => ({ ch, index: index++ })));
  });

  private readonly charCount = computed(() => Array.from(this.text()).length);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (!this.reveal()) {
        this.revealed.set(true);
        return;
      }
      const reducedMotion =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion || typeof IntersectionObserver === 'undefined') {
        this.revealed.set(true);
        return;
      }
      const el = this.hostEl.nativeElement;
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
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    effect((onCleanup) => {
      if (this.mode() !== 'auto' || !isPlatformBrowser(this.platformId)) return;
      if (this.reveal() && !this.revealed()) return;

      const introMs = this.reveal()
        ? this.revealDurationMs + this.text().split(' ').length * this.revealStaggerMs
        : 0;
      const timers = new Set<ReturnType<typeof setTimeout>>();

      const scheduleNext = (wait: number): void => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          this.playOnce(timers);
          scheduleNext(this.nextWait());
        }, wait);
        timers.add(timer);
      };
      scheduleNext(introMs + this.startDelay());

      onCleanup(() => {
        timers.forEach((t) => clearTimeout(t));
        this.rolling.set(false);
      });
    });
  }

  private nextWait(): number {
    return this.interval() + Math.random() * this.jitter();
  }

  private playOnce(timers: Set<ReturnType<typeof setTimeout>>): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.rolling.set(true);
    const settle = this.rollMs() + this.charCount() * this.waveMs();
    const reset = setTimeout(() => {
      this.rolling.set(false);
      timers.delete(reset);
    }, settle);
    timers.add(reset);
  }
}
