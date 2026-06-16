export { TB_SIGNALS_USE_DUMMY as USE_DUMMY_DATA } from '../tb-signals-dummy.config';

import { FunnelChartStep } from '../../data-platform/funnels/funnel-chart/funnel-chart.component';
import type { LiveFunnelTabId } from './live-funnel.component';

function buildSteps(rows: { value: string; label: string; count: number }[]): FunnelChartStep[] {
  const first = rows[0]?.count ?? 1;
  return rows.map((r, i) => {
    const prev = i > 0 ? rows[i - 1].count : null;
    return {
      value: r.value,
      label: r.label,
      count: r.count,
      percentage: first > 0 ? (r.count / first) * 100 : 0,
      dropoff:
        prev !== null
          ? { count: prev - r.count, percentage: prev > 0 ? ((prev - r.count) / prev) * 100 : 0 }
          : null,
    };
  });
}

export const DUMMY_STEPS: FunnelChartStep[] = buildSteps([
  { value: 'pageType:product', label: 'Product', count: 142 },
  { value: 'pageType:cart', label: 'Cart', count: 38 },
  { value: 'pageType:checkout', label: 'Checkout', count: 11 },
  { value: 'pageType:confirmation', label: 'Confirmation', count: 6 },
]);

export const DUMMY_STEPS_BY_TAB: Record<LiveFunnelTabId, FunnelChartStep[]> = {
  pageType: DUMMY_STEPS,
  referrer: buildSteps([
    { value: 'direct', label: 'Direct', count: 412 },
    { value: 'search', label: 'Search', count: 287 },
    { value: 'social', label: 'Social', count: 134 },
    { value: 'email', label: 'Email', count: 88 },
    { value: 'referral', label: 'Referral', count: 41 },
  ]),
  device: buildSteps([
    { value: 'chrome', label: 'Chrome', count: 524 },
    { value: 'safari', label: 'Safari', count: 312 },
    { value: 'edge', label: 'Edge', count: 96 },
    { value: 'firefox', label: 'Firefox', count: 54 },
    { value: 'samsung', label: 'Samsung Internet', count: 31 },
  ]),
  category: buildSteps([
    { value: 'category:shoes', label: 'Shoes', count: 218 },
    { value: 'category:apparel', label: 'Apparel', count: 174 },
    { value: 'category:accessories', label: 'Accessories', count: 92 },
    { value: 'category:sale', label: 'Sale', count: 47 },
  ]),
  campaign: buildSteps([
    { value: 'spring-launch', label: 'Spring Launch', count: 96 },
    { value: 'newsletter-w19', label: 'Newsletter W19', count: 64 },
    { value: 'paid-search-brand', label: 'Paid Search — Brand', count: 41 },
    { value: 'retargeting-cart', label: 'Retargeting — Cart', count: 19 },
  ]),
  conversion: buildSteps([
    { value: 'session', label: 'Visit Start', count: 1042 },
    { value: 'pageview', label: 'Page View', count: 968 },
    { value: 'purchase', label: 'Purchase', count: 47 },
  ]),
};
