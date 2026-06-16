import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { FlyoutKpiSettingsResult, FlyoutOpeningData } from './flyout-models';

@Injectable({ providedIn: 'root' })
export class FlyoutService {
  readonly flyoutKpiSettingsBS = new BehaviorSubject<FlyoutKpiSettingsResult | null>(null);

  readonly openingData = signal<FlyoutOpeningData | null>(null);
  readonly isOpen = signal(false);

  open(data: FlyoutOpeningData): void {
    this.openingData.set(data);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
