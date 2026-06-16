export { TB_SIGNALS_USE_DUMMY as USE_DUMMY_DATA } from '../tb-signals-dummy.config';

export type BadgeKind =
  | 'purchase'
  | 'goal'
  | 'login'
  | 'signup'
  | 'widget'
  | 'coupon'
  | 'survey'
  | 'abandoned';

export interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

export interface FeedEntry {
  country: string;
  name: string;
  tags: string[];
  actionLabel: string;
  badgeText: string;
  badgeKind: BadgeKind;
  timestamp?: string;
  sessionId?: number;
  identifier?: string;
  dimensions?: string[];
}

export const STAT_CARDS: StatCard[] = [
  {
    label: 'tb-signals.stat-cards.high-intent-now',
    value: '23',
    change: '+12%',
    positive: true,
    icon: 'local_fire_department',
  },
  {
    label: 'tb-signals.stat-cards.returning-visitors',
    value: '148',
    change: '+8%',
    positive: true,
    icon: 'group',
  },
  {
    label: 'tb-signals.stat-cards.cart-abandoners',
    value: '34',
    change: '-5%',
    positive: false,
    icon: 'remove_shopping_cart',
  },
  {
    label: 'tb-signals.stat-cards.in-checkout',
    value: '414 988 kr',
    change: '+18%',
    positive: true,
    icon: 'payments',
  },
];

export const FEED_ENTRIES: FeedEntry[] = [
  {
    country: 'SE',
    name: 'Maria Lindström',
    tags: ['Member', 'Returning'],
    actionLabel: 'Bought Winter Jacket',
    badgeText: '2 349 kr',
    badgeKind: 'purchase',
    dimensions: ['Category: Jackets', 'Brand: Nike'],
  },
  {
    country: 'FI',
    name: 'Anonymous',
    tags: ['New Visitor'],
    actionLabel: 'Browsing Womens Socks',
    badgeText: '',
    badgeKind: 'goal',
    dimensions: ['Category: Accessories', 'Gender: Women'],
  },
  {
    country: 'SE',
    name: 'Johan Eriksson',
    tags: ['Member', 'Returning'],
    actionLabel: 'Browsing Mens Pants',
    badgeText: 'Logged in',
    badgeKind: 'login',
    dimensions: ['Category: Pants', 'Gender: Men'],
  },
  {
    country: 'NO',
    name: 'Anna Bergström',
    tags: ['Member'],
    actionLabel: 'Clicked widget',
    badgeText: 'Summer sale',
    badgeKind: 'widget',
    dimensions: ['Category: Dresses'],
  },
  {
    country: 'DK',
    name: 'Anonymous',
    tags: ['New Visitor'],
    actionLabel: 'Left with unpaid cart',
    badgeText: '899 kr',
    badgeKind: 'abandoned',
    dimensions: ['Page Type: Cart', 'Category: Shoes'],
  },
  {
    country: 'SE',
    name: 'Erik Johansson',
    tags: ['Returning'],
    actionLabel: 'Signed up',
    badgeText: 'New member',
    badgeKind: 'signup',
    dimensions: ['Category: Shoes', 'Brand: Adidas'],
  },
  {
    country: 'FI',
    name: 'Tiina Mäkinen',
    tags: ['Member', 'Returning'],
    actionLabel: 'Copied coupon code',
    badgeText: 'SUMMER20',
    badgeKind: 'coupon',
    dimensions: ['Category: Tops'],
  },
  {
    country: 'NO',
    name: 'Lars Haugen',
    tags: ['New Visitor'],
    actionLabel: 'Answered survey',
    badgeText: 'Survey response',
    badgeKind: 'survey',
  },
];

