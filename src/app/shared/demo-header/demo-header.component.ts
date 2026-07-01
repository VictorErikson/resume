import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DemoNavService } from '../demo-nav/demo-nav.service';
import { LanguageService } from '../../i18n/language.service';
import { resolveTranslation } from '../../i18n/demo-i18n';

@Component({
  selector: 'app-demo-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-header.component.html',
  styleUrl: './demo-header.component.scss',
})
export class DemoHeaderComponent {
  protected readonly nav = inject(DemoNavService);
  private readonly langService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly headerEl = viewChild<ElementRef<HTMLElement>>('header');
  private resizeObserver?: ResizeObserver;
  private readonly pinned = signal(true);

  protected readonly title = computed(() => {
    const demo = this.nav.current();
    return demo ? resolveTranslation(demo.titleKey, this.langService.lang()) : '';
  });

  protected readonly desc = computed(() => {
    const demo = this.nav.current();
    return demo ? resolveTranslation(demo.descKey, this.langService.lang()) : '';
  });

  constructor() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
    }

    if (typeof matchMedia === 'function') {
      const mql = matchMedia('(min-width: 421px)');
      this.pinned.set(mql.matches);
      const onMedia = () => this.pinned.set(mql.matches);
      mql.addEventListener('change', onMedia);
      this.destroyRef.onDestroy(() => mql.removeEventListener('change', onMedia));
    }

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.setSpace(0, 0);
    });

    effect(() => {
      const el = this.headerEl()?.nativeElement;
      this.title();
      this.desc();
      this.nav.isInDemo();
      this.pinned();

      this.resizeObserver?.disconnect();
      if (el) this.resizeObserver?.observe(el);

      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => this.measure());
      } else {
        this.measure();
      }
    });
  }

  private measure(): void {
    const el = this.headerEl()?.nativeElement;
    if (!el || !this.nav.isInDemo()) {
      this.setSpace(0, 0);
      return;
    }
    const height = el.offsetHeight;
    this.setSpace(height, this.pinned() ? height : 0);
  }

  private setSpace(space: number, fixed: number): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement.style;
    root.setProperty('--demo-header-space', `${space}px`);
    root.setProperty('--demo-header-fixed', `${fixed}px`);
  }
}
