import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { WidgetStatistics } from 'app/campaign/widgets.model';
import type {
  IdentifiedRateSiteResponse,
  NamedSeries,
  RevenueResponse,
} from 'app/shared/services/analytics-models';

export interface ProfileCount {
  count?: number;
}
export interface RevenueWidgetsCount {
  lastTouchRevenue?: number;
}
export interface SignupAnalyticsCount {
  createdSubscribers?: number;
  duplicatesPrevented?: number;
}

export interface LoadState<T> {
  loading: boolean;
  error: boolean;
  data: T | null;
}

function idle<T>(): Observable<LoadState<T>> {
  return of({ loading: false, error: false, data: null });
}

@Injectable({ providedIn: 'root' })
export class CustomerDashboardDataService {
  readonly widgetStatistics$ = idle<{ data?: WidgetStatistics[] }>();
  readonly profileCount$ = idle<ProfileCount[]>();
  readonly identifiedRate$ = idle<IdentifiedRateSiteResponse[]>();
  readonly revenue$ = idle<RevenueResponse>();
  readonly signupAnalyticsCount$ = idle<SignupAnalyticsCount[]>();
  readonly revenueWidgetsCountRaw$ = idle<RevenueWidgetsCount[]>();
  readonly dailyPerformance$ = idle<{ data?: { items?: NamedSeries[] } }>();

  initialize(_siteIds: number[]): void {}
  switchSites(_siteIds: number[]): void {}
}
