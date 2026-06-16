import { Component, Input, computed, signal, inject } from '@angular/core';
import { FlyoutOpeningData, KpiDefinitionData } from '../flyout-models';
import { FlyoutService } from '../flyout.service';

@Component({
  selector: 'app-flyout-kpi-settings',
  templateUrl: './flyout-kpi-settings.component.html',
  styleUrls: ['./flyout-kpi-settings.component.scss'],
  standalone: false,
})
export class FlyoutKpiSettingsComponent {
  private readonly flyoutService = inject(FlyoutService);

  protected definitions: KpiDefinitionData[] = [];
  protected selectedKeys = signal<string[]>([]);

  protected readonly addedDefinitions = computed(() =>
    this.selectedKeys()
      .map((key) => this.definitions.find((d) => d.key === key))
      .filter((d): d is KpiDefinitionData => d !== undefined),
  );

  protected readonly availableDefinitions = computed(() =>
    this.definitions.filter((d) => !this.selectedKeys().includes(d.key)),
  );

  protected readonly isFull = computed(() => this.selectedKeys().length >= 8);

  @Input() public set flyoutOpeningData(data: FlyoutOpeningData) {
    if (data) {
      this.definitions = data.kpiDefinitions ?? [];
      this.selectedKeys.set([...(data.kpiSelectedKeys ?? [])]);
    }
  }

  protected addKpi(key: string): void {
    const keys = this.selectedKeys();
    if (keys.length >= 8 || keys.includes(key)) {
      return;
    }
    const def = this.definitions.find((d) => d.key === key);
    if (!def) {
      return;
    }
    this.selectedKeys.update((k) => [...k, key]);
    this.emitChanges();
  }

  protected removeKpi(key: string): void {
    this.selectedKeys.update((k) => k.filter((k2) => k2 !== key));
    this.emitChanges();
  }

  protected closeFlyout(): void {
    this.flyoutService.close();
  }

  private emitChanges(): void {
    this.flyoutService.flyoutKpiSettingsBS.next({
      selectedKeys: [...this.selectedKeys()],
    });
  }
}
