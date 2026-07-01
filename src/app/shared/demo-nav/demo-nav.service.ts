import { computed, inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

export interface Demo {
  label: string;
  route: string;
  matchPrefixes: string[];
  titleKey: string;
  descKey: string;
}

const DEMOS: Demo[] = [
  {
    label: 'Onboarding',
    route: '/onboarding',
    matchPrefixes: ['/onboarding', '/sv/onboarding'],
    titleKey: 'demo-intro.onboarding.title',
    descKey: 'demo-intro.onboarding.desc',
  },
  {
    label: 'TB Signals',
    route: '/tb-signals',
    matchPrefixes: ['/tb-signals'],
    titleKey: 'demo-intro.signals.title',
    descKey: 'demo-intro.signals.desc',
  },
  {
    label: 'Funnels',
    route: '/funnels',
    matchPrefixes: ['/funnels'],
    titleKey: 'demo-intro.funnels.title',
    descKey: 'demo-intro.funnels.desc',
  },
];

@Injectable({ providedIn: 'root' })
export class DemoNavService {
  private readonly router = inject(Router);

  readonly demos = DEMOS;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly currentIndex = computed(() => {
    const url = this.url();
    return DEMOS.findIndex((d) => d.matchPrefixes.some((p) => url.startsWith(p)));
  });

  readonly isInDemo = computed(() => this.currentIndex() >= 0);
  readonly current = computed<Demo | null>(() => DEMOS[this.currentIndex()] ?? null);
  readonly prev = computed<Demo | null>(() => DEMOS[this.currentIndex() - 1] ?? null);
  readonly next = computed<Demo | null>(() => DEMOS[this.currentIndex() + 1] ?? null);
}
