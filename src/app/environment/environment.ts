import { InjectionToken } from '@angular/core';

export interface Environment {
  trackerDomain: string;
}

export const ENVIRONMENT_DI = new InjectionToken<Environment>('ENVIRONMENT_DI', {
  providedIn: 'root',
  factory: () => ({ trackerDomain: 'sp.trackerdomain.com' }),
});
