import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  colorClass: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, description, colorClass, delay = 0 }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className={`absolute top-0 left-0 w-full h-1 ${colorClass}`} />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
              <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{value}</p>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
