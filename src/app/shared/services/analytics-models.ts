export interface AnalyticsIdentifiedPerDate {
  date: string;
  identified: number;
  unidentified: number;
}

export interface IdentifiedRateSiteResponse {
  siteId?: number;
  items?: AnalyticsIdentifiedPerDate[];
}

export interface RevenueResponse {
  count?: number;
}

export interface NamedDailyItem {
  date: string;
  count: number;
}

export interface NamedSeries {
  name: string;
  count?: number;
  items: NamedDailyItem[];
}

export interface AnalyticsGraphResponse {
  data?: { items?: NamedSeries[] };
}
