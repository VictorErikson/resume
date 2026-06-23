import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AccountService } from 'app/account/account.service';
import { Logger, LoggerFactory } from 'app/core/logger.service';
import { SnackBarService } from 'app/core/snack-bar.service';
import { TranslateService } from '@ngx-translate/core';
import { TrackerService } from 'app/shared/services/tracker.service';
import { Environment, ENVIRONMENT_DI } from 'app/environment/environment';
import { BrandVariablesService } from 'app/account/brand-variables.service';
import { BrandVariable } from 'app/account/brand-variable';
import ColorHelpers from 'app/shared/helpers/color-helpers';
import { OnboardingState, OnboardingStateService } from '../../services/onboarding-state.service';
import { ONBOARDING_BASE_ROUTE, ONBOARDING_NEW_PARAMS } from '../../constants';
import { AccountSettingsService } from 'app/account-settings/account-settings.service';
import { AccountVariable, AccountVariableType } from 'app/account-settings/account-settings-models';
import { CampaignTemplatesService } from 'app/campaign/templates/campaign-templates.service';
import { CampaignService } from 'app/shared/services/campaign.service';
import { BatchCreateCampaignsService } from 'app/campaign/batch-create-campaigns.service';
import { BatchCreateCampaignConfiguration } from 'app/campaign/batch-create-campaigns.model';
import { CampaignStatus } from 'app/campaign/campaign.model';
import { Tier } from 'app/shared/account/tier.model';
import { IMtr } from 'app/core/tracker/mtr.interface';

interface InstallStep {
  text?: string;
  copyable?: string;
  link?: { url: string; label: string; customIcon?: string };
  action?: { label: string; icon: string };
}

interface InstallPanel {
  id: string;
  title: string;
  icon: string;
  customIcon?: string;
  badge?: string;
  notification?: { icon: string; message: string; link?: { text: string; url: string } };
  steps: InstallStep[];
}

