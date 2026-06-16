import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { Logger, LoggerFactory } from 'app/core/logger.service';
import { OnboardingStep } from '../components/step-navigation/step-navigation.component';
import { ONBOARDING_BASE_ROUTE } from '../constants';

export type CompanyType = 'b2b' | 'ecommerce' | 'media' | 'agency' | 'saas' | 'other';

export interface OnboardingState {
  siteId: number | null;
  confirmedDomain: string | null;
  companyType: CompanyType | null;
  selectedIntegration: string | null;
  brandColors: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    fontFamily: string;
  } | null;
  selectedObjective: 'gamified' | 'referral' | 'survey' | 'form' | null;
  installationStatus: 'not-started' | 'checking' | 'detected' | 'not-detected';
  campaignsCreated: boolean;
  brandColorsSaved: boolean;
}

const STEP_DEFINITIONS: Pick<OnboardingStep, 'id' | 'label' | 'route'>[] = [
  { id: 1, label: 'onboarding.steps.domain', route: `${ONBOARDING_BASE_ROUTE}domain` },
  { id: 2, label: 'onboarding.steps.companyType', route: `${ONBOARDING_BASE_ROUTE}company-type` },
  { id: 3, label: 'onboarding.steps.integrations', route: `${ONBOARDING_BASE_ROUTE}integrations` },
  { id: 4, label: 'onboarding.steps.install', route: `${ONBOARDING_BASE_ROUTE}install` },
];

@Injectable({
  providedIn: 'root',
})
export class OnboardingStateService {
  private readonly STORAGE_KEY = 'onboarding_state';
  private readonly logger: Logger = inject(LoggerFactory).get('OnboardingStateService');

  private initialState: OnboardingState = {
    siteId: null,
    confirmedDomain: null,
    companyType: null,
    selectedIntegration: null,
    brandColors: null,
    selectedObjective: null,
    installationStatus: 'not-started',
    campaignsCreated: false,
    brandColorsSaved: false,
  };

  private stateSubject = new BehaviorSubject<OnboardingState>(this.loadState());
  public state$: Observable<OnboardingState> = this.stateSubject.asObservable();
  private readonly stateSignal = toSignal(this.state$, { initialValue: this.loadState() });

  private loadState(): OnboardingState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return this.initialState;
  }

  private saveState(state: OnboardingState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      this.logger.error('Failed to save onboarding state to localStorage');
    }
  }

  public getState(): OnboardingState {
    return this.stateSubject.value;
  }

  public getSteps(activeStepId: number): Signal<OnboardingStep[]> {
    return computed(() => {
      const state = this.stateSignal();
      const hasDataByStepId: Record<number, boolean> = {
        1: !!state.confirmedDomain,
        2: !!state.companyType,
        3: !!state.selectedIntegration,
        4: state.installationStatus !== 'not-started',
      };
      return STEP_DEFINITIONS.map((def) => {
        const isActive = def.id === activeStepId;
        const isPast = def.id < activeStepId;
        const isFuture = def.id > activeStepId;
        const hasData = hasDataByStepId[def.id] ?? false;
        const completed = isPast && hasData;
        const accessible = isFuture && hasData;
        return {
          ...def,
          active: isActive,
          completed,
          accessible,
          clickable: !!(def.route && (completed || isActive || accessible)),
        };
      });
    });
  }

  public trackEvent(event: string, data: Record<string, unknown> = {}): void {
    if (typeof window === 'undefined') return;
    const win = window as Window & { dataLayer?: Record<string, unknown>[] };
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({ event, ...data });
  }

  public setCustomerData(data: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    const win = window as Window & { triggerbeeCustomer?: Record<string, unknown> };
    win.triggerbeeCustomer = win.triggerbeeCustomer || {};
    Object.assign(win.triggerbeeCustomer, data);
  }

  public setConfirmedDomain(domain: string): void {
    this.updateState({ confirmedDomain: domain });
  }

  public setCompanyType(type: CompanyType): void {
    this.updateState({ companyType: type });
  }

  public setSelectedIntegration(integration: string): void {
    this.updateState({ selectedIntegration: integration });
  }

  public setBrandColors(colors: OnboardingState['brandColors']): void {
    this.updateState({ brandColors: colors });
  }

  public setBrandColorsSaved(): void {
    this.updateState({ brandColorsSaved: true });
  }

  public setSelectedObjective(objective: OnboardingState['selectedObjective']): void {
    this.updateState({ selectedObjective: objective });
  }

  public setInstallationStatus(status: OnboardingState['installationStatus']): void {
    this.updateState({ installationStatus: status });
  }

  public setCampaignsCreated(value: boolean): void {
    this.updateState({ campaignsCreated: value });
  }

  public reset(): void {
    const freshState = { ...this.initialState };
    this.stateSubject.next(freshState);
    this.saveState(freshState);
  }

  public initForSite(siteId: number): void {
    if (this.getState().siteId !== siteId) {
      this.reset();
      this.updateState({ siteId });
    }
  }

  private updateState(partial: Partial<OnboardingState>): void {
    const newState = {
      ...this.stateSubject.value,
      ...partial,
    };
    this.stateSubject.next(newState);
    this.saveState(newState);
  }
}
