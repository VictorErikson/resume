export { TB_SIGNALS_USE_DUMMY as USE_DUMMY_DATA } from '../tb-signals-dummy.config';

import { DataPlatformGraphSeries } from '../../data-platform/data-platform.model';

const MONTHS_ISO = [
  '2025-05-01T00:00:00Z',
  '2025-06-01T00:00:00Z',
  '2025-07-01T00:00:00Z',
  '2025-08-01T00:00:00Z',
  '2025-09-01T00:00:00Z',
  '2025-10-01T00:00:00Z',
  '2025-11-01T00:00:00Z',
  '2025-12-01T00:00:00Z',
  '2026-01-01T00:00:00Z',
  '2026-02-01T00:00:00Z',
  '2026-03-01T00:00:00Z',
  '2026-04-01T00:00:00Z',
];

function pts(values: number[]): { timestamp: string; value: number }[] {
  return values.map((value, i) => ({ timestamp: MONTHS_ISO[i], value }));
}

export const DUMMY_SERIES: DataPlatformGraphSeries[] = [
  {
    label: 'Shoes',
    dataPoints: pts([420, 380, 460, 510, 490, 540, 610, 720, 580, 500, 530, 470]),
  },
  {
    label: 'Jackets',
    dataPoints: pts([180, 160, 140, 130, 200, 310, 420, 460, 370, 290, 260, 220]),
  },
  {
    label: 'Accessories',
    dataPoints: pts([260, 280, 300, 290, 270, 310, 340, 390, 320, 305, 315, 290]),
  },
  {
    label: 'Bags',
    dataPoints: pts([140, 155, 170, 190, 175, 185, 210, 250, 200, 180, 175, 160]),
  },
];