@Component({
  selector: 'app-install-script',
  templateUrl: './install-script.component.html',
  styleUrls: ['./install-script.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallScriptComponent implements OnInit {
  private static readonly HELPER_URL =
    'https://chromewebstore.google.com/detail/nnlgjhihcdhljoknnmccehladknnbbgd';

  private readonly router = inject(Router);
  private readonly stateService = inject(OnboardingStateService);
  private readonly accountService = inject(AccountService);
  private readonly snackbarService = inject(SnackBarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger: Logger = inject(LoggerFactory).get('InstallScriptComponent');
  private readonly environment: Environment = inject(ENVIRONMENT_DI);
  private readonly translateService = inject(TranslateService);
  private readonly brandVariablesService = inject(BrandVariablesService);
  private readonly accountSettingsService = inject(AccountSettingsService);
  private readonly campaignTemplatesService = inject(CampaignTemplatesService);
  private readonly campaignService = inject(CampaignService);

  private readonly mtr = inject<IMtr>('Mtr' as any);

  public domain: string = '';
  public scriptSnippet: string = '';
  public siteId: string = '';
  public installPanels: InstallPanel[] = [];

  readonly steps = this.stateService.getSteps(4);

  async ngOnInit(): Promise<void> {
    const state = this.stateService.getState();

    this.domain = state.confirmedDomain || '';

    if (!this.domain) {
      this.router.navigate([ONBOARDING_BASE_ROUTE + 'domain'], ONBOARDING_NEW_PARAMS);
      return;
    }

    await this.generateScriptSnippet();

    this.initializeInstallPanels();
    this.sortPanelsConditionally(state.selectedIntegration ?? undefined);

    this.cdr.markForCheck();
  }

  private initializeInstallPanels(): void {
    this.installPanels = [
      {
        id: 'gtm',
        title: 'onboarding.install.panels.gtm.title',
        icon: '',
        customIcon: 'assets/img/onboarding/gtm-logo.svg',
        badge: 'onboarding.install.panels.recommended',
        steps: [
          {
            text: 'onboarding.install.panels.gtm.installTemplateText',
            link: {
              url: 'https://tagmanager.google.com/gallery/#/owners/Triggerbee-AB/templates/Triggerbee-Tracking-GTM-Template',
              label: 'onboarding.install.panels.gtm.installTemplateLink',
              customIcon: 'assets/img/onboarding/gtm-logo.svg',
            },
          },
          { text: 'onboarding.install.panels.gtm.addTag', copyable: this.siteId },
          { text: 'onboarding.install.panels.gtm.triggerAllPages' },
          {
            text: 'onboarding.install.panels.gtm.saveAndVerify',
            link: {
              url: InstallScriptComponent.HELPER_URL,
              label: 'onboarding.install.panels.helperLink',
            },
          },
        ],
      },
      {
        id: 'manual',
        title: 'onboarding.install.panels.manual.title',
        icon: 'terminal',
        steps: [
          { text: 'onboarding.install.panels.manual.copyCode', copyable: this.scriptSnippet },
          { text: 'onboarding.install.panels.manual.pasteHead' },
          { text: 'onboarding.install.panels.manual.deploy' },
          {
            text: 'onboarding.install.panels.verifyText',
            link: {
              url: InstallScriptComponent.HELPER_URL,
              label: 'onboarding.install.panels.helperLink',
            },
          },
        ],
      },
      {
        id: 'shopify',
        title: 'onboarding.install.panels.shopify.title',
        icon: 'shopify',
        customIcon: 'assets/img/logos/shopify_glyph.png',
        notification: {
          icon: 'info',
          message: 'onboarding.install.panels.shopify.notificationMessage',
          link: {
            text: 'onboarding.install.panels.shopify.notificationLinkText',
            url: 'https://apps.shopify.com/search?q=triggerbee',
          },
        },
        steps: [
          { text: 'onboarding.install.panels.shopify.useGtm' },
          {
            text: 'onboarding.install.panels.shopify.advancedGuide',
            link: {
              url: 'https://help.triggerbee.com/en/articles/11047096-install-with-shopify',
              label: 'onboarding.install.panels.shopify.advancedGuideLink',
            },
          },
        ],
      },
      {
        id: 'wordpress',
        title: 'onboarding.install.panels.wordpress.title',
        icon: 'public',
        customIcon: 'assets/img/onboarding/wordpress-logo.svg',
        steps: [
          {
            text: 'onboarding.install.panels.wordpress.installPlugin',
            link: {
              url: 'https://wordpress.org/plugins/triggerbee/',
              label: 'onboarding.install.panels.wordpress.installPluginLink',
            },
          },
          { text: 'onboarding.install.panels.wordpress.activatePlugin' },
          { text: 'onboarding.install.panels.wordpress.navigateSettings' },
          { text: 'onboarding.install.panels.wordpress.enterSiteId', copyable: this.siteId },
          { text: 'onboarding.install.panels.wordpress.saveSettings' },
          {
            text: 'onboarding.install.panels.verifyText',
            link: {
              url: InstallScriptComponent.HELPER_URL,
              label: 'onboarding.install.panels.helperLink',
            },
          },
        ],
      },
      {
        id: 'send-to-dev',
        title: 'onboarding.install.panels.sendToDev.title',
        icon: 'forward_to_inbox',
        steps: [
          { text: 'onboarding.install.panels.sendToDev.sendEmail' },
          { text: 'onboarding.install.panels.sendToDev.includeSiteId', copyable: this.siteId },
          { text: 'onboarding.install.panels.sendToDev.includeCode', copyable: this.scriptSnippet },
          { text: 'onboarding.install.panels.sendToDev.askDev' },
          {
            action: { label: 'onboarding.install.panels.sendToDev.sendEmailAction', icon: 'email' },
          },
          {
            text: 'onboarding.install.panels.verifyText',
            link: {
              url: InstallScriptComponent.HELPER_URL,
              label: 'onboarding.install.panels.helperLink',
            },
          },
        ],
      },
    ];
  }

  private sortPanelsConditionally(selectedIntegration?: string): void {
    if (!selectedIntegration) return;

    const integration = selectedIntegration.toLowerCase();
    let matchingPanelId: string | null = null;

    if (integration.includes('shopify')) {
      matchingPanelId = 'shopify';
    } else if (integration.includes('wordpress') || integration.includes('wp')) {
      matchingPanelId = 'wordpress';
    }

    if (matchingPanelId) {
      const matchingPanelIndex = this.installPanels.findIndex((p) => p.id === matchingPanelId);
      if (matchingPanelIndex > 0) {
        const panel = this.installPanels[matchingPanelIndex];
        this.installPanels = [
          panel,
          ...this.installPanels.slice(0, matchingPanelIndex),
          ...this.installPanels.slice(matchingPanelIndex + 1),
        ];
      }
    }
  }

  private completeOnboardingSetup(): void {
    const state = this.stateService.getState();
    this.saveBrandVariables(state.brandColors);
    this.createDefaultCampaigns();
  }

  private saveBrandVariables(brandColors: OnboardingState['brandColors']): void {
    if (!brandColors || this.stateService.getState().brandColorsSaved) return;

    firstValueFrom(this.accountSettingsService.getAllAccountVariables())
      .then((existing) => {
        const hasExistingColors = existing.some((v) => v.type === AccountVariableType.Color);
        if (hasExistingColors) {
          return;
        }
        this.doSaveBrandVariables(brandColors);
      })
      .catch((err) => this.logger.error('Failed to check existing account variables: ' + err));
  }

  private doSaveBrandVariables(brandColors: NonNullable<OnboardingState['brandColors']>): void {
    this.stateService.setBrandColorsSaved();

    firstValueFrom(this.brandVariablesService.getDefaultSettings())
      .then((defaults) => {
        const textColor = ColorHelpers.getContrastColor(brandColors.primaryColor);
        const brandVariable: BrandVariable = {
          ...defaults,
          canvas: { ...defaults.canvas, backgroundColor: brandColors.primaryColor },
          button: {
            ...defaults.button,
            backgroundColor: brandColors.secondaryColor,
            color: ColorHelpers.getContrastColor(brandColors.secondaryColor),
          },
          text: { ...defaults.text, color: textColor, font: brandColors.fontFamily },
          headline: { ...defaults.headline, color: textColor },
          label: { ...defaults.label, color: textColor },
          input: { ...defaults.input, color: textColor },
        };

        const siteStyleColors: AccountVariable[] = [
          { key: 'Color 1', value: brandColors.primaryColor, type: AccountVariableType.Color },
          { key: 'Color 2', value: brandColors.secondaryColor, type: AccountVariableType.Color },
        ];

        return Promise.all([
          firstValueFrom(this.brandVariablesService.create(brandVariable)),
          firstValueFrom(
            this.accountSettingsService.createSiteStyles(
              siteStyleColors,
              [],
              brandColors.fontFamily,
            ),
          ),
        ]);
      })
      .catch((err) => this.logger.error('Failed to save brand variables: ' + err));
  }

  private createDefaultCampaigns(): void {
    const state = this.stateService.getState();
    if (state.campaignsCreated) return;

    const referralTag = '_objective_referral';
    const tags = ['_objective_signup', '_objective_enrich'];

    firstValueFrom(this.accountService.getCurrentAccount())
      .then((account) => {
        if (account.tier !== Tier.Essential) {
          tags.push(referralTag);
        }
        return firstValueFrom(
          this.campaignTemplatesService.getTemplates({
            tags,
            status: CampaignStatus.Published,
            take: tags.length,
          }),
        );
      })
      .then((templates) => {
        const configurations: BatchCreateCampaignConfiguration[] = templates.map((t) => ({
          id: t.id,
          templateName: t.name,
          isReferral: !!t.tagsDetails?.find((tag) => tag.name === referralTag),
        }));
        return firstValueFrom(this.campaignService.createBatch(configurations)).then(
          () => configurations,
        );
      })
      .then((configurations) => {
        sessionStorage.setItem(
          BatchCreateCampaignsService.storageKey,
          JSON.stringify(configurations),
        );
        this.stateService.setCampaignsCreated(true);
      })
      .catch((err) => this.logger.error('Failed to create default campaigns: ' + err));
  }

  private async generateScriptSnippet(): Promise<void> {
    try {
      const account = await firstValueFrom(this.accountService.getCurrentAccount());
      if (!account) {
        this.logger.error('No account found, cannot generate script snippet');
        return;
      }
      this.siteId = account.siteId?.toString();
      const trackerUrl = '//' + (account.topLevelDomain ?? this.environment.trackerDomain);
      this.scriptSnippet =
        '<!-- Triggerbee -->\n' +
        '<script type="text/javascript">\n' +
        TrackerService.getTrackingScript(account.siteId, trackerUrl) +
        '</script>' +
        '\n<!-- End Triggerbee -->';
    } catch (e) {
      this.logger.error('Could not load account for tracking code');
    }
  }

  public copyCode(code: string, label: string = 'Code'): void {
    navigator.clipboard.writeText(code).then(
      () => {
        this.snackbarService.success('generic.copyToClipboard.copied');
      },
      () => {
        this.snackbarService.error('generic.copyToClipboard.failed');
      },
    );
  }

  public sendToEmail(): void {
    const subject = encodeURIComponent(
      this.translateService.instant('onboarding.install.panels.sendToDev.emailSubject'),
    );
    const body = encodeURIComponent(
      this.translateService.instant('onboarding.install.panels.sendToDev.emailBody', {
        siteId: this.siteId,
        scriptSnippet: this.scriptSnippet,
      }),
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  public goToDashboard(): void {
    this.completeOnboardingSetup();
    this.stateService.setCustomerData({
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
    });
    this.stateService.trackEvent('onboarding_install_do_later');
    this.stateService.trackEvent('onboarding_flow_completed', {
      completionMethod: 'skipped_install',
    });
    this.mtr.goal('Onboarding: Skipped installation');

    this.router.navigate(['/tb-signals']);
  }

  public trackInstallMethodClick(methodId: string, methodTitle: string): void {
    this.stateService.setCustomerData({ installMethod: methodId });
    this.stateService.trackEvent('onboarding_install_method_clicked', {
      installMethod: methodId,
      installMethodTitle: methodTitle,
    });
  }
}
