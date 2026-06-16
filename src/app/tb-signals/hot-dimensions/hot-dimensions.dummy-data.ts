export { TB_SIGNALS_USE_DUMMY as USE_DUMMY_DATA } from '../tb-signals-dummy.config';

export interface DummyDimRow {
  label: string;
  count: number;
  barWidth: number;
  trendPct: number | null;
  trendUp: boolean;
}

export const DUMMY_ROWS: DummyDimRow[] = [
  { label: 'Category: Shoes', count: 450, barWidth: 100, trendPct: 34, trendUp: true },
  { label: 'Brand: Nike', count: 320, barWidth: 71, trendPct: 67, trendUp: true },
  { label: 'Category: Jackets', count: 280, barWidth: 62, trendPct: -8, trendUp: false },
  { label: 'Brand: Adidas', count: 190, barWidth: 42, trendPct: 12, trendUp: true },
  { label: 'Gender: Women', count: 160, barWidth: 36, trendPct: 5, trendUp: true },
  { label: 'Page Type: Cart', count: 85, barWidth: 19, trendPct: 22, trendUp: true },
  { label: 'Page Type: Checkout', count: 38, barWidth: 8, trendPct: null, trendUp: false },
];
