import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Tier } from 'app/shared/account/tier.model';
import type { GoalModel } from 'app/account-settings/models/events.model';
import type { Currency } from 'app/shared/account/Currency';

export interface Account {
  siteId: number;
  tier: Tier;
  topLevelDomain?: string;
  name?: string;
  urls?: string[];
  currency?: Currency;
  subscriberWorth?: number;
}

export interface AccountSettingsProperty {
  propertyName: string;
  value: unknown;
}

const DUMMY_ACCOUNT: Account = {
  siteId: 12345,
  tier: Tier.Pro,
  topLevelDomain: 'spt.trackerdomain.com',
  name: 'example.com',
  urls: ['https://example.com'],
};

@Injectable({ providedIn: 'root' })
export class AccountService {
  getCurrentAccount(): Observable<Account> {
    return of({ ...DUMMY_ACCOUNT });
  }

  patchAccountSettingsProperty(
    siteId: number,
    props: AccountSettingsProperty[],
  ): Observable<Account> {
    const patch: Partial<Account> = {};
    for (const p of props) {
      if (p.propertyName === 'name') patch.name = String(p.value);
      if (p.propertyName === 'urls') patch.urls = p.value as string[];
    }
    return of({ ...DUMMY_ACCOUNT, siteId, ...patch });
  }

  static cleanupDomains(urls: string[]): string[] {
    return urls
      .map((u) =>
        u
          .trim()
          .replace(/^https?:\/\//i, '')
          .replace(/\/.*$/, ''),
      )
      .filter(Boolean);
  }

  getGoals(): Observable<GoalModel[]> {
    return of([
      { id: 1, name: 'Purchase' },
      { id: 2, name: 'Newsletter signup' },
      { id: 3, name: 'Add to cart' },
      { id: 4, name: 'Account created' },
    ]);
  }

  getDefaultSubscriberWorth(_currency?: Currency): number {
    return 0;
  }
}
