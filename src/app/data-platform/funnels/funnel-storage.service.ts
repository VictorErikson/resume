import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentContextService } from '../../core/current-context.service';
import { DataPlatformFunnelStep } from '../data-platform.model';

export interface SavedFunnel {
  id: string;
  name: string;
  steps: DataPlatformFunnelStep[];
  pinned?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FunnelStorageService {
  private readonly currentContextService = inject(CurrentContextService);
  private readonly context = toSignal(this.currentContextService.currentContextBS);

  private readonly storageKey = computed(() => {
    const siteId = this.context()?.account?.siteId;
    return siteId != null ? `dp_saved_funnels_${siteId}` : null;
  });

  private readonly _savedFunnels = signal<SavedFunnel[]>([]);
  readonly savedFunnels = this._savedFunnels.asReadonly();

  constructor() {
    effect(() => {
      const key = this.storageKey();
      this._savedFunnels.set(key ? this.loadFromStorageKey(key) : []);
    });
  }

  write(funnels: SavedFunnel[]): void {
    const key = this.storageKey();
    if (!key) return;
    this._savedFunnels.set(funnels);
    localStorage.setItem(key, JSON.stringify(funnels));
  }

  upsert(funnel: SavedFunnel): void {
    const existing = this._savedFunnels();
    const idx = existing.findIndex((f) => f.id === funnel.id);
    const updated =
      idx >= 0 ? existing.map((f) => (f.id === funnel.id ? funnel : f)) : [...existing, funnel];
    this.write(updated);
  }

  private loadFromStorageKey(key: string): SavedFunnel[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as SavedFunnel[]) : [];
    } catch {
      return [];
    }
  }
}
