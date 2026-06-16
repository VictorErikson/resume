import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { RequestResult } from 'app/core/triggerbee/request-result';
import {
  DataPlatformBreakdownRequest,
  DataPlatformBreakdownResult,
  DataPlatformBounceResult,
  DataPlatformEventFilter,
  DataPlatformFunnelRequest,
  DataPlatformFunnelResponse,
  DataPlatformFunnelStepResult,
  DataPlatformGraphResult,
  DataPlatformProfilesResult,
  DataPlatformScalarResult,
  DataPlatformVisitsResult,
} from './data-platform.model';

type Resp<T> = { data?: T };

@Injectable({ providedIn: 'root' })
export class DataPlatformService {
  readonly filterBS = new BehaviorSubject<DataPlatformEventFilter | null>({
    range: 'last_30_days',
  });
  readonly refreshBS = new Subject<void>();

  getBreakdown(
    _req: DataPlatformBreakdownRequest,
    _tag?: string,
  ): Observable<DataPlatformBreakdownResult> {
    return of({ data: { rows: [] } });
  }

  private static readonly FUNNEL_EVENT_WEIGHTS: Record<string, number> = {
    session: 0.95,
    pageview: 0.86,
    event: 0.7,
    'widget-open': 0.64,
    'widget-dismissal': 0.5,
    goal: 0.44,
    'widget-clickthrough': 0.42,
    'widget-copy-coupon': 0.36,
    'widget-conversion': 0.3,
    'widget-survey-response': 0.24,
    purchase: 0.18,
  };

  private static readonly FUNNEL_BASE_AUDIENCE = 1240;

  getFunnel(
    req: DataPlatformFunnelRequest,
    _tag?: string,
  ): Observable<RequestResult<DataPlatformFunnelResponse>> {
    const steps = (req.steps ?? []).filter((s) => !!s.eventType);
    const weights = DataPlatformService.FUNNEL_EVENT_WEIGHTS;
    let count = DataPlatformService.FUNNEL_BASE_AUDIENCE;
    const resultSteps: DataPlatformFunnelStepResult[] = steps.map((s) => {
      const weight = weights[s.eventType] ?? 0.4;
      count = Math.max(1, Math.round(count * weight));
      return { eventType: s.eventType, count };
    });
    return of(new RequestResult<DataPlatformFunnelResponse>(null, { steps: resultSteps }, 200));
  }

  getScalar(_req: unknown, _tag?: string): Observable<Resp<DataPlatformScalarResult>> {
    return of({ data: { value: 0 } });
  }

  getGraph(_req: unknown, _tag?: string): Observable<Resp<DataPlatformGraphResult>> {
    return of({ data: { series: [] } });
  }

  getBounceGraph(_req: unknown, _tag?: string): Observable<Resp<DataPlatformBounceResult>> {
    return of({ data: { visits: [], bounces: [] } });
  }

  getProfiles(_req: unknown, _tag?: string): Observable<Resp<DataPlatformProfilesResult>> {
    return of({ data: { totalCount: 0, profiles: [] } });
  }

  getVisits(_req: unknown, _tag?: string): Observable<Resp<DataPlatformVisitsResult>> {
    return of({ data: { totalCount: 0, visits: [] } });
  }
}