export const INCOMING_ENTRIES: FeedEntry[] = [
  {
    country: 'SE',
    name: 'Klara Nilsson',
    tags: ['Member'],
    actionLabel: 'Bought Silk Blouse',
    badgeText: '799 kr',
    badgeKind: 'purchase',
    dimensions: ['Category: Tops', 'Brand: Filippa K'],
  },
  {
    country: 'DE',
    name: 'Anonymous',
    tags: ['New Visitor'],
    actionLabel: 'Browsing Jackets',
    badgeText: '',
    badgeKind: 'goal',
    dimensions: ['Category: Jackets'],
  },
  {
    country: 'NO',
    name: 'Ingrid Solberg',
    tags: ['Returning'],
    actionLabel: 'Left with unpaid cart',
    badgeText: '1 450 kr',
    badgeKind: 'abandoned',
    dimensions: ['Page Type: Cart', 'Category: Jackets', 'Brand: Nike'],
  },
  {
    country: 'SE',
    name: 'Pontus Ek',
    tags: ['Member', 'Returning'],
    actionLabel: 'Signed up',
    badgeText: 'New subscriber',
    badgeKind: 'signup',
    dimensions: ['Category: Shoes'],
  },
  {
    country: 'FI',
    name: 'Mikael Virtanen',
    tags: ['New Visitor'],
    actionLabel: 'Clicked widget',
    badgeText: 'Free shipping',
    badgeKind: 'widget',
  },
  {
    country: 'DK',
    name: 'Sofie Hansen',
    tags: ['Member'],
    actionLabel: 'Bought Linen Trousers',
    badgeText: '649 kr',
    badgeKind: 'purchase',
    dimensions: ['Category: Pants', 'Brand: Acne Studios'],
  },
  {
    country: 'SE',
    name: 'Anonymous',
    tags: ['New Visitor'],
    actionLabel: 'Browsing Checkout',
    badgeText: '',
    badgeKind: 'goal',
    dimensions: ['Page Type: Checkout', 'Category: Shoes'],
  },
  {
    country: 'NO',
    name: 'Håkon Berg',
    tags: ['Returning'],
    actionLabel: 'Logged in',
    badgeText: 'Logged in',
    badgeKind: 'login',
    dimensions: ['Category: Sportswear', 'Brand: Adidas'],
  },
];

