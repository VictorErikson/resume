import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { CompanyType, OnboardingStateService } from '../../services/onboarding-state.service';
import { ONBOARDING_BASE_ROUTE, ONBOARDING_NEW_PARAMS } from 'app/onboarding/constants';

@Component({
  selector: 'app-company-type',
  templateUrl: './company-type.component.html',
  styleUrls: ['./company-type.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyTypeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly stateService = inject(OnboardingStateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly steps = this.stateService.getSteps(2);

  readonly companyTypes = [
    { id: 'b2b', icon: 'business', labelKey: 'onboarding.companyType.types.b2b' },
    { id: 'ecommerce', icon: 'shopping_cart', labelKey: 'onboarding.companyType.types.ecommerce' },
    { id: 'media', icon: 'article', labelKey: 'onboarding.companyType.types.media' },
    { id: 'agency', icon: 'groups', labelKey: 'onboarding.companyType.types.agency' },
    { id: 'saas', icon: 'cloud', labelKey: 'onboarding.companyType.types.saas' },
    { id: 'other', icon: 'category', labelKey: 'onboarding.companyType.types.other' },
  ] as const;

  selectedType: CompanyType | null = null;

  ngOnInit(): void {
    const state = this.stateService.getState();
    this.selectedType = state.companyType;
  }

  selectType(type: CompanyType): void {
    this.selectedType = type;
    this.stateService.setCompanyType(type);

    this.stateService.setCustomerData({ companyType: type });
    this.stateService.trackEvent('onboarding_company_type_selected', { companyType: type });
  }

  proceed(): void {
    this.router.navigate([`${ONBOARDING_BASE_ROUTE}integrations`], ONBOARDING_NEW_PARAMS);
  }

  goBack(): void {
    this.router.navigate([`${ONBOARDING_BASE_ROUTE}domain`], ONBOARDING_NEW_PARAMS);
  }
}
