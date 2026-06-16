import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { AccountVariable } from './account-settings-models';

@Injectable({ providedIn: 'root' })
export class AccountSettingsService {
  getAllAccountVariables(): Observable<AccountVariable[]> {
    return of([]);
  }
  createSiteStyles(
    _colors: AccountVariable[],
    _images: unknown[],
    _font: string,
  ): Observable<unknown> {
    return of(null);
  }
}
