import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Account } from 'app/account/account.service';
import { Tier } from 'app/shared/account/tier.model';

export interface CurrentContext {
  account: Account;
  user: { email: string };
  customer?: { siteIds?: number[] };
}

@Injectable({ providedIn: 'root' })
export class CurrentContextService {
  readonly currentContextBS = new BehaviorSubject<CurrentContext | null>({
    account: { siteId: 12345, tier: Tier.Pro, topLevelDomain: 'spt.trackerdomain.com' },
    user: { email: 'demo@triggerbee.com' },
  });

  updateCurrentContextAccount(account: Account): void {
    const ctx = this.currentContextBS.value;
    if (ctx) {
      this.currentContextBS.next({ ...ctx, account: { ...ctx.account, ...account } });
    }
  }
}
