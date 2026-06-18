import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../i18n/language.service';

type ContactKind = 'copy' | 'link' | 'static';

interface Contact {
  symbol: string;
  label: string;
  value: string;
  kind: ContactKind;
  href?: string;

  materialIcon?: string;
}

interface Education {
  school: string;
  program: string;
  years: string;
}

interface Logo {
  src: string;
  alt: string;
}

interface Skill {
  name: string;
  level: number;
}

interface PieSlice {
  label: string;
  sliceColor: string;
  labelColor: string;
}

interface CompanyRef {
  name: string;
  years: string;
}

interface Experience {
  icon: string;
  companies: CompanyRef[];
  title: string;
  bullets: string[];

  variant?: string;
}

@Component({
  selector: 'app-resume',
  imports: [RouterLink],
  templateUrl: './resume.html',
  styleUrl: './resume.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:wheel)': 'onWheel($event)',
  },
})
export class Resume {
  protected readonly name = signal('Victor Eriksson');

  private readonly langService = inject(LanguageService);
  protected readonly t = this.langService.translations;
  protected readonly lang = this.langService.lang;

  protected readonly contacts = computed<Contact[]>(() => {
    const tr = this.t();
    return [
      {
        symbol: 'phone',
        kind: 'copy',
        label: tr.contacts.telephone,
        value: tr.contacts.telephoneValue,
      },
      {
        symbol: 'email',
        kind: 'copy',
        label: tr.contacts.email,
        value: 'Victoreriksson_93@hotmail.com',
      },
      {
        symbol: 'github',
        kind: 'link',
        label: tr.contacts.github,
        value: '',
        href: 'https://github.com/VictorErikson',
      },
      {
        symbol: 'linkedin',
        kind: 'link',
        label: tr.contacts.linkedin,
        value: '',
        href: 'https://www.linkedin.com/in/victor-eriksson-aa22a4334',
      },
      {
        symbol: 'location',
        materialIcon: 'location_on',
        kind: 'static',
        label: tr.contacts.address,
        value: tr.contacts.addressValue,
      },
      { symbol: 'usa', kind: 'static', label: '', value: tr.contacts.authorizedToWork },
    ];
  });

  protected readonly copied = signal<string | null>(null);

  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly langsTrack = viewChild<ElementRef<HTMLElement>>('langsTrack');
  private readonly toolsTrack = viewChild<ElementRef<HTMLElement>>('toolsTrack');

  private readonly speed = 0.4;
  private direction = 1;
  private draggingEl: HTMLElement | null = null;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private readonly positions = new WeakMap<HTMLElement, number>();
  private reducedMotion = false;
  private rafId = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.reducedMotion =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.rafId = requestAnimationFrame(this.tick);

