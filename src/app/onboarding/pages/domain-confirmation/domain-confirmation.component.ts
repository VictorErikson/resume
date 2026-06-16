import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { domainValidator } from 'app/shared/custom-validators/domain-validator.directive';
import { Router } from '@angular/router';
import { firstValueFrom, timer } from 'rxjs';
import { Logger, LoggerFactory } from 'app/core/logger.service';
import { SnackBarService } from 'app/core/snack-bar.service';
import { SiteScraperService } from 'app/account-settings/components/site-styles/site-scraper.service';
import { AccountService } from 'app/account/account.service';
import { CurrentContextService } from 'app/core/current-context.service';
import { SiteContextService } from 'app/core/site-context.service';
import { OnboardingStateService } from '../../services/onboarding-state.service';
import { ONBOARDING_BASE_ROUTE, ONBOARDING_NEW_PARAMS } from 'app/onboarding/constants';
import ColorHelpers from 'app/shared/helpers/color-helpers';

@Component({
  selector: 'app-domain-confirmation',
  templateUrl: './domain-confirmation.component.html',
  styleUrls: ['./domain-confirmation.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainConfirmationComponent implements OnInit {
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly router = inject(Router);
  private readonly stateService = inject(OnboardingStateService);
  private readonly siteScraperService = inject(SiteScraperService);
  private readonly snackbarService = inject(SnackBarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly accountService = inject(AccountService);
  private readonly currentContextService = inject(CurrentContextService);
  private readonly siteContextService = inject(SiteContextService);
  private readonly logger: Logger = inject(LoggerFactory).get('DomainConfirmationComponent');

  public form!: UntypedFormGroup;
  public isLoading = false;
  public domainValidationError: string | { error: string } | null = null;
  readonly steps = this.stateService.getSteps(1);

  private readonly blockedSites: string[] = [
    'tiktok.com',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'youtube.com',
    'linkedin.com',
    'snapchat.com',
    'pinterest.com',
    'tumblr.com',
    'blogspot.com',
    'wordpress.com',
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'live.com',
    'msn.com',
    'mail.com',
    'protonmail.com',
    'zoho.com',
    'aol.com',
    'duckduckgo.com',
    'reddit.com',
    'discord.com',
    't.me',
    'medium.com',
    'bit.ly',
    'tinyurl.com',
    'weebly.com',
    'wix.com',
    'github.io',
    'netlify.app',
    'pages.dev',
    'glitch.me',
    'sites.google.com',
    'notion.site',
    'linktr.ee',
  ];

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      domain: ['', [Validators.required, Validators.maxLength(50), domainValidator()]],
    });

    this.currentContextService.currentContextBS
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((context) => {
        if (!context?.account || !context?.user?.email) {
          return;
        }
        this.stateService.initForSite(context.account.siteId);
        const savedDomain = this.stateService.getState().confirmedDomain;
        if (savedDomain) {
          this.form.patchValue({ domain: savedDomain });
          return;
        }
        const emailDomain = this.getEmailDomain(context.user.email);
        if (emailDomain && !this.form.get('domain')?.value) {
          this.form.patchValue({ domain: emailDomain });
        }
      });
  }

  private getEmailDomain(email: string): string | null {
    const atIndex = email.indexOf('@');
    if (atIndex === -1) {
      return null;
    }
    return email.substring(atIndex + 1);
  }

  public get domain(): string {
    return this.form.get('domain')?.value;
  }

  public get domainValidationErrorTranslationKey(): string {
    if (typeof this.domainValidationError === 'string') {
      return this.domainValidationError;
    }
    return this.domainValidationError?.error ?? '';
  }

  private normalizeDomain(domain: string): string {
    let normalized = domain.trim();
    normalized = normalized.replace(/\/+$/, '');
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  }

  public async confirmDomain(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    if (this.isDomainBlocked()) {
      this.snackbarService.error('onboarding.domain.blockedError');
      return;
    }

    this.isLoading = true;

    try {
      const normalizedDomain = this.normalizeDomain(this.domain);
      const { url, cleanDomain } = this.parseUrl(normalizedDomain);
      const finalDomain = url.toString().replace(/\/$/, '');

      this.stateService.setConfirmedDomain(cleanDomain);
      this.stateService.setCustomerData({ domain: cleanDomain, onboardingCompleted: false });
      this.stateService.trackEvent('onboarding_domain_confirmed', { domain: cleanDomain });
      this.saveAccountDomain(cleanDomain);
      this.fetchBrandStyles(finalDomain);

      this.snackbarService.success('onboarding.domain.confirmed');

      await firstValueFrom(timer(100).pipe(takeUntilDestroyed(this.destroyRef)));
      const result = await this.router.navigate(
        [`${ONBOARDING_BASE_ROUTE}company-type`],
        ONBOARDING_NEW_PARAMS,
      );

      if (!result) {
        this.logger.error('Navigation to company-type failed');
        this.snackbarService.error('generic.error');
      }
    } catch (error) {
      this.logger.error('Domain confirmation error: ' + error);
      this.snackbarService.error('onboarding.domain.invalidError');
    } finally {
      this.isLoading = false;
    }
  }

  private saveAccountDomain(cleanDomain: string): void {
    const urls = AccountService.cleanupDomains([cleanDomain]);
    const name = urls[0];
    firstValueFrom(this.accountService.getCurrentAccount())
      .then((account) =>
        firstValueFrom(
          this.accountService.patchAccountSettingsProperty(account.siteId, [
            { propertyName: 'name', value: name },
            { propertyName: 'urls', value: urls },
          ]),
        ),
      )
      .then((updatedAccount) => {
        this.currentContextService.updateCurrentContextAccount(updatedAccount);
        this.siteContextService.setCurrentSite(updatedAccount);
      })
      .catch((err) => this.logger.error('Failed to save domain to account: ' + err));
  }

  private isDomainBlocked(): boolean {
    return this.blockedSites.some((site) => this.domain.includes(site));
  }

  private parseUrl(normalizedDomain: string): { url: URL; cleanDomain: string } {
    const cleanDomain = normalizedDomain.replace(/^https?:\/\//i, '').replace(/\/.*/, '');
    try {
      const url = new URL(normalizedDomain);
      return { url, cleanDomain };
    } catch {
      this.logger.warn('URL constructor failed, trying lenient approach');
      return { url: new URL('https://' + cleanDomain), cleanDomain };
    }
  }

  private async fetchBrandStyles(domain: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.siteScraperService.getStylesFromSite(domain));

      if (response && response.topColors && response.topColors.length > 0) {
        const primaryColor = response.topColors[0]?.color || '#4A90E2';
        const buttonCandidates = ColorHelpers.excludeDarkAndLightColors(
          response.topColors.map((c) => c.color),
        ).slice(0, 3);
        const secondaryColor =
          buttonCandidates[buttonCandidates.length - 1] ||
          response.topColors[1]?.color ||
          '#50C878';
        const fontFamily = response.topFonts?.[0]?.fontFamily || 'Arial, sans-serif';

        this.stateService.setBrandColors({
          primaryColor,
          secondaryColor,
          textColor: '#333333',
          fontFamily,
        });
      }
    } catch (error) {
      this.logger.warn('Failed to scrape brand styles, skipping brand color preset: ' + error);
    }
  }
}
