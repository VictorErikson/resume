import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { OnboardingStateService } from '../../services/onboarding-state.service';
import { ONBOARDING_BASE_ROUTE, ONBOARDING_NEW_PARAMS } from 'app/onboarding/constants';

interface Integration {
  id: string;
  name: string;
  logo?: string;
  icon?: string;
}

@Component({
  selector: 'app-integration-selection',
  templateUrl: './integration-selection.component.html',
  styleUrls: ['./integration-selection.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegrationSelectionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly stateService = inject(OnboardingStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly MAX_PLATFORM_SELECTIONS = 2;
  private readonly MAX_CRM_SELECTIONS = 1;
  readonly steps = this.stateService.getSteps(3);
  selectedIntegrations: string[] = [];
  selectedSet = new Set<string>();
  disabledSet = new Set<string>();
  private _otherIntegration: string = '';
  get otherIntegration(): string {
    return this._otherIntegration;
  }
  set otherIntegration(value: string) {
    this._otherIntegration = value;
    if (value.trim()) {
      this.selectedIntegrations = [];
      this.updateSets();
    }
  }

  websitePlatforms: Integration[] = [
    { id: 'shopify', name: 'Shopify', logo: 'assets/img/logos/shopify_glyph.png' },
    { id: 'gtm', name: 'Google Tag Manager', logo: 'assets/img/onboarding/gtm-logo.svg' },
    { id: 'wordpress', name: 'WordPress', logo: 'assets/img/onboarding/wordpress-logo.svg' },
    { id: 'centra', name: 'Centra', logo: 'assets/img/logos/centra.png' },
    { id: 'shopware', name: 'Shopware', logo: 'assets/img/logos/shopware.svg' },
    { id: 'custom', name: 'Custom website', icon: 'code' },
  ];

  crmIntegrations: Integration[] = [
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      logo: 'assets/img/logos/mailchimp_freddie_color_web.png',
    },
    { id: 'klaviyo', name: 'Klaviyo', logo: 'assets/img/logos/klaviyo.svg' },
    { id: 'rule', name: 'Rule', logo: 'assets/img/logos/rule-logo.png' },
    { id: 'voyado', name: 'Voyado', logo: 'assets/img/logos/voyado.png' },
    { id: 'brevo', name: 'Brevo', logo: 'assets/img/logos/brevo.jpg' },
    { id: 'dotdigital', name: 'DotDigital', logo: 'assets/img/logos/dotdigital.png' },
    { id: 'emarsys', name: 'Emarsys', logo: 'assets/img/logos/emarsys.png' },
    { id: 'custobar', name: 'Custobar', logo: 'assets/img/logos/custobar.png' },
    { id: 'apsis', name: 'Apsis', logo: 'assets/img/logos/apsis.png' },
    { id: 'mailerlite', name: 'MailerLite', logo: 'assets/img/logos/mailerlite.png' },
    { id: 'zapier', name: 'Zapier', logo: 'assets/img/logos/zapier.png' },
    { id: 'mailersend', name: 'MailerSend', logo: 'assets/img/logos/mailer_send.svg' },
  ];

  ngOnInit(): void {
    const state = this.stateService.getState();
    if (state.selectedIntegration && state.selectedIntegration !== 'skipped') {
      if (state.selectedIntegration.startsWith('other:')) {
        this.otherIntegration = state.selectedIntegration.replace('other:', '');
      } else {
        this.selectedIntegrations = state.selectedIntegration.split(',');
      }
    }
    this.updateSets();
  }

  toggleIntegration(integrationId: string): void {
    const index = this.selectedIntegrations.indexOf(integrationId);
    if (index > -1) {
      this.selectedIntegrations = this.selectedIntegrations.filter((_, i) => i !== index);
    } else if (!this.disabledSet.has(integrationId)) {
      this.selectedIntegrations = [...this.selectedIntegrations, integrationId];
    }
    this.updateSets();
  }

  private updateSets(): void {
    this.selectedSet = new Set(this.selectedIntegrations);
    const newDisabled = new Set<string>();
    const sections = [
      { list: this.websitePlatforms, max: this.MAX_PLATFORM_SELECTIONS },
      { list: this.crmIntegrations, max: this.MAX_CRM_SELECTIONS },
    ];
    for (const section of sections) {
      const selectedCount = section.list.filter((item) => this.selectedSet.has(item.id)).length;
      if (selectedCount >= section.max) {
        section.list
          .filter((item) => !this.selectedSet.has(item.id))
          .forEach((item) => newDisabled.add(item.id));
      }
    }
    this.disabledSet = newDisabled;
  }

  proceed(): void {
    if (this.selectedIntegrations.length === 0) return;

    const integrationsValue = this.selectedIntegrations.join(',');
    this.stateService.setCustomerData({ selectedIntegrations: this.selectedIntegrations });
    this.stateService.trackEvent('onboarding_integrations_selected', {
      integrations: this.selectedIntegrations,
      integrationCount: this.selectedIntegrations.length,
    });
    this.saveAndNavigate(integrationsValue);
  }

  proceedWithOther(): void {
    if (!this.otherIntegration.trim()) return;

    const integrationValue = `other:${this.otherIntegration}`;
    this.stateService.setCustomerData({ selectedIntegration: integrationValue });
    this.stateService.trackEvent('onboarding_integration_selected', {
      integration: 'other',
      integrationName: this.otherIntegration,
    });
    this.saveAndNavigate(integrationValue);
  }

  private saveAndNavigate(integrationValue: string): void {
    this.stateService.setSelectedIntegration(integrationValue);
    timer(300)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.router.navigate([`${ONBOARDING_BASE_ROUTE}install`], ONBOARDING_NEW_PARAMS),
      );
  }

  skip(): void {
    this.stateService.setSelectedIntegration('skipped');
    this.stateService.trackEvent('onboarding_integration_skipped');
    this.router.navigate([`${ONBOARDING_BASE_ROUTE}install`], ONBOARDING_NEW_PARAMS);
  }

  goBack(): void {
    this.router.navigate([`${ONBOARDING_BASE_ROUTE}company-type`], ONBOARDING_NEW_PARAMS);
  }
}
