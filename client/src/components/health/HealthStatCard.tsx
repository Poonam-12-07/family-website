import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HealthStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  delay?: number;
}

export function HealthStatCard({ title, value, icon: Icon, description, delay = 0 }: HealthStatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
            <div className="p-2.5 bg-violet-100 rounded-xl">
              <Icon className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
