import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthTotal } from '@/lib/expenses';

function MonthTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{payload[0]?.payload?.label || label}</p>
      <p className="text-lg font-bold text-primary">
        ${Number(payload[0].value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export function MonthlyChart({ data }: { data: MonthTotal[] }) {
  const max = Math.max(...data.map((d) => d.total), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className="border-0 shadow-sm h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-semibold">Monthly Expense Comparison</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Spending trends by month</p>
        </CardHeader>
        <CardContent className="pt-0">
          {data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data to display</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<MonthTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 6 }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {data.map((d) => (
                    <Cell key={d.key} fill={d.total === max ? 'hsl(280, 65%, 50%)' : 'hsl(280, 65%, 75%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