export const DUMMY_VISITOR_HISTORY: Record<string, FeedEntry[]> = {
  'Maria Lindström': [
    {
      country: 'SE',
      name: 'Maria Lindström',
      tags: ['Member', 'Returning'],
      actionLabel: 'Signed up',
      badgeText: 'New member',
      badgeKind: 'signup',
      timestamp: '2026-04-15T09:12:00.000Z',
    },
    {
      country: 'SE',
      name: 'Maria Lindström',
      tags: ['Member', 'Returning'],
      actionLabel: 'Bought Woolen Sweater',
      badgeText: '1 599 kr',
      badgeKind: 'purchase',
      timestamp: '2026-05-01T14:34:00.000Z',
    },
    {
      country: 'SE',
      name: 'Maria Lindström',
      tags: ['Member', 'Returning'],
      actionLabel: 'Clicked widget',
      badgeText: 'Summer sale',
      badgeKind: 'widget',
      timestamp: '2026-05-20T11:07:00.000Z',
    },
    {
      country: 'SE',
      name: 'Maria Lindström',
      tags: ['Member', 'Returning'],
      actionLabel: 'Logged in',
      badgeText: 'Logged in',
      badgeKind: 'login',
      timestamp: '2026-06-10T08:45:00.000Z',
    },
  ],
  'Johan Eriksson': [
    {
      country: 'SE',
      name: 'Johan Eriksson',
      tags: ['Member', 'Returning'],
      actionLabel: 'Signed up',
      badgeText: 'New member',
      badgeKind: 'signup',
      timestamp: '2026-03-20T16:22:00.000Z',
    },
    {
      country: 'SE',
      name: 'Johan Eriksson',
      tags: ['Member', 'Returning'],
      actionLabel: 'Answered survey',
      badgeText: 'Survey response',
      badgeKind: 'survey',
      timestamp: '2026-04-08T10:55:00.000Z',
    },
    {
      country: 'SE',
      name: 'Johan Eriksson',
      tags: ['Member', 'Returning'],
      actionLabel: 'Bought Running Shoes',
      badgeText: '1 199 kr',
      badgeKind: 'purchase',
      timestamp: '2026-05-14T13:30:00.000Z',
    },
  ],
  'Anna Bergström': [
    {
      country: 'NO',
      name: 'Anna Bergström',
      tags: ['Member'],
      actionLabel: 'Signed up',
      badgeText: 'New member',
      badgeKind: 'signup',
      timestamp: '2026-02-12T08:10:00.000Z',
    },
    {
      country: 'NO',
      name: 'Anna Bergström',
      tags: ['Member'],
      actionLabel: 'Bought Linen Dress',
      badgeText: '899 kr',
      badgeKind: 'purchase',
      timestamp: '2026-04-22T15:18:00.000Z',
    },
    {
      country: 'NO',
      name: 'Anna Bergström',
      tags: ['Member'],
      actionLabel: 'Copied coupon code',
      badgeText: 'WELCOME10',
      badgeKind: 'coupon',
      timestamp: '2026-05-30T09:45:00.000Z',
    },
  ],
  'Erik Johansson': [
    {
      country: 'SE',
      name: 'Erik Johansson',
      tags: ['Returning'],
      actionLabel: 'Browsing Mens Shoes',
      badgeText: '',
      badgeKind: 'goal',
      timestamp: '2026-05-25T17:03:00.000Z',
    },
    {
      country: 'SE',
      name: 'Erik Johansson',
      tags: ['Returning'],
      actionLabel: 'Browsing Checkout',
      badgeText: '',
      badgeKind: 'goal',
      timestamp: '2026-06-01T14:12:00.000Z',
    },
    {
      country: 'SE',
      name: 'Erik Johansson',
      tags: ['Returning'],
      actionLabel: 'Left with unpaid cart',
      badgeText: '549 kr',
      badgeKind: 'abandoned',
      timestamp: '2026-06-01T14:23:00.000Z',
    },
  ],
  'Tiina Mäkinen': [
    {
      country: 'FI',
      name: 'Tiina Mäkinen',
      tags: ['Member', 'Returning'],
      actionLabel: 'Signed up',
      badgeText: 'New subscriber',
      badgeKind: 'signup',
      timestamp: '2026-01-30T11:44:00.000Z',
    },
    {
      country: 'FI',
      name: 'Tiina Mäkinen',
      tags: ['Member', 'Returning'],
      actionLabel: 'Bought Silk Blouse',
      badgeText: '749 kr',
      badgeKind: 'purchase',
      timestamp: '2026-03-15T13:22:00.000Z',
    },
    {
      country: 'FI',
      name: 'Tiina Mäkinen',
      tags: ['Member', 'Returning'],
      actionLabel: 'Clicked widget',
      badgeText: 'Spring styles',
      badgeKind: 'widget',
      timestamp: '2026-04-19T10:05:00.000Z',
    },
    {
      country: 'FI',
      name: 'Tiina Mäkinen',
      tags: ['Member', 'Returning'],
      actionLabel: 'Bought Linen Trousers',
      badgeText: '649 kr',
      badgeKind: 'purchase',
      timestamp: '2026-05-28T16:50:00.000Z',
    },
  ],
  'Klara Nilsson': [
    {
      country: 'SE',
      name: 'Klara Nilsson',
      tags: ['Member'],
      actionLabel: 'Signed up',
      badgeText: 'New member',
      badgeKind: 'signup',
      timestamp: '2026-03-01T09:00:00.000Z',
    },
    {
      country: 'SE',
      name: 'Klara Nilsson',
      tags: ['Member'],
      actionLabel: 'Answered survey',
      badgeText: 'Survey response',
      badgeKind: 'survey',
      timestamp: '2026-04-10T14:30:00.000Z',
    },
    {
      country: 'SE',
      name: 'Klara Nilsson',
      tags: ['Member'],
      actionLabel: 'Bought Winter Coat',
      badgeText: '2 199 kr',
      badgeKind: 'purchase',
      timestamp: '2026-05-05T11:15:00.000Z',
    },
  ],
  'Ingrid Solberg': [
    {
      country: 'NO',
      name: 'Ingrid Solberg',
      tags: ['Returning'],
      actionLabel: 'Browsing Jackets',
      badgeText: '',
      badgeKind: 'goal',
      timestamp: '2026-05-18T10:22:00.000Z',
    },
    {
      country: 'NO',
      name: 'Ingrid Solberg',
      tags: ['Returning'],
      actionLabel: 'Left with unpaid cart',
      badgeText: '999 kr',
      badgeKind: 'abandoned',
      timestamp: '2026-05-18T10:48:00.000Z',
    },
    {
      country: 'NO',
      name: 'Ingrid Solberg',
      tags: ['Returning'],
      actionLabel: 'Browsing Mens Sportswear',
      badgeText: '',
      badgeKind: 'goal',
      timestamp: '2026-06-05T09:14:00.000Z',
    },
  ],
  'Pontus Ek': [
    {
      country: 'SE',
      name: 'Pontus Ek',
      tags: ['Member', 'Returning'],
      actionLabel: 'Browsing Shoes',
      badgeText: '',
      badgeKind: 'goal',
      timestamp: '2026-05-10T15:40:00.000Z',
    },
    {
      country: 'SE',
      name: 'Pontus Ek',
      tags: ['Member', 'Returning'],
      actionLabel: 'Bought Sneakers',
      badgeText: '1 099 kr',
      badgeKind: 'purchase',
      timestamp: '2026-05-22T12:35:00.000Z',
    },
  ],
  'Sofie Hansen': [
    {
      country: 'DK',
      name: 'Sofie Hansen',
      tags: ['Member'],
      actionLabel: 'Signed up',
      badgeText: 'New member',
      badgeKind: 'signup',
      timestamp: '2026-02-28T13:00:00.000Z',
    },
    {
      country: 'DK',
      name: 'Sofie Hansen',
      tags: ['Member'],
      actionLabel: 'Bought Linen Shirt',
      badgeText: '499 kr',
      badgeKind: 'purchase',
      timestamp: '2026-04-12T10:20:00.000Z',
    },
    {
      country: 'DK',
      name: 'Sofie Hansen',
      tags: ['Member'],
      actionLabel: 'Copied coupon code',
      badgeText: 'SUMMER20',
      badgeKind: 'coupon',
      timestamp: '2026-05-31T09:55:00.000Z',
    },
  ],
  'Håkon Berg': [
    {
      country: 'NO',
      name: 'Håkon Berg',
      tags: ['Returning'],
      actionLabel: 'Browsing Sportswear',
      badgeText: '',
      badgeKind: 'goal',
      timestamp: '2026-04-20T08:30:00.000Z',
    },
    {
      country: 'NO',
      name: 'Håkon Berg',
      tags: ['Returning'],
      actionLabel: 'Bought Training Jacket',
      badgeText: '1 349 kr',
      badgeKind: 'purchase',
      timestamp: '2026-05-03T16:10:00.000Z',
    },
    {
      country: 'NO',
      name: 'Håkon Berg',
      tags: ['Returning'],
      actionLabel: 'Logged in',
      badgeText: 'Logged in',
      badgeKind: 'login',
      timestamp: '2026-06-12T07:55:00.000Z',
    },
  ],
};

export const BADGE_ICONS: Record<BadgeKind, string> = {
  purchase: 'payments',
  goal: 'check_circle',
  login: 'login',
  signup: 'person_add',
  widget: 'ads_click',
  coupon: 'local_offer',
  survey: 'quiz',
  abandoned: 'remove_shopping_cart',
};
