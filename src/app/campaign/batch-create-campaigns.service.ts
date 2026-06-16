import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BatchCreateCampaignsService {
  static readonly storageKey = 'batch_create_campaigns';
}
