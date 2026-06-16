import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { en } from './en';
import { sv } from './sv';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly router = inject(Router);

  readonly lang: Signal<'en' | 'sv'> = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => (this.router.url.startsWith('/sv') ? ('sv' as const) : ('en' as const))),
    ),
    { initialValue: this.router.url.startsWith('/sv') ? ('sv' as const) : ('en' as const) },
  );

  readonly translations = computed(() => (this.lang() === 'sv' ? sv : en));
}
