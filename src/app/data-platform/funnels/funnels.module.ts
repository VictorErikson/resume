import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { DataPlatformFunnelsComponent } from './data-platform-funnels.component';
import { CustomFunnelBuilderComponent } from './custom-funnel-builder/custom-funnel-builder.component';
import { FunnelChartComponent } from './funnel-chart/funnel-chart.component';
import { PinnedFunnelsComponent } from './pinned-funnels/pinned-funnels.component';
import { FunnelNameDialogComponent } from './funnel-name-dialog/funnel-name-dialog.component';
import { WidgetSelectComponent } from './custom-funnel-builder/components/widget-select/widget-select.component';
import { DemoTopMenuComponent } from './demo-chrome/demo-top-menu.component';
import { DemoSideMenuComponent } from './demo-chrome/demo-side-menu.component';

const components = [
  DataPlatformFunnelsComponent,
  CustomFunnelBuilderComponent,
  FunnelChartComponent,
  PinnedFunnelsComponent,
  FunnelNameDialogComponent,
  WidgetSelectComponent,
];

const standaloneComponents = [DemoTopMenuComponent, DemoSideMenuComponent];

const routes: Routes = [{ path: '', component: DataPlatformFunnelsComponent }];

@NgModule({
  declarations: components,
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes), ...standaloneComponents],
  exports: components,
})
export class FunnelsModule {}
