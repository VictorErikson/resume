export { TB_SIGNALS_USE_DUMMY as USE_DUMMY_DATA } from '../tb-signals-dummy.config';

const days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 3, 7 + i);
  return d.toISOString();
});

const sessionValues = [
  1240, 1380, 980, 1520, 1760, 2100, 1950, 1430, 1290, 1610, 1840, 2230, 2480, 2310, 1780, 1550,
  1390, 1720, 1960, 2150, 2390, 2100, 1870, 1640, 1810, 2050, 2280, 2420, 2190, 2340,
];

const visitorValues = [
  920, 1050, 740, 1130, 1290, 1560, 1450, 1080, 970, 1210, 1380, 1650, 1830, 1710, 1330, 1170, 1050,
  1290, 1470, 1620, 1790, 1580, 1410, 1240, 1370, 1540, 1710, 1820, 1640, 1750,
];

const avgDurationValues = [
  180, 190, 175, 200, 210, 220, 215, 190, 185, 195, 205, 215, 225, 220, 200, 195, 188, 205, 215,
  220, 230, 220, 210, 200, 208, 218, 225, 232, 222, 228,
];

const bounceRateValues = [
  48, 46, 50, 44, 42, 39, 40, 45, 47, 43, 41, 38, 37, 38, 42, 44, 46, 43, 41, 39, 37, 39, 41, 43,
  41, 39, 38, 37, 39, 38,
];

const pageViewValues = [
  3100, 3450, 2450, 3800, 4400, 5250, 4870, 3570, 3220, 4020, 4600, 5570, 6200, 5770, 4450, 3870,
  3470, 4300, 4900, 5380, 5970, 5250, 4670, 4100, 4520, 5120, 5700, 6050, 5470, 5850,
];

export const DUMMY_TREND = days.map((timestamp, i) => ({
  timestamp,
  value: sessionValues[i],
}));

export const DUMMY_KPI_TRENDS: Record<string, number[]> = {
  sessions: sessionValues,
  visitors: visitorValues,
  avgDuration: avgDurationValues,
  bounceRate: bounceRateValues,
  pageViews: pageViewValues,
};

export const DUMMY_SCALARS = {
  sessionsCount: '52 340',
  visitorsCount: '38 910',
  avgDuration: '3m 14s',
  bounceRate: '41%',
  pageViewsCount: '124 780',
};

export const DUMMY_KPI_CHANGES: Record<string, number> = {
  sessions: 12.4,
  visitors: 8.7,
  avgDuration: 5.3,
  bounceRate: -3.2,
  pageViews: 15.1,
};

export const DUMMY_PAGES: { label: string; count: number }[] = [
  { label: '/', count: 18420 },
  { label: '/products', count: 12340 },
  { label: '/products/jackets', count: 8910 },
  { label: '/checkout', count: 6780 },
  { label: '/products/shoes', count: 5430 },
  { label: '/account/login', count: 4120 },
  { label: '/blog/winter-trends-2026', count: 2870 },
  { label: '/cart', count: 2340 },
];