      const host = this.hostEl.nativeElement as HTMLElement;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 },
      );
      host
        .querySelectorAll<HTMLElement>(
          '.line, .exp-left, .exp-company-header, .side-heading.underline, .exp-title',
        )
        .forEach((el) => observer.observe(el));
      destroyRef.onDestroy(() => observer.disconnect());
    });
    destroyRef.onDestroy(() => cancelAnimationFrame(this.rafId));
  }

  private readonly tick = (): void => {
    this.advance(this.langsTrack()?.nativeElement);
    this.advance(this.toolsTrack()?.nativeElement);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private advance(el: HTMLElement | undefined): void {
    const loop = this.loopWidth(el);
    if (!el || loop <= 0) {
      return;
    }
    if (el === this.draggingEl) {
      this.positions.set(el, el.scrollLeft);
      return;
    }
    let pos = this.positions.get(el) ?? el.scrollLeft;
    if (!this.reducedMotion) {
      pos += this.speed * this.direction;
    }
    pos = ((pos % loop) + loop) % loop;
    this.positions.set(el, pos);
    el.scrollLeft = pos;
  }

  private loopWidth(el: HTMLElement | undefined): number {
    if (!el || el.children.length < 2) {
      return 0;
    }
    const half = el.children.length / 2;
    return (
      (el.children[half] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft
    );
  }

  protected onWheel(event: WheelEvent): void {
    if (event.deltaY === 0) {
      return;
    }
    this.direction = event.deltaY > 0 ? 1 : -1;
  }

  protected onPointerDown(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    this.draggingEl = el;
    this.dragStartX = event.clientX;
    this.dragStartScroll = el.scrollLeft;
    el.setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (el !== this.draggingEl) {
      return;
    }
    let next = this.dragStartScroll - (event.clientX - this.dragStartX);
    const loop = this.loopWidth(el);
    if (loop > 0) {
      next = ((next % loop) + loop) % loop;
    }
    el.scrollLeft = next;
  }

  protected onPointerUp(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (el !== this.draggingEl) {
      return;
    }
    this.draggingEl = null;
    this.positions.set(el, el.scrollLeft);
    el.releasePointerCapture(event.pointerId);
  }

  protected readonly languageLogos = signal<Logo[]>([
    { src: 'img/logos/TS.png', alt: 'TypeScript' },
    { src: 'img/logos/JS.png', alt: 'JavaScript' },
    { src: 'img/logos/React.png', alt: 'React' },
    { src: 'img/logos/angular.jpg', alt: 'Angular' },
    { src: 'img/logos/HTML.png', alt: 'HTML5' },
    { src: 'img/logos/CSS.png', alt: 'CSS3' },
    { src: 'img/logos/Sass.png', alt: 'Sass' },
    { src: 'img/logos/Tailwind.png', alt: 'Tailwind' },
    { src: 'img/logos/Bootstrap.png', alt: 'Bootstrap' },
    { src: 'img/logos/Node.png', alt: 'Node.js' },
    { src: 'img/logos/json2.png', alt: 'JSON' },
  ]);

  protected readonly toolLogos = signal<Logo[]>([
    { src: 'img/logos/vite.png', alt: 'Vite' },
    { src: 'img/logos/npm.png', alt: 'npm' },
    { src: 'img/logos/git.png', alt: 'Git' },
    { src: 'img/logos/github.svg', alt: 'GitHub' },
    { src: 'img/logos/MU.jpg', alt: 'Material UI' },
    { src: 'img/logos/AngularMaterial.png', alt: 'Angular Material' },
    { src: 'img/logos/eslint.png', alt: 'ESLint' },
    { src: 'img/logos/prettier.png', alt: 'Prettier' },
    { src: 'img/logos/figma.svg', alt: 'Figma' },
    { src: 'img/logos/Axios.png', alt: 'Axios' },
    { src: 'img/logos/supabase.webp', alt: 'Supabase' },
    { src: 'img/logos/vitest.webp', alt: 'Vitest' },
    { src: 'img/logos/playwright.webp', alt: 'Playwright' },
  ]);

  protected async copyValue(contact: Contact): Promise<void> {
    try {
      await navigator.clipboard.writeText(contact.value);
      this.copied.set(contact.label);
      setTimeout(() => this.copied.set(null), 1500);
    } catch {}
  }

  protected copyAriaLabel(label: string): string {
    return this.t().aria.copyTemplate.replace('{label}', label.toLowerCase());
  }

  protected profileAriaLabel(label: string): string {
    return this.t().aria.profileTemplate.replace('{label}', label);
  }

  protected readonly education = signal<Education[]>([
    {
      school: 'STANFORD',
      program: 'Python: Fundamentals to AI applications',
      years: 'Summer 2026',
    },
    { school: 'NACKADEMIN', program: 'Frontend Developer', years: '2024-2026' },
    { school: 'ABF Stockholm', program: 'Programming - JS, HTML, CSS', years: '2024' },
    { school: 'GAMLEBY College', program: 'TV-Production Specialist', years: '2012-2014' },
  ]);

  protected readonly hardSkills = signal<Skill[]>([
    { name: 'JavaScript', level: 100 },
    { name: 'TypeScript', level: 100 },
    { name: 'React', level: 100 },
    { name: 'Angular', level: 100 },
    { name: 'HTML', level: 100 },
    { name: 'CSS', level: 100 },
    { name: 'Tailwind/Bootstrap', level: 90 },
    { name: 'Swift', level: 60 },
    { name: 'Express', level: 45 },
    { name: 'SQL', level: 30 },
  ]);

  protected readonly softSkills = signal<PieSlice[]>([
    { label: 'Troubleshooting', sliceColor: '#4a5d8f', labelColor: '#9aaad8' },
    { label: 'Graphic design', sliceColor: '#e0533d', labelColor: '#ef8472' },
    { label: 'Leadership', sliceColor: '#e2b93b', labelColor: '#e9c860' },
    { label: 'Creativity', sliceColor: '#5aa06a', labelColor: '#82c592' },
  ]);

  protected readonly experiences = computed<Experience[]>(() => {
    const tr = this.t();
    return [
      {
        icon: 'code',
        variant: 'triggerbee',
        companies: [{ name: 'Triggerbee', years: '2025-2026' }],
        title: tr.experiences[0].title,
        bullets: tr.experiences[0].bullets,
      },
      {
        icon: 'film',
        companies: [
          { name: 'Zodiak Post', years: '2013-2025' },
          { name: 'SVT', years: '2024' },
          { name: 'ITV', years: '2021-2023' },
          { name: 'Nexiko', years: '2022' },
          { name: 'Freemantle', years: '2021' },
          { name: 'STHLM POST', years: '2018-2019' },
        ],
        title: tr.experiences[1].title,
        bullets: tr.experiences[1].bullets,
      },
    ];
  });
}
