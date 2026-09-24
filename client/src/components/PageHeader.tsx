import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
  gradientClassName?: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
  refreshClassName?: string;
}

// Title block shared by all four pages: icon + heading + subtitle, optional badges, Refresh button.
export function PageHeader({
  icon: Icon,
  iconClassName = 'text-primary',
  iconBgClassName = 'bg-primary/10',
  gradientClassName = 'from-primary/8 via-primary/4 to-accent/6',
  title,
  subtitle,
  children,
  onRefresh,
  isLoading,
  refreshClassName = 'border-primary/20 hover:bg-primary/5 hover:border-primary/40',
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className={cn('absolute inset-0 bg-gradient-to-r rounded-2xl', gradientClassName)} />
      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('p-2.5 rounded-xl', iconBgClassName)}>
                <Icon className={cn('w-6 h-6', iconClassName)} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            </div>
            <p className="text-muted-foreground text-sm md:text-base font-medium ml-1">{subtitle}</p>
            {children}
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className={cn('self-start md:self-auto gap-2 transition-all', refreshClassName)}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
