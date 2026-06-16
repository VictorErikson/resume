import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { BaseChartDirective } from 'ng2-charts';
import { SharedModule } from '../shared/shared.module';
import { CustomerDashboardDataService } from '../customer-dashboard/customer-dashboard-data.service';
import { DataPlatformService } from '../data-platform/data-platform.service';
import { AnalyticsService } from '../shared/services/analytics.service';
import { AccountService } from '../account/account.service';
import { ThousandSuffixPipe } from '../shared/pipes/thousand-suffix.pipe';
import { TbSignalsComponent } from './tb-signals.component';
import { TrafficOverviewDataService } from './traffic-overview/traffic-overview-data.service';
import { LiveFeedComponent } from './live-feed/live-feed.component';
import { TrafficOverviewComponent } from './traffic-overview/traffic-overview.component';
import { TrafficKpiMenuComponent } from './traffic-overview/kpi-menu/kpi-menu.component';
import { TrafficSessionsChartComponent } from './traffic-overview/sessions-chart/sessions-chart.component';
import { TrafficTopPagesComponent } from './traffic-overview/top-pages/top-pages.component';
import { CategoryTrendsComponent } from './category-trends/category-trends.component';
import { SignalRingsComponent } from './signal-rings/signal-rings.component';
import { HotDimensionsComponent } from './hot-dimensions/hot-dimensions.component';
import { LiveFunnelComponent } from './live-funnel/live-funnel.component';
import { ScrollStorylineComponent } from './scroll-storyline/scroll-storyline.component';
import { ScrollPinDirective } from './scroll-pin/scroll-pin.directive';
import { ScrollRevealDirective } from './scroll-reveal/scroll-reveal.directive';
import { FlyoutKpiSettingsComponent } from '../flyout/flyout-kpi-settings/flyout-kpi-settings.component';

const routes: Routes = [{ path: '', component: TbSignalsComponent }];

@NgModule({
  declarations: [
    TbSignalsComponent,
    LiveFeedComponent,
    TrafficOverviewComponent,
    TrafficKpiMenuComponent,
    TrafficSessionsChartComponent,
    TrafficTopPagesComponent,
    CategoryTrendsComponent,
    SignalRingsComponent,
    HotDimensionsComponent,
    LiveFunnelComponent,
    ScrollStorylineComponent,
    ScrollPinDirective,
    ScrollRevealDirective,
    FlyoutKpiSettingsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    TranslateModule,
    MatButtonToggleModule,
    BaseChartDirective,
  ],
  providers: [
    CustomerDashboardDataService,
    DataPlatformService,
    AnalyticsService,
    AccountService,
    TrafficOverviewDataService,
    ThousandSuffixPipe,
  ],
})
export class TbSignalsModule {}
