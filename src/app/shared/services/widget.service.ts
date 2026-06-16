import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { WidgetSimpleInfo } from 'app/campaign/widgets.model';

const DUMMY_WIDGETS: WidgetSimpleInfo[] = [
  { id: 1, name: 'Newsletter signup', campaignId: 10, campaignName: 'Welcome flow' },
  { id: 2, name: 'Spin to win', campaignId: 11, campaignName: 'Summer sale' },
  { id: 3, name: 'Exit survey', campaignId: 11, campaignName: 'Summer sale' },
  { id: 4, name: 'Free shipping bar', campaignId: 12, campaignName: 'Checkout boost' },
];

@Injectable({ providedIn: 'root' })
export class WidgetService {
  getAllWidgetsSimpleInfo(): Observable<WidgetSimpleInfo[]> {
    return of(DUMMY_WIDGETS);
  }
}
