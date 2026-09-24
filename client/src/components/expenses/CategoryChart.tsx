import { motion } from 'framer-motion';
import { ChartPie } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type PieLabelRenderProps, type TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryTotal } from '@/lib/expenses';

const COLORS = [
  'hsl(207, 72%, 47%)',
  'hsl(160, 84%, 39%)',
  'hsl(43, 96%, 56%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
  'hsl(200, 60%, 50%)',
  'hsl(20, 80%, 55%)',
  'hsl(120, 50%, 45%)',
];

function CategoryTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: slice } = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <p className="text-lg font-bold" style={{ color: slice.fill }}>
        ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// Percent label drawn inside each slice; hidden for slices under 5%.
function SliceLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) {
  const p = Number(percent);
  if (p < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(p * 100).toFixed(0)}%`}
    </text>
  );
}

export function CategoryChart({ data }: { data: CategoryTotal[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
      <Card className="border-0 shadow-sm h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ChartPie className="w-5 h-5 text-accent" />
            <CardTitle className="text-base font-semibold">Where is the Money Going?</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Auto-categorized from shop names</p>
        </CardHeader>
        <CardContent className="pt-0">
          {data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data to display</div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    dataKey="value"
                    labelLine={false}
                    label={SliceLabel}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                  >
                    {data.map((d, i) => (
                      <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                {data.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">
                      {d.name}
                      <span className="font-semibold text-foreground ml-1">
                        {total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
