import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { DomainConfirmationComponent } from './pages/domain-confirmation/domain-confirmation.component';
import { CompanyTypeComponent } from './pages/company-type/company-type.component';
import { IntegrationSelectionComponent } from './pages/integration-selection/integration-selection.component';
import { InstallScriptComponent } from './pages/install-script/install-script.component';
import { StepNavigationComponent } from './components/step-navigation/step-navigation.component';
import { ScriptNotDetectedDialogComponent } from './pages/install-script/script-not-detected-dialog/script-not-detected-dialog.component';
import { ContinueButtonComponent } from './components/continue-button/continue-button.component';

const components = [
  DomainConfirmationComponent,
  CompanyTypeComponent,
  IntegrationSelectionComponent,
  InstallScriptComponent,
  StepNavigationComponent,
  ScriptNotDetectedDialogComponent,
  ContinueButtonComponent,
];

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'domain' },
  { path: 'domain', component: DomainConfirmationComponent },
  { path: 'company-type', component: CompanyTypeComponent },
  { path: 'integrations', component: IntegrationSelectionComponent },
  { path: 'install', component: InstallScriptComponent },
];

@NgModule({
  declarations: components,
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  exports: components,
})
export class OnboardingModule {}
