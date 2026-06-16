import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { AnalyticsGraphResponse } from './analytics-models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  getSignupAnalyticsGraph(_from: string, _to: string): Observable<AnalyticsGraphResponse> {
    return of({ data: { items: [] } });
  }
  getRevenueAudienceGraph(
    _from: string,
    _to: string,
    _metric: string,
  ): Observable<AnalyticsGraphResponse> {
    return of({ data: { items: [] } });
  }
}
