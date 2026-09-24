import type { Expense } from './api';
import { MONTHS } from './utils';

// Keyword rules for "Where is the Money Going?". The first matching rule wins,
// so order matters (e.g. "food" hits Groceries before anything else).
const CATEGORY_RULES = [
  { label: 'Food', keywords: ['lunch', 'dinner', 'snack', 'breakfast'] },
  {
    label: 'Groceries & Retail',
    keywords: [
      'walmart', 'target', 'costco', 'groceries', 'grocery', 'aldi', 'kroger', 'safeway',
      'trader joe', 'whole foods', 'supermarket', 'market', 'food', 'bakery',
    ],
  },
  {
    label: 'Transport',
    keywords: [
      'gas', 'fuel', 'shell', 'chevron', 'bp', 'exxon', 'uber', 'lyft', 'taxi', 'transit',
      'metro', 'bus', 'parking', 'toll', 'petrol', 'mob',
    ],
  },
  {
    label: 'Dining Out',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'pizza', 'burger', 'dining', 'eat',
      'diner', 'bar', 'pub', 'grill', 'sushi', 'taco', 'chicken', 'subway',
    ],
  },
  {
    label: 'Shopping',
    keywords: ['amazon', 'ebay', 'online', 'shop', 'store', 'mall', 'best buy', 'ikea', 'home depot', 'lowes'],
  },
  {
    label: 'Entertainment',
    keywords: [
      'netflix', 'spotify', 'hulu', 'disney', 'subscription', 'gym', 'fitness', 'cinema', 'movie',
      'theater', 'game', 'entertainment',
    ],
  },
  {
    label: 'Bills & Utilities',
    keywords: ['electric', 'water', 'internet', 'phone', 'utility', 'bill', 'rent', 'insurance', 'mortgage'],
  },
  {
    label: 'Healthcare',
    keywords: ['doctor', 'pharmacy', 'hospital', 'medical', 'health', 'cvs', 'walgreens', 'clinic', 'dental'],
  },
];

export function categorize(shop: string | undefined) {
  if (!shop) return 'Other';
  const name = String(shop).toLowerCase();
  return CATEGORY_RULES.find((rule) => rule.keywords.some((k) => name.includes(k)))?.label ?? 'Other';
}

export const amountOf = (e: Expense) => Number(e.totalAmount) || 0;

export interface MonthTotal {
  key: string;
  label: string;
  shortLabel: string;
  total: number;
}

export function monthlyTotals(expenses: Expense[]): MonthTotal[] {
  const months: Record<string, MonthTotal> = {};
  for (const e of expenses) {
    const d = new Date(e.timestamp);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    months[key] ??= {
      key,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      shortLabel: MONTHS[d.getMonth()].slice(0, 3),
      total: 0,
    };
    months[key].total += amountOf(e);
  }
  return Object.values(months).sort((a, b) => a.key.localeCompare(b.key));
}

export interface CategoryTotal {
  name: string;
  value: number;
}

export function categoryTotals(expenses: Expense[]): CategoryTotal[] {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    const category = categorize(e.shop);
    totals[category] = (totals[category] ?? 0) + amountOf(e);
  }
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}
