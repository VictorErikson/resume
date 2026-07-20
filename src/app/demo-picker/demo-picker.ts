import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TextRollComponent } from '../shared/text-roll/text-roll.component';
import { BookstoreWakeService } from '../core/bookstore-wake.service';

interface ImageMedia {
  kind: 'image';
  src: string;
}

interface VideoMedia {
  kind: 'video';
  src: string;
  poster: string;
}

type PathMedia = ImageMedia | VideoMedia;

interface DemoPath {
  slug: string;
  link: string;
  icon: string;
  label: string;
  title: string;
  description: string;
  media: PathMedia;
}

@Component({
  selector: 'app-demo-picker',
  imports: [RouterLink, NgOptimizedImage, TextRollComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-picker.html',
  styleUrl: './demo-picker.scss',
})
export class DemoPicker {
  private readonly bookstoreWake = inject(BookstoreWakeService);

  protected readonly autoplayVideos = signal(false);

  protected readonly paths = signal<DemoPath[]>([
    {
      slug: 'internship',
      link: '/onboarding/integrations',
      icon: 'work',
      label: 'From the internship',
      title: 'Triggerbee work',
      description:
        'Features I rebuilt from my six-month internship: onboarding flows, live signals, and funnel analysis, running here on dummy data.',
      media: {
        kind: 'video',
        src: 'assets/demo-imgs/triggerbee_tall.mp4',
        poster: 'assets/demo-imgs/triggerbee_tall-poster.jpg',
      },
    },
    {
      slug: 'personal',
      link: '/projects',
      icon: 'rocket_launch',
      label: 'On my own time',
      title: 'Personal projects',
      description:
        'Six apps and games I built outside of work, from a flag-guessing globe to a working physical alarm system.',
      media: {
        kind: 'video',
        src: 'assets/demo-imgs/bookstore_tall.mp4',
        poster: 'assets/demo-imgs/bookstore_tall-poster.jpg',
      },
    },
  ]);

  constructor() {
    afterNextRender(() => {
      this.autoplayVideos.set(!matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.bookstoreWake.wake();
    });
  }
}
