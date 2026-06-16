import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take, filter } from 'rxjs';
import {
  BADGE_ICONS,
  DUMMY_VISITOR_HISTORY,
  FEED_ENTRIES,
  FeedEntry,
  INCOMING_ENTRIES,
  USE_DUMMY_DATA,
} from './live-feed.dummy-data';
import { DataPlatformService } from '../../data-platform/data-platform.service';
import { CurrentContextService } from '../../core/current-context.service';
import {
  DataPlatformEventFilter,
  DataPlatformVisitEvent,
  DataPlatformVisitRow,
} from '../../data-platform/data-platform.model';
import { getDimensionTypeLabel } from '../../data-platform/data-platform.utils';

const POLL_WINDOW_MS = 2 * 60 * 60 * 1000;

interface TrackedEntry {
  id: number;
  data: FeedEntry;
  expanded?: boolean;
  visitorHistory?: FeedEntry[];
  loadingHistory?: boolean;
}

interface VisitorContext {
  country: string;
  name: string;
  identifier?: string;
  tags: string[];
}

interface FlatEvent {
  key: string;
  timestamp: string;
  entry: FeedEntry;
}

@Component({
  selector: 'app-live-feed',
  standalone: false,
  providers: [DataPlatformService],
  templateUrl: './live-feed.component.html',
  styleUrl: './live-feed.component.scss',
})
export class LiveFeedComponent implements OnInit, OnDestroy {
  feedEntries: TrackedEntry[] = [];
  historyLoading = false;
  historyExhausted = false;
  feedExpanded = false;

  @ViewChild('feedList') private feedListRef?: ElementRef<HTMLElement>;

  private uid = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private dummyPoolIndex = 0;

  private siteId: number | null = null;
  private eventWatermark: string | null = null;
  private seenKeys = new Set<string>();
  private pushQueue: FeedEntry[] = [];
  private pushTimerId: ReturnType<typeof setTimeout> | null = null;

