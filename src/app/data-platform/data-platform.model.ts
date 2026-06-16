export interface DataPlatformEventFilter {
  siteIds?: number[];
  from?: string;
  to?: string;
  identifierFilter?: string;
  minVisits?: number;
  [key: string]: unknown;
}

export interface DataPlatformFunnelStep {
  eventType: string;
  widgetIds?: number[];
  goalName?: string;
  actionUrl?: string;
}

export interface DataPlatformFunnelStepResult {
  eventType: string;
  count: number;
}

export interface DataPlatformFunnelResponse {
  steps: DataPlatformFunnelStepResult[];
}

export interface DataPlatformBreakdownRow {
  label: string;
  value: number;
}

export interface DataPlatformBreakdownResult {
  data?: { rows?: DataPlatformBreakdownRow[] };
}

export interface DataPlatformBreakdownRequest {
  filter: DataPlatformEventFilter;
  dimension: string;
  eventType?: string;
  metric?: string;
  widgetIds?: number[];
  topN?: number;
}

export interface DataPlatformFunnelRequest {
  filter: DataPlatformEventFilter;
  steps: DataPlatformFunnelStep[];
}

export interface DataPlatformGraphPoint {
  timestamp: string;
  value: number;
}

export interface DataPlatformGraphSeries {
  name?: string;
  label: string;
  dataPoints: DataPlatformGraphPoint[];
}

export interface DataPlatformVisitEvent {
  eventType: string;
  timestamp: string;
  title?: string;
  url?: string;
  value?: number;
  revenue?: number;
  goalName?: string;
  actionTitle?: string;
  dimensions?: string[];
}

export interface DataPlatformVisitRow {
  sessionId: number;
  engagementScore: number;
  country?: string;
  geoCountry?: string;
  name?: string;
  identifier?: string;
  tags?: string[];
  startedAt?: string;
  events?: DataPlatformVisitEvent[];
}

export interface DataPlatformScalarResult {
  value: number;
}

export interface DataPlatformGraphResult {
  series?: DataPlatformGraphSeries[];
}

export interface DataPlatformBounceResult {
  visits: DataPlatformGraphPoint[];
  bounces: DataPlatformGraphPoint[];
}

export interface DataPlatformProfilesResult {
  totalCount?: number;
  profiles?: unknown[];
}

export interface DataPlatformVisitsResult {
  totalCount?: number;
  visits?: DataPlatformVisitRow[];
}
