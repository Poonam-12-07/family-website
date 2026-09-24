import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarClock, CircleAlert, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { api, type Reminder } from '@/lib/api';
import { useSheetData } from '@/lib/useSheetData';
import { MONTHS } from '@/lib/utils';

interface Palette {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

// One color theme per calendar month (Jan..Dec); slate for undated reminders.
const MONTH_PALETTES: Palette[] = [
  { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-400' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-400' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-400' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-400' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-400' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-400' },
  { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200', dot: 'bg-lime-400' },
];
const UNDATED_PALETTE: Palette = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };

// Accepts anything Date can parse, plus DD/MM/YYYY.
function parseReminderDate(value: string) {
  if (!value) return null;
  const s = String(value).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const dmy = new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
    if (!isNaN(dmy.getTime())) return dmy;
  }
  return null;
}

interface MonthGroup {
  label: string;
  monthIndex: number;
  sortKey: number;
  items: Reminder[];
}

function groupByMonth(reminders: Reminder[]): MonthGroup[] {
  const groups: Record<string, MonthGroup> = {};
  for (const r of reminders) {
    const d = parseReminderDate(r.date);
    if (d) {
      const key = `${d.getFullYear()}_${d.getMonth()}`;
      groups[key] ??= {
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        monthIndex: d.getMonth(),
        sortKey: d.getFullYear() * 100 + d.getMonth(),
        items: [],
      };
      groups[key].items.push(r);
    } else {
      groups.uncategorized ??= { label: 'Upcoming / Uncategorized', monthIndex: -1, sortKey: 99999, items: [] };
      groups.uncategorized.items.push(r);
    }
  }
  return Object.values(groups).sort((a, b) => a.sortKey - b.sortKey);
}

export default function RemindersPage() {
  const { data: reminders, isLoading, error, refresh } = useSheetData(api.reminders);

  const groups = useMemo(() => groupByMonth(reminders), [reminders]);
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return groups.find((g) => g.label === `${MONTHS[now.getMonth()]} ${now.getFullYear()}`)?.items.length ?? 0;
  }, [groups]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          icon={CalendarClock}
          title="📅 Upcoming Calendar Reminders"
          subtitle="Stay on top of your recurring payments and important dates."
          onRefresh={refresh}
          isLoading={isLoading}
        >
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1 font-semibold">
              {thisMonthCount} reminder{thisMonthCount !== 1 ? 's' : ''} this month
            </Badge>
          </div>
        </PageHeader>

        {error && <ErrorBanner message={error} />}

        {!isLoading && !error && reminders.length === 0 && (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3">
            <CircleAlert className="w-10 h-10 text-muted-foreground/40" />
            <p>No reminders found.</p>
          </div>
        )}

        {groups.map((group, gi) => {
          const palette = group.monthIndex >= 0 ? MONTH_PALETTES[group.monthIndex] : UNDATED_PALETTE;
          return (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: gi * 0.08 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${palette.bg} ${palette.text} ${palette.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">
                  {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((r, ri) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: gi * 0.08 + ri * 0.05 }}
                  >
                    <Card className={`border shadow-sm hover:shadow-md transition-all duration-200 ${palette.border}`}>
                      <CardContent className="p-5">
                        <h3 className="text-base font-bold text-foreground mb-3 leading-snug">{r.title}</h3>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${palette.text}`} />
                            <span className="text-sm text-muted-foreground font-medium">{r.date}</span>
                          </div>
                          {r.time && (
                            <div className="flex items-center gap-2">
                              <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${palette.text}`} />
                              <span className="text-sm text-muted-foreground">{r.time}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
