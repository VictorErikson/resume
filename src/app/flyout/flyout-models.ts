export enum FlyoutDataType {
  KpiSettings = 'kpi-settings',
}

export interface KpiDefinitionData {
  key: string;
  labelKey: string;
  tooltipKey?: string;
  format: 'number' | 'percent' | 'currency';
  placeholder?: boolean;
}

export interface FlyoutOpeningData {
  type: FlyoutDataType;
  kpiDefinitions?: KpiDefinitionData[];
  kpiSelectedKeys?: string[];
}

export interface FlyoutKpiSettingsResult {
  selectedKeys: string[];
}
