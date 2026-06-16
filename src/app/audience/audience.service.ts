import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { IdentifiedRateSiteResponse } from 'app/shared/services/analytics-models';

@Injectable({ providedIn: 'root' })
export class AudienceService {
  getIdentifiedRateStatsBySiteIds(
    _siteIds: number[],
    _from: string,
    _to: string,
  ): Observable<IdentifiedRateSiteResponse[]> {
    return of([]);
  }
}
