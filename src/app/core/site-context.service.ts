import { Injectable } from '@angular/core';
import type { Account } from 'app/account/account.service';

export interface SiteInfo {
  id?: number;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class SiteContextService {
  setCurrentSite(_account: Account): void {}

  getAllSitesAsync(): Promise<SiteInfo[]> {
    return Promise.resolve([{ id: 12345, name: 'Demo account' }]);
  }
}