  private historyPage = 1;
  private readonly HISTORY_PAGE_SIZE = 20;
  private historyWindowFrom: string | null = null;
  private historyWindowTo: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly currentContextService = inject(CurrentContextService);
  private readonly dataPlatformService = inject(DataPlatformService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly POLL_MS = 5000;

  ngOnInit(): void {
    if (USE_DUMMY_DATA) {
      this.initDummy();
      return;
    }
    this.currentContextService.currentContextBS
      .pipe(
        filter((ctx) => !!ctx?.account?.siteId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((ctx) => {
        this.siteId = ctx!.account?.siteId ?? null;
        this.eventWatermark = null;
        this.seenKeys.clear();
        this.feedEntries = [];
        this.uid = 0;
        this.historyPage = 1;
        this.historyExhausted = false;
        this.historyWindowFrom = null;
        this.historyWindowTo = null;
        this.fetchEvents(true);
      });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.pushTimerId !== null) clearTimeout(this.pushTimerId);
  }

  badgeIcon(icon: FeedEntry['badgeKind']): string {
    return BADGE_ICONS[icon];
  }

  onFeedScroll(event: Event): void {
    if (!this.feedExpanded) return;
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) this.loadMoreHistory();
  }

  expandFeed(): void {
    this.feedEntries.forEach((e) => (e.expanded = false));
    this.feedExpanded = true;
    setTimeout(() => {
      const list = this.feedListRef?.nativeElement;
      if (!list) return;
      const firstRow = list.querySelector('.feed-row') as HTMLElement | null;
      const rowHeight = firstRow?.offsetHeight ?? 70;
      list.scrollTo({ top: rowHeight * 3, behavior: 'smooth' });
    }, 0);
  }

  toggleEntry(entry: TrackedEntry): void {
    const opening = !entry.expanded;
    this.feedEntries.forEach((e) => (e.expanded = false));
    entry.expanded = opening;
    if (opening) {
      this.feedExpanded = true;
      if (entry.visitorHistory === undefined && !entry.loadingHistory) {
        this.loadVisitorHistory(entry);
      }
    }
  }

  formatTime(iso: string | undefined): string {
    if (!iso) return '–';

    const normalized = /Z|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return iso;
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const time = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return `Today ${time}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) + ' ' + time;
  }

  private loadVisitorHistory(entry: TrackedEntry): void {
    if (USE_DUMMY_DATA) {
      entry.visitorHistory = DUMMY_VISITOR_HISTORY[entry.data.name] ?? [];
      return;
    }

    if (!this.siteId) return;
    const { identifier, sessionId } = entry.data;

    if (!identifier) {
      entry.visitorHistory = this.feedEntries
        .filter((e) => e.id !== entry.id && e.data.sessionId === sessionId)
        .map((e) => e.data)
        .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));
      return;
    }

    entry.loadingHistory = true;
    this.dataPlatformService
      .getVisits(
        {
          filter: {
            siteIds: [this.siteId],
            from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
            identifierFilter: identifier,
          },
          pageSize: 50,
          sortDirection: 'desc',
          includeEvents: true,
          includeTotalCount: false,
        },
        'live-feed-visitor',
      )
      .pipe(take(1))
      .subscribe((result) => {
        const events = this.flattenEvents(result.data?.visits ?? []).sort((a, b) =>
          b.timestamp.localeCompare(a.timestamp),
        );
        entry.visitorHistory = events.map((e) => e.entry);
        entry.loadingHistory = false;
      });
  }

  private initDummy(): void {
    this.feedEntries = FEED_ENTRIES.slice(-6).map((data) => ({ id: this.uid++, data }));
    this.intervalId = setInterval(() => this.addDummyEntry(), 2500);
  }

  private addDummyEntry(): void {
    const next = INCOMING_ENTRIES[this.dummyPoolIndex % INCOMING_ENTRIES.length];
    this.dummyPoolIndex++;
    this.pushEntry(next);
  }

  private fetchEvents(isInitial = false): void {
    if (!this.siteId) return;

    const windowFrom = new Date(
      Date.now() - (isInitial ? 24 * 60 * 60 * 1000 : POLL_WINDOW_MS),
    ).toISOString();

    const eventFilter: DataPlatformEventFilter = {
      siteIds: [this.siteId],
      from: windowFrom,
      to: new Date().toISOString(),
    };

    this.dataPlatformService
      .getVisits(
        {
          filter: eventFilter,
          pageSize: 50,
          sortDirection: 'desc',
          includeEvents: true,
          includeTotalCount: false,
        },
        'live-feed',
      )
      .pipe(take(1))
      .subscribe((result) => {
        const flatEvents = this.flattenEvents(result.data?.visits ?? []);

        if (isInitial) {
          this.historyWindowFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          this.historyWindowTo = eventFilter.to!;

          flatEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          const seed = flatEvents.slice(0, 6).reverse();
          this.feedEntries = seed.map((e) => ({ id: this.uid++, data: e.entry }));

          seed.forEach((e) => this.seenKeys.add(e.key));
          this.eventWatermark = flatEvents[0]?.timestamp ?? null;

          this.historyPage = 1;
          this.startPolling();
        } else {
          const newEvents = flatEvents
            .filter((e) => !this.seenKeys.has(e.key) && e.timestamp > (this.eventWatermark ?? ''))
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

          for (const e of newEvents) {
            this.seenKeys.add(e.key);
            if (e.timestamp > (this.eventWatermark ?? '')) this.eventWatermark = e.timestamp;
            this.pushQueue.push(e.entry);
          }
          this.drainQueue();
        }
      });
  }

  loadMoreHistory(): void {
    if (
      this.historyLoading ||
      this.historyExhausted ||
      !this.siteId ||
      !this.historyWindowFrom ||
      !this.historyWindowTo
    )
      return;
    this.historyLoading = true;

    this.dataPlatformService
      .getVisits(
        {
          filter: {
            siteIds: [this.siteId],
            from: this.historyWindowFrom,
            to: this.historyWindowTo,
          },
          pageSize: this.HISTORY_PAGE_SIZE,
          page: this.historyPage,
          sortDirection: 'desc',
          includeEvents: true,
          includeTotalCount: false,
        },
        'live-feed-history',
      )
      .pipe(take(1))
      .subscribe((result) => {
        const visits = result.data?.visits ?? [];
        if (visits.length < this.HISTORY_PAGE_SIZE) this.historyExhausted = true;

        const events = this.flattenEvents(visits)
          .filter((e) => !this.seenKeys.has(e.key))
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        events.forEach((e) => this.seenKeys.add(e.key));
        const mapped = events.map((e) => ({ id: this.uid++, data: e.entry }));
        this.feedEntries = [...this.feedEntries, ...mapped];
        this.historyPage++;
        this.historyLoading = false;
      });
  }

  private startPolling(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.fetchEvents(false), this.POLL_MS);
  }

  private drainQueue(): void {
    if (this.pushTimerId !== null || !this.pushQueue.length) return;
    const next = this.pushQueue.shift()!;
    this.pushEntry(next);
    if (this.pushQueue.length) {
      this.pushTimerId = setTimeout(() => {
        this.pushTimerId = null;
        this.drainQueue();
      }, 900);
    } else {
      this.pushTimerId = null;
    }
  }

  private pushEntry(data: FeedEntry): void {
    this.feedEntries = [{ id: this.uid++, data }, ...this.feedEntries];

    this.cdr.markForCheck();
  }

  private flattenEvents(visits: DataPlatformVisitRow[]): FlatEvent[] {
    const result: FlatEvent[] = [];
    for (const visit of visits) {
      const ctx = this.visitContext(visit);

      let pageviewSeen = false;
      const filtered = [...(visit.events ?? [])]
        .reverse()
        .filter((e) => {
          if (this.shouldSkip(e)) return false;
          if (e.eventType === 'pageview') {
            if (pageviewSeen) return false;
            pageviewSeen = true;
          }
          return true;
        })
        .reverse();

      for (const event of filtered) {
        result.push({
          key: `${visit.sessionId}:${event.timestamp}:${event.eventType}`,
          timestamp: event.timestamp,
          entry: this.mapEvent(event, ctx, visit.sessionId),
        });
      }
    }
    return result;
  }

  private shouldSkip(e: DataPlatformVisitEvent): boolean {
    return ['session', 'widget-open', 'widget-dismissal', 'signup-duplicate-prevented'].includes(
      e.eventType,
    );
  }

  private visitContext(row: DataPlatformVisitRow): VisitorContext {
    const tags: string[] = [];
    if (row.identifier) tags.push('Member');
    if (row.tags?.length) {
      for (const t of row.tags.slice(0, 2)) {
        if (!tags.includes(t)) tags.push(t);
      }
    }
    if (!tags.length) tags.push('New Visitor');
    return {
      country: row.geoCountry?.toUpperCase().slice(0, 2) ?? '--',
      name: row.identifier ?? 'Anonymous',
      identifier: row.identifier,
      tags,
    };
  }

  private mapEvent(
    event: DataPlatformVisitEvent,
    ctx: VisitorContext,
    sessionId: number,
  ): FeedEntry {
    let actionLabel = 'Browsing';
    let badgeKind: FeedEntry['badgeKind'] = 'goal';
    let badgeText = '';

    const { eventType, revenue, goalName, actionTitle } = event;

    if ((revenue ?? 0) > 0 || eventType === 'purchase') {
      actionLabel = actionTitle ? this.transformActionLabel(actionTitle) : 'Purchase';
      badgeKind = 'purchase';
      badgeText = this.formatCurrency(revenue ?? 0);
    } else if (eventType === 'login') {
      actionLabel = actionTitle ? this.transformActionLabel(actionTitle) : 'Logged in';
      badgeKind = 'login';
      badgeText = 'Logged in';
    } else if (eventType === 'signup-created-member') {
      actionLabel = 'Signed up';
      badgeKind = 'signup';
      badgeText = 'New member';
    } else if (eventType === 'signup-created-subscriber') {
      actionLabel = 'Subscribed';
      badgeKind = 'signup';
      badgeText = 'New subscriber';
    } else if (eventType === 'widget-copy-coupon') {
      actionLabel = 'Copied coupon';
      badgeKind = 'coupon';
      badgeText = goalName || 'Coupon copied';
    } else if (eventType === 'widget-survey-response') {
      actionLabel = 'Answered survey';
      badgeKind = 'survey';
      badgeText = 'Survey response';
    } else if (eventType === 'widget-clickthrough' || eventType === 'widget-conversion') {
      actionLabel = goalName || 'Clicked widget';
      badgeKind = 'widget';
      badgeText = goalName || 'Widget click';
    } else if (eventType === 'goal' && goalName) {
      actionLabel = goalName;
      badgeKind = 'goal';
      badgeText = goalName;
    } else if (actionTitle) {
      actionLabel = this.transformActionLabel(actionTitle);
    }

    return {
      country: ctx.country,
      name: ctx.name,
      tags: ctx.tags,
      actionLabel,
      badgeText,
      badgeKind,
      timestamp: event.timestamp,
      sessionId,
      identifier: ctx.identifier,
      dimensions: (event.dimensions ?? []).slice(0, 3).map((d) => {
        const idx = d.indexOf(':');
        if (idx === -1) return d;
        return `${getDimensionTypeLabel(d.substring(0, idx))}: ${d.substring(idx + 1)}`;
      }),
    };
  }

  private transformActionLabel(title: string): string {
    let label = title.trim();

    if (/^https?:\/\//.test(label)) {
      try {
        label = new URL(label).pathname;
      } catch {}
    }

    label = label.replace(/\s*[|\-–—]\s*.+$/, '').trim();

    if (label.startsWith('/')) {
      label = label
        .replace(/^\//, '')
        .replace(/\/$/, '')
        .replace(/[-_/]+/g, ' ')
        .replace(/\d{4,}/g, '')
        .trim();
    }

    try {
      label = decodeURIComponent(label);
    } catch {}

    if (!label) return 'Browsing';

    label = label.charAt(0).toUpperCase() + label.slice(1);
    if (label.length > 28) label = label.slice(0, 28).trimEnd() + '…';

    return `Browsing ${label}`;
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${Math.round(amount).toLocaleString('sv-SE')} kr`;
    return `${Math.round(amount)} kr`;
  }
}
