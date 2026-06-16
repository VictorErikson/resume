import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { CampaignStatus } from '../campaign.model';

export interface CampaignTemplate {
  id: string | number;
  name: string;
  tagsDetails?: { name: string }[];
}

export interface GetTemplatesQuery {
  tags: string[];
  status: CampaignStatus;
  take: number;
}

@Injectable({ providedIn: 'root' })
export class CampaignTemplatesService {
  getTemplates(_query: GetTemplatesQuery): Observable<CampaignTemplate[]> {
    return of([]);
  }
}
