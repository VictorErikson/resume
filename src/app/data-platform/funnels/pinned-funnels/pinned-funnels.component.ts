import {
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, from, of } from 'rxjs';
import {
  catchError,
  filter as rxFilter,
  map,
  mergeMap,
  pairwise,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { DataPlatformService } from '../../data-platform.service';
import { DataPlatformEventFilter, DataPlatformFunnelResponse } from '../../data-platform.model';
import { RequestResult } from '../../../core/triggerbee/request-result';
import { FunnelChartStep, mapToChartSteps } from '../funnel-chart/funnel-chart.component';
import { FunnelStorageService, SavedFunnel } from '../funnel-storage.service';

interface PinnedFunnelDisplay {
  funnel: SavedFunnel;
  steps: FunnelChartStep[];
  loading: boolean;
}

@Component({
  selector: 'app-pinned-funnels',
  templateUrl: './pinned-funnels.component.html',
  styleUrls: ['./pinned-funnels.component.scss'],
  standalone: false,
})
export class PinnedFunnelsComponent implements OnInit {
  @Output() public loadFunnel = new EventEmitter<string>();

  private readonly storageService = inject(FunnelStorageService);
  private readonly dataPlatformService = inject(DataPlatformService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly pinnedList = computed(() =>
    this.storageService.savedFunnels().filter((f) => f.pinned),
  );
  private readonly pinnedList$ = toObservable(this.pinnedList);

  public readonly displayItems = signal<PinnedFunnelDisplay[]>([]);
  public readonly viewMode = signal<'columns' | 'bars'>('bars');

  private wasDrag = false;
  private dragStartX = 0;
  private dragScrollLeft = 0;

  ngOnInit() {
    const filter$ = this.dataPlatformService.filterBS.pipe(
      rxFilter((f): f is DataPlatformEventFilter => !!f),
    );

    filter$
      .pipe(
        switchMap((filter) => this.reloadAllPinned(filter)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ id, result }) => this.applyResult(id, result));

    this.dataPlatformService.refreshBS
      .pipe(
        withLatestFrom(filter$),
        switchMap(([, filter]) => this.reloadAllPinned(filter)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ id, result }) => this.applyResult(id, result));

    this.pinnedList$
      .pipe(
        pairwise(),
        withLatestFrom(filter$),
        mergeMap(([[prev, curr], filter]) => this.reloadChangedPinned(prev, curr, filter)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ id, result }) => this.applyResult(id, result));
  }

  private reloadAllPinned(filter: DataPlatformEventFilter) {
    const pinned = this.pinnedList();
    if (!pinned.length) {
      this.displayItems.set([]);
      return EMPTY;
    }
    const currentMap = new Map(this.displayItems().map((i) => [i.funnel.id, i]));
    this.displayItems.set(
      pinned.map((f) => {
        const existing = currentMap.get(f.id);
        return { funnel: f, steps: existing?.steps ?? [], loading: !existing?.steps?.length };
      }),
    );
    return this.fetchFunnels(filter, pinned);
  }

  private reloadChangedPinned(
    prev: SavedFunnel[],
    curr: SavedFunnel[],
    filter: DataPlatformEventFilter,
  ) {
    if (!curr.length) {
      this.displayItems.set([]);
      return EMPTY;
    }

    const currIds = new Set(curr.map((f) => f.id));
    this.displayItems.update((items) => items.filter((i) => currIds.has(i.funnel.id)));
    const currMap = new Map(curr.map((f) => [f.id, f]));
    this.displayItems.update((items) =>
      items.map((i) => ({ ...i, funnel: currMap.get(i.funnel.id) ?? i.funnel })),
    );

    const prevMap = new Map(prev.map((f) => [f.id, f]));
    const toLoad = curr.filter((f) => {
      const p = prevMap.get(f.id);
      return !p || JSON.stringify(p.steps) !== JSON.stringify(f.steps);
    });

    if (!toLoad.length) return EMPTY;

    const toLoadIds = new Set(toLoad.map((f) => f.id));
    this.displayItems.update((items) => {
      const existingIds = new Set(items.map((i) => i.funnel.id));
      const additions = toLoad
        .filter((f) => !existingIds.has(f.id))
        .map((f) => ({ funnel: f, steps: [] as FunnelChartStep[], loading: true }));
      return [
        ...items.map((i) => (toLoadIds.has(i.funnel.id) ? { ...i, loading: !i.steps.length } : i)),
        ...additions,
      ];
    });

    return this.fetchFunnels(filter, toLoad);
  }

  private fetchFunnels(
    filter: DataPlatformEventFilter,
    funnels: SavedFunnel[],
  ): Observable<{ id: string; result: RequestResult<DataPlatformFunnelResponse> | null }> {
    return from(funnels).pipe(
      mergeMap(
        (f) =>
          this.dataPlatformService
            .getFunnel({ filter, steps: f.steps.filter((s) => !!s.eventType) }, 'funnels-pinned')
            .pipe(
              map((result) => ({ id: f.id, result })),
              catchError(() => of({ id: f.id, result: null })),
            ),
        4,
      ),
    );
  }

  private applyResult(id: string, result: RequestResult<DataPlatformFunnelResponse> | null) {
    this.displayItems.update((items) =>
      items.map((item) =>
        item.funnel.id === id
          ? {
              ...item,
              loading: false,
              steps:
                result?.isPositive() && result.data ? mapToChartSteps(result.data.steps ?? []) : [],
            }
          : item,
      ),
    );
  }

  public getCardWidth(item: PinnedFunnelDisplay): number {
    const count = item.funnel.steps.filter((s) => !!s.eventType).length;
    return Math.max(count, 1) * 120 + 80;
  }

  public unpin(id: string) {
    const updated = this.storageService
      .savedFunnels()
      .map((f) => (f.id === id ? { ...f, pinned: false } : f));
    this.storageService.write(updated);
  }

  public onCardClick(id: string) {
    if (this.wasDrag) {
      this.wasDrag = false;
      return;
    }
    this.loadFunnel.emit(id);
  }

  public onRowMouseDown(e: MouseEvent, rowEl: HTMLElement) {
    this.wasDrag = false;
    this.dragStartX = e.clientX;
    this.dragScrollLeft = rowEl.scrollLeft;

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - this.dragStartX;
      if (Math.abs(dx) > 5) this.wasDrag = true;
      rowEl.scrollLeft = this.dragScrollLeft - dx;
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
}
