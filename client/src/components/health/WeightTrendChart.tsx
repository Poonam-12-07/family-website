import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthLog } from '@/lib/api';

// Line colors assigned to family members in the order they're configured.
const MEMBER_COLORS = ['#E8C96B', '#7DC4A0', '#F0A0A8', '#85AAC8', '#B39DDB', '#FFB74D'];

type ChartRow = { date: string } & Record<string, number | string | null>;

function parseWeight(value: string) {
  if (!value) return null;
  const n = parseFloat(String(value).replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
}

// One row per date label, one column per member (null where they have no entry that day).
function buildChartData(logs: HealthLog[], members: string[]): ChartRow[] {
  const dates = new Set<string>();
  const byMember: Record<string, Record<string, number>> = Object.fromEntries(members.map((m) => [m, {}]));

  for (const log of logs) {
    const weight = parseWeight(log.weight);
    if (weight === null) continue;
    const member = members.find((m) => String(log.name || '').trim().toLowerCase() === m.toLowerCase());
    if (!member) continue;
    const d = new Date(log.timestamp);
    const date = isNaN(d.getTime())
      ? String(log.timestamp)
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dates.add(date);
    byMember[member][date] = weight;
  }

  return Array.from(dates).map((date) => {
    const row: ChartRow = { date };
    for (const m of members) row[m] = byMember[m][date] ?? null;
    return row;
  });
}

function WeightTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-3 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      {payload.map(
        (p) =>
          p.value !== null && (
            <div key={p.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              <span className="text-sm font-medium text-foreground">{p.name}:</span>
              <span className="text-sm font-bold" style={{ color: p.color }}>
                {p.value}
              </span>
            </div>
          ),
      )}
    </div>
  );
}

export function WeightTrendChart({ logs, members }: { logs: HealthLog[]; members: string[] }) {
  const data = buildChartData(logs, members);
  const colorOf = (i: number) => MEMBER_COLORS[i % MEMBER_COLORS.length];

  if (!data.some((row) => members.some((m) => row[m] !== null))) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-base font-semibold">Weight Trend — Family Overview</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Individual weight changes tracked over time</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2 mb-1">
            {members.map((m, i) => (
              <div key={m} className="flex items-center gap-1.5">
                <span className="w-8 h-1 rounded-full inline-block" style={{ background: colorOf(i) }} />
                <span className="text-xs font-medium text-muted-foreground">{m}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip content={<WeightTooltip />} />
              {members.map((m, i) => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  stroke={colorOf(i)}
                  strokeWidth={2.5}
                  dot={{ fill: colorOf(i), r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
