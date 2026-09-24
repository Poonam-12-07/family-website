import { useMemo } from 'react';
import { Hash, HeartPulse, Weight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { HealthStatCard } from '@/components/health/HealthStatCard';
import { WeightTrendChart } from '@/components/health/WeightTrendChart';
import { HealthLedger } from '@/components/health/HealthLedger';
import { Badge } from '@/components/ui/badge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useConfig } from '@/lib/config';
import { useSheetData } from '@/lib/useSheetData';

export default function HealthPage() {
  const { familyMembers } = useConfig();
  const { data: logs, isLoading, error, refresh } = useSheetData(api.health);

  const latestWeight = useMemo(() => [...logs].reverse().find((l) => l.weight)?.weight ?? '—', [logs]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          icon={HeartPulse}
          iconClassName="text-violet-600"
          iconBgClassName="bg-violet-100"
          gradientClassName="from-violet-500/8 via-purple-400/4 to-fuchsia-400/6"
          title="💪 Personal Health Metrics"
          subtitle="Real-time logs synced from your Telegram fitness updates."
          onRefresh={refresh}
          isLoading={isLoading}
          refreshClassName="border-violet-200 hover:bg-violet-50 hover:border-violet-400"
        >
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-sm px-3 py-1 font-semibold">
              {logs.length} log{logs.length !== 1 ? 's' : ''} recorded
            </Badge>
          </div>
        </PageHeader>

        {error && <ErrorBanner message={error} />}

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <HealthStatCard
                title="Logs Submitted"
                value={logs.length.toLocaleString()}
                icon={Hash}
                description="Total health entries recorded"
                delay={0.1}
              />
              <HealthStatCard
                title="Latest Weight Entry"
                value={latestWeight}
                icon={Weight}
                description="Most recent weight logged"
                delay={0.15}
              />
            </div>
            <WeightTrendChart logs={logs} members={familyMembers} />
            <HealthLedger logs={logs} />
          </>
        )}
      </div>
    </div>
  );
}
