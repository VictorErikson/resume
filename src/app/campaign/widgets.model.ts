export interface WidgetSimpleInfo {
  id: number;
  name?: string;
  campaignId?: number;
  campaignName?: string;
}

export interface WidgetStatistics {
  open?: number;
  conversion?: number;
  conversionPartial?: number;
  surveyResponses?: number;
  surveyResponsesPartial?: number;
}
