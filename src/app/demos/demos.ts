import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

interface DemoCard {
  link: string;

  image: string;

  imageAlt: string;
  headline: string;
  description: string;
}

@Component({
  selector: 'app-demos',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './demos.scss',
  template: `
    <main class="demos">
      <header class="demos-head">
        <a class="back-link" routerLink="/">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          Back to resume
        </a>
        <h1 class="title">Product demos</h1>
        <p class="subtitle">
          A few interactive features I built at Triggerbee, rebuilt here with dummy data.
        </p>
      </header>

      <ul class="card-grid">
        @for (card of cards(); track card.link) {
          <li>
            <a class="card" [routerLink]="card.link">
              <span class="card-media">
                <img [ngSrc]="card.image" [alt]="card.imageAlt" fill priority />
              </span>
              <span class="card-body">
                <span class="card-headline">{{ card.headline }}</span>
                <span class="card-text">{{ card.description }}</span>
                <span class="card-cta">
                  Open demo
                  <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </span>
              </span>
            </a>
          </li>
        }
      </ul>
    </main>
  `,
})
export class Demos {
  protected readonly cards = signal<DemoCard[]>([
    {
      link: '/onboarding',
      image: 'img/snapshots/onboarding.png',
      imageAlt: 'Onboarding flow screenshot',
      headline: 'Onboarding',
      description:
        'A guided, multi-step flow that takes a new customer from sign-up all the way to a working tracking script on their site.',
    },
    {
      link: '/tb-signals',
      image: 'img/snapshots/signals.png',
      imageAlt: 'Signals dashboard screenshot',
      headline: 'Signals',
      description:
        'Live KPI dashboards and conversion signals that surface what is driving visitor behaviour in real time.',
    },
    {
      link: '/funnels',
      image: 'img/snapshots/funnel.png',
      imageAlt: 'Funnels analysis screenshot',
      headline: 'Funnels',
      description:
        'Build and analyse multi-step conversion funnels to see exactly where visitors move forward — or drop off.',
    },
  ]);
}
