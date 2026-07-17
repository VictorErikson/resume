import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type RollDirection = 'up' | 'down';

interface RollState {
  readonly from: string;
  readonly to: string;
  readonly direction: RollDirection;
}

@Component({
  selector: 'app-number-roll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './number-roll.component.html',
  styleUrl: './number-roll.component.scss',
})
export class NumberRollComponent {
  readonly value = input.required<number>();
  readonly digits = input(0);

  protected readonly settled = signal<number | null>(null);
  protected readonly roll = signal<RollState | null>(null);

  protected readonly formatted = computed(() => this.format(this.settled() ?? this.value()));

  private readonly platformId = inject(PLATFORM_ID);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const next = this.value();
      const current = this.settled();

      if (current === null) {
        this.settled.set(next);
        return;
      }
      if (next === current) {
        return;
      }

      const reducedMotion =
        !isPlatformBrowser(this.platformId) ||
        matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        this.settled.set(next);
        return;
      }

      clearTimeout(this.timer);
      this.roll.set({
        from: this.format(current),
        to: this.format(next),
        direction: next > current ? 'up' : 'down',
      });
      this.timer = setTimeout(() => {
        this.roll.set(null);
        this.settled.set(next);
      }, 320);
    });
  }

  private format(n: number): string {
    return String(n).padStart(this.digits(), '0');
  }
}
