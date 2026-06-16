import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ONBOARDING_NEW_PARAMS_STRING } from 'app/onboarding/constants';

export interface OnboardingStep {
  id: number;
  label: string;
  completed: boolean;
  active: boolean;
  accessible?: boolean;
  route?: string;
  clickable?: boolean;
}

@Component({
  selector: 'app-step-navigation',
  templateUrl: './step-navigation.component.html',
  styleUrls: ['./step-navigation.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepNavigationComponent {
  @Input() steps: OnboardingStep[] = [];

  private readonly router = inject(Router);

  navigateToStep(step: OnboardingStep): void {
    if (step.clickable) {
      this.router.navigateByUrl(step.route + ONBOARDING_NEW_PARAMS_STRING);
    }
  }
}
