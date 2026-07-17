import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TextRollComponent } from '../shared/text-roll/text-roll.component';
import { NumberRollComponent } from '../shared/number-roll/number-roll.component';

interface VideoMedia {
  kind: 'video';
  src: string;
  poster: string;
}

interface ImageMedia {
  kind: 'image';
  src: string;
}

type DemoMedia = VideoMedia | ImageMedia;

interface PersonalDemo {
  slug: string;
  name: string;
  icon: string;
  media: DemoMedia;
  description: string;
  stack: string[];
  link: string;
}

@Component({
  selector: 'app-personal-projects',
  imports: [RouterLink, TextRollComponent, NumberRollComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './personal-projects.html',
  styleUrl: './personal-projects.scss',
})
export class PersonalProjects {
  private readonly rail = viewChild.required<ElementRef<HTMLUListElement>>('rail');
  private readonly destroyRef = inject(DestroyRef);
  private scrollFrame = 0;

  protected readonly dragging = signal(false);
  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private dragMoved = false;
  private wheelLockUntil = 0;

  private autoplayTimer?: ReturnType<typeof setInterval>;
  private resumeTimer?: ReturnType<typeof setTimeout>;
  private autoDirection = 1;
  private hovering = false;

  protected readonly demos = signal<PersonalDemo[]>([
    {
      slug: 'country-explorer',
      name: 'CountryExplorer',
      icon: 'public',
      media: {
        kind: 'video',
        src: 'assets/demo-imgs/country-explorer-preview.mp4',
        poster: 'assets/demo-imgs/country-explorer-poster.jpg',
      },
      description:
        'Browse the world’s countries, save favourites, and test yourself with a quiz and a geo-guessing game.',
      stack: [
        'React',
        'TypeScript',
        'Redux Toolkit',
        'REST',
        'Google Maps',
        'Accessibility',
        'Responsive',
      ],
      link: 'https://victorerikson.github.io/CountryExplorer2/',
    },
    {
      slug: 'bookstore',
      name: 'Bookstore',
      icon: 'menu_book',
      media: {
        kind: 'video',
        src: 'assets/demo-imgs/bookstore-preview.mp4',
        poster: 'assets/demo-imgs/bookstore-poster.jpg',
      },
      description:
        'Browse, search, and check out titles in an e-commerce storefront backed by a headless CMS.',
      stack: [
        'React',
        'TypeScript',
        'Tailwind CSS',
        'Strapi',
        'Accessibility',
        'Mobile-first',
        'Responsive',
      ],
      link: 'https://victorerikson.github.io/bookStore/',
    },
    {
      slug: 'tamagotchi',
      name: 'Tamagotchi',
      icon: 'smart_toy',
      media: {
        kind: 'video',
        src: 'assets/demo-imgs/tamagotchi-preview.mp4',
        poster: 'assets/demo-imgs/tamagotchi-poster.jpg',
      },
      description:
        'A virtual pet to feed, play with, and keep alive, an exercise in object-oriented programming.',
      stack: ['TypeScript', 'SCSS', 'OOP', 'Responsive'],
      link: 'https://victorerikson.github.io/Tamaguchi/',
    },
    {
      slug: 'hangman',
      name: 'Hangman',
      icon: 'match_word',
      media: { kind: 'image', src: 'assets/demo-imgs/hangman.webp' },
      description: 'The classic word-guessing game, one wrong letter at a time.',
      stack: ['React', 'TypeScript', 'Bootstrap', 'Responsive'],
      link: 'https://victorerikson.github.io/hangman/',
    },
    {
      slug: 'art-gallery',
      name: 'Art Gallery',
      icon: 'palette',
      media: { kind: 'image', src: 'assets/demo-imgs/art-gallery.webp' },
      description: 'A curated online exhibition space with a page for each painting.',
      stack: ['HTML', 'CSS', 'JavaScript', 'Mobile-first', 'Responsive'],
      link: 'https://victorerikson.github.io/art-gallery/',
    },
    {
      slug: 'alarm-system',
      name: 'Alarm System',
      icon: 'lock',
      media: { kind: 'image', src: 'assets/demo-imgs/alarm-system.webp' },
      description:
        'Frontend for a physical alarm built with fellow students over a summer project, enroll users with a code or RFID tag, then arm or disarm the hardware from here. Running on dummy data in this demo.',
      stack: ['Angular', 'TypeScript', 'REST', 'Accessibility', 'Responsive'],
      link: 'https://victorerikson.github.io/alarm-system/',
    },
  ]);

  protected readonly activeIndex = signal(1);
  protected readonly activeDemo = computed(() => this.demos()[this.activeIndex()]);
  protected readonly totalLabel = computed(() => String(this.demos().length).padStart(2, '0'));
  protected readonly autoplayVideos = signal(false);

  constructor() {
    afterNextRender(() => {
      this.scrollToIndex(this.activeIndex(), 'instant');
      this.autoplayVideos.set(!matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.startAutoplay();
    });

    this.destroyRef.onDestroy(() => {
      clearInterval(this.autoplayTimer);
      clearTimeout(this.resumeTimer);
    });
  }

  protected onRailScroll(): void {
    if (this.scrollFrame) {
      return;
    }
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      this.activeIndex.set(this.nearestIndex());
    });
  }

  protected select(index: number): void {
    this.pauseAutoplay();
    this.scrollToIndex(index, this.scrollBehavior());
  }

  protected distance(index: number): number {
    return Math.abs(index - this.activeIndex());
  }

  protected previous(): void {
    this.select(Math.max(0, this.activeIndex() - 1));
  }

  protected next(): void {
    this.select(Math.min(this.demos().length - 1, this.activeIndex() + 1));
  }

  protected onRailPointerDown(event: PointerEvent): void {
    this.pauseAutoplay();
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartScroll = this.rail().nativeElement.scrollLeft;
    this.dragMoved = false;
  }

  protected onRailPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - this.dragStartX;
    if (!this.dragMoved && Math.abs(dx) > 5) {
      this.dragMoved = true;
      this.dragging.set(true);
      this.rail().nativeElement.setPointerCapture(event.pointerId);
    }
    if (this.dragMoved) {
      event.preventDefault();
      this.rail().nativeElement.scrollLeft = this.dragStartScroll - dx;
    }
  }

  protected onRailPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    this.dragPointerId = null;
    if (this.dragMoved) {
      this.dragMoved = false;
      this.dragging.set(false);
      this.scrollToIndex(this.nearestIndex(), this.scrollBehavior());
    }
  }

  protected onRailWheel(event: WheelEvent): void {
    event.preventDefault();
    this.pauseAutoplay();
    const now = Date.now();
    if (now < this.wheelLockUntil) {
      return;
    }
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < 4) {
      return;
    }
    this.wheelLockUntil = now + 350;
    const last = this.demos().length - 1;
    const target = this.activeIndex() + (delta > 0 ? 1 : -1);
    this.scrollToIndex(Math.min(last, Math.max(0, target)), this.scrollBehavior());
  }

  protected onCarouselPointerEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    this.hovering = true;
    clearInterval(this.autoplayTimer);
    this.autoplayTimer = undefined;
  }

  protected onCarouselPointerLeave(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    this.hovering = false;
    if (this.resumeTimer === undefined) {
      this.startAutoplay();
    }
  }

  protected pauseAutoplay(): void {
    clearInterval(this.autoplayTimer);
    this.autoplayTimer = undefined;
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.resumeTimer = undefined;
      this.startAutoplay();
    }, 12000);
  }

  private startAutoplay(): void {
    if (this.hovering || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    clearInterval(this.autoplayTimer);
    this.autoplayTimer = setInterval(() => this.autoAdvance(), 3500);
  }

  private autoAdvance(): void {
    const last = this.demos().length - 1;
    const current = this.activeIndex();
    if (current >= last) {
      this.autoDirection = -1;
    } else if (current <= 0) {
      this.autoDirection = 1;
    }
    this.scrollToIndex(current + this.autoDirection, this.scrollBehavior());
  }

  private slides(): HTMLElement[] {
    return Array.from(this.rail().nativeElement.querySelectorAll('li'));
  }

  private nearestIndex(): number {
    const rail = this.rail().nativeElement;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let minDistance = Number.POSITIVE_INFINITY;
    this.slides().forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = index;
      }
    });
    return nearest;
  }

  private scrollToIndex(index: number, behavior: ScrollBehavior): void {
    const rail = this.rail().nativeElement;
    const slide = this.slides()[index];
    if (!slide) {
      return;
    }
    rail.scrollTo({
      left: slide.offsetLeft + slide.offsetWidth / 2 - rail.clientWidth / 2,
      behavior,
    });
  }

  private scrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  }
}
