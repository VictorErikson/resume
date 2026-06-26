import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LanguageService } from '../../i18n/language.service';
import { resolveTranslation } from '../../i18n/demo-i18n';
import { DemoNavService } from '../demo-nav/demo-nav.service';

type IntroMode = 'overlay' | 'button';

interface IntroDemo {
  titleKey: string;
  descKey: string;
}

const SEEN_KEY = 'demoIntroSeen';

const INTRO_DEMOS: IntroDemo[] = [
  { titleKey: 'demo-intro.onboarding.title', descKey: 'demo-intro.onboarding.desc' },
  { titleKey: 'demo-intro.signals.title', descKey: 'demo-intro.signals.desc' },
  { titleKey: 'demo-intro.funnels.title', descKey: 'demo-intro.funnels.desc' },
];

@Component({
  selector: 'app-demo-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-intro.component.html',
  styleUrl: './demo-intro.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class DemoIntroComponent {
  protected readonly nav = inject(DemoNavService);
  private readonly langService = inject(LanguageService);

  protected readonly demos = INTRO_DEMOS;

  private hasSeen = this.readSeen();
  protected readonly mode = signal<IntroMode>(this.hasSeen ? 'button' : 'overlay');
  protected readonly closing = signal(false);

  private readonly dialogEl = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly dismissBtn = viewChild<ElementRef<HTMLElement>>('dismissBtn');
  private readonly fabEl = viewChild<ElementRef<HTMLElement>>('fab');

  private readonly reducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    effect(() => {
      if (!this.nav.isInDemo()) return;
      if (this.mode() === 'overlay') {
        queueMicrotask(() => this.dialogEl()?.nativeElement.focus());
      }
    });

    effect((onCleanup) => {
      const locked = this.nav.isInDemo() && this.mode() === 'overlay';
      this.setScrollLock(locked);
      onCleanup(() => this.setScrollLock(false));
    });
  }

  private setScrollLock(locked: boolean): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = locked ? 'hidden' : '';
  }

  protected t(key: string): string {
    return resolveTranslation(key, this.langService.lang());
  }

  protected open(): void {
    this.closing.set(false);
    this.mode.set('overlay');
  }

  protected dismiss(): void {
    if (this.mode() !== 'overlay' || this.closing()) return;
    this.markSeen();
    if (this.reducedMotion) {
      this.finishDismiss();
      return;
    }
    this.closing.set(true);
  }

  protected onCloseAnimationEnd(event: AnimationEvent): void {
    if (event.target !== this.dialogEl()?.nativeElement) return;
    if (this.closing()) this.finishDismiss();
  }

  protected onEscape(): void {
    if (this.mode() === 'overlay') this.dismiss();
  }

  protected trapFocus(event: Event): void {
    event.preventDefault();
    this.dismissBtn()?.nativeElement.focus();
  }

  private finishDismiss(): void {
    this.closing.set(false);
    this.mode.set('button');
    queueMicrotask(() => this.fabEl()?.nativeElement.focus());
  }

  private markSeen(): void {
    this.hasSeen = true;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* sessionStorage unavailable — fall back to in-memory state */
    }
  }

  private readSeen(): boolean {
    try {
      return sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }
}
