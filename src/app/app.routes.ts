import { Routes } from '@angular/router';
import { Resume } from './resume/resume';

const onboarding = () => import('./onboarding/onboarding.module').then((m) => m.OnboardingModule);

export const routes: Routes = [
  { path: '', component: Resume },
  { path: 'sv', component: Resume },

  { path: 'demos', loadComponent: () => import('./demos/demos').then((m) => m.Demos) },

  { path: 'onboarding', loadChildren: onboarding },
  { path: 'sv/onboarding', loadChildren: onboarding },

  {
    path: 'funnels',
    loadChildren: () =>
      import('./data-platform/funnels/funnels.module').then((m) => m.FunnelsModule),
  },

  {
    path: 'tb-signals',
    loadChildren: () => import('./tb-signals/tb-signals.module').then((m) => m.TbSignalsModule),
  },
];
