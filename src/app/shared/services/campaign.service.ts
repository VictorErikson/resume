import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { BatchCreateCampaignConfiguration } from 'app/campaign/batch-create-campaigns.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  createBatch(_configurations: BatchCreateCampaignConfiguration[]): Observable<unknown> {
    return of(null);
  }
}
