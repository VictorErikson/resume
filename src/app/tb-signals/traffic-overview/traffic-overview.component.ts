import { Component, inject, input, OnInit, ViewEncapsulation } from '@angular/core';
import { TrafficOverviewDataService } from './traffic-overview-data.service';

@Component({
  selector: 'app-traffic-overview',
  standalone: false,
  templateUrl: './traffic-overview.component.html',
  styleUrl: './traffic-overview.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TrafficOverviewComponent implements OnInit {
  readonly kpiOnly = input<boolean>(false);
  readonly sessionsOnly = input<boolean>(false);
  readonly topPagesOnly = input<boolean>(false);

  protected readonly data = inject(TrafficOverviewDataService);

  ngOnInit(): void {
    this.data.initialize();
  }
}
