import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  OnInit,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, forkJoin, take, timer } from 'rxjs';
import { CurrentContextService } from '../../core/current-context.service';
import { DataPlatformService } from '../../data-platform/data-platform.service';
import { DataPlatformEventFilter } from '../../data-platform/data-platform.model';
import { DUMMY_RATES, USE_DUMMY_DATA } from './signal-rings.dummy-data';

interface RingRow {
  key: 'identified' | 'returning' | 'highIntent';
  label: string;
  desc: string;
  barWidthPct: number;
}

const HIGH_INTENT_SCORE_THRESHOLD = 70;
const VISITS_SAMPLE_SIZE = 500;

@Component({
  selector: 'app-signal-rings',
  standalone: false,
  providers: [DataPlatformService],
  templateUrl: './signal-rings.component.html',
  styleUrl: './signal-rings.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SignalRingsComponent implements OnInit, AfterViewInit {
  private readonly currentContextService = inject(CurrentContextService);
  private readonly dataPlatformService = inject(DataPlatformService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  @ViewChildren('counter') counters!: QueryList<ElementRef<HTMLElement>>;

  public loading = true;
  public identifiedRate = 0;
  public returningRate = 0;
  public highIntentRate = 0;
  public animationsArmed = false;

  private isScrollDriven = false;

  public readonly rows: RingRow[] = [
    {
      key: 'identified',
      label: 'tb-signals.signal-rings.identified.label',
      desc: 'tb-signals.signal-rings.identified.desc',
      barWidthPct: 90,
    },
    {
      key: 'returning',
      label: 'tb-signals.signal-rings.returning.label',
      desc: 'tb-signals.signal-rings.returning.desc',
      barWidthPct: 70,
    },
    {
      key: 'highIntent',
      label: 'tb-signals.signal-rings.high-intent.label',
      desc: 'tb-signals.signal-rings.high-intent.desc',
      barWidthPct: 50,
    },
  ];

  ngOnInit(): void {
    this.currentContextService.currentContextBS
      .pipe(
        filter((ctx) => !!ctx?.account?.siteId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((ctx) => this.loadData(ctx!.account.siteId));
  }

  ngAfterViewInit(): void {
    this.isScrollDriven = !!this.findScrollPinAncestor();
    if (this.isScrollDriven) {
      this.elementRef.nativeElement.classList.add('is-scroll-driven');
      this.setupScrollDrivenAnimations();
    }
    this.counters.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.animationsArmed) this.runCounters();
    });
  }

  private loadData(siteId: number): void {
    this.loading = true;
    this.animationsArmed = false;

    if (USE_DUMMY_DATA) {
      setTimeout(() => {
        this.identifiedRate = DUMMY_RATES.identifiedRate;
        this.returningRate = DUMMY_RATES.returningRate;
        this.highIntentRate = DUMMY_RATES.highIntentRate;
        this.loading = false;
        this.armAnimations();
      }, 400);
      return;
    }

    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const eventFilter: DataPlatformEventFilter = {
      siteIds: [siteId],
      from: from.toISOString(),
      to: now.toISOString(),
    };

    forkJoin({
      total: this.dataPlatformService.getProfiles(
        { filter: eventFilter, page: 1, pageSize: 1, includeTotalCount: true },
        'signal-rings',
      ),
      identified: this.dataPlatformService.getProfiles(
        {
          filter: { ...eventFilter, identifierFilter: '*' },
          page: 1,
          pageSize: 1,
          includeTotalCount: true,
        },
        'signal-rings',
      ),
      returning: this.dataPlatformService.getProfiles(
        {
          filter: { ...eventFilter, minVisits: 2 },
          page: 1,
          pageSize: 1,
          includeTotalCount: true,
        },
        'signal-rings',
      ),
      visits: this.dataPlatformService.getVisits(
        {
          filter: eventFilter,
          page: 1,
          pageSize: VISITS_SAMPLE_SIZE,
          includeTotalCount: false,
          includeEvents: false,
        },
        'signal-rings',
      ),
    })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        const totalProfiles = r.total.data?.totalCount ?? 0;
        const identifiedProfiles = r.identified.data?.totalCount ?? 0;
        const returningProfiles = r.returning.data?.totalCount ?? 0;
        const visitRows = r.visits.data?.visits ?? [];

        this.identifiedRate =
          totalProfiles > 0 ? Math.round((identifiedProfiles / totalProfiles) * 100) : 0;
        this.returningRate =
          totalProfiles > 0 ? Math.round((returningProfiles / totalProfiles) * 100) : 0;
        const highIntentVisits = visitRows.filter(
          (v) => v.engagementScore >= HIGH_INTENT_SCORE_THRESHOLD,
        ).length;
        this.highIntentRate =
          visitRows.length > 0 ? Math.round((highIntentVisits / visitRows.length) * 100) : 0;

        this.loading = false;
        this.armAnimations();
      });
  }

  private armAnimations(): void {
    if (!this.isScrollDriven) {
      this.animationsArmed = true;
      timer(0)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.runCounters());
    }
  }

  private runCounters(): void {
    this.zone.runOutsideAngular(() => {
      const ringsByKey: Record<RingRow['key'], number> = {
        identified: this.identifiedRate,
        returning: this.returningRate,
        highIntent: this.highIntentRate,
      };

      this.counters.forEach((ref) => {
        const el = ref.nativeElement;
        const rowKey = el.dataset['rowKey'] as RingRow['key'] | undefined;
        if (!rowKey) return;
        const target = ringsByKey[rowKey];
        const rowIndex = this.rows.findIndex((r) => r.key === rowKey);
        const startDelay = 800 + rowIndex * 150;
        setTimeout(() => this.animateNumber(el, 0, target, 1200), startDelay);
      });
    });
  }

  private animateNumber(targetEl: HTMLElement, from: number, to: number, durationMs: number): void {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      const unit = targetEl.querySelector('.counter-unit');
      if (unit) {
        targetEl.firstChild!.textContent = `${value}`;
      } else {
        targetEl.textContent = `${value}%`;
      }
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private findScrollPinAncestor(): HTMLElement | null {
    let el: HTMLElement | null = this.elementRef.nativeElement;
    while (el) {
      if (el.classList.contains('scroll-pin')) return el;
      el = el.parentElement;
    }
    return null;
  }

  private findScrollContainer(start: HTMLElement): HTMLElement | Window {
    let el: HTMLElement | null = start.parentElement;
    while (el && el !== document.body) {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        return el;
      }
      el = el.parentElement;
    }
    return window;
  }

  private setupScrollDrivenAnimations(): void {
    this.zone.runOutsideAngular(() => {
      const scrollTarget = this.findScrollContainer(this.elementRef.nativeElement);

      const updateProgress = () => {
        const pinProgressStr =
          getComputedStyle(document.body).getPropertyValue('--pin-rings-progress') || '0';
        const pinProgress = parseFloat(pinProgressStr);

        const rows = this.elementRef.nativeElement.querySelectorAll('.row');

        rows.forEach((row: HTMLElement, index: number) => {
          const rowProgress = Math.max(0, Math.min(1, pinProgress / 0.6 - index * 0.08));
          row.style.setProperty('--row-progress', rowProgress.toString());
        });
      };

      scrollTarget.addEventListener('scroll', updateProgress, { passive: true });
      this.destroyRef.onDestroy(() => {
        scrollTarget.removeEventListener('scroll', updateProgress);
      });
      updateProgress();
    });
  }
}
