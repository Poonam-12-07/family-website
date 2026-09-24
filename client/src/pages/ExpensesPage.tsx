import { useMemo } from 'react';
import { ChartColumn, DollarSign, Hash } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/expenses/StatCard';
import { MonthlyChart } from '@/components/expenses/MonthlyChart';
import { CategoryChart } from '@/components/expenses/CategoryChart';
import { ExpenseLedger } from '@/components/expenses/ExpenseLedger';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { amountOf, categoryTotals, monthlyTotals } from '@/lib/expenses';
import { useSheetData } from '@/lib/useSheetData';
import { formatCurrency } from '@/lib/utils';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="px-6 py-8 md:px-10">
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6 border-0 shadow-sm">
            <Skeleton className="h-3 w-32 mb-3" />
            <Skeleton className="h-10 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6 border-0 shadow-sm">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-3 w-32 mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </Card>
        ))}
      </div>
      <Card className="mx-4 p-6 border-0 shadow-sm">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function ExpensesPage() {
  const { data: expenses, isLoading, error, refresh } = useSheetData(api.expenses);

  const monthly = useMemo(() => monthlyTotals(expenses), [expenses]);
  const categories = useMemo(() => categoryTotals(expenses), [expenses]);
  const total = useMemo(() => expenses.reduce((sum, e) => sum + amountOf(e), 0), [expenses]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        icon={ChartColumn}
        title="📊 SpendWise Dashboard"
        subtitle="Real-time automated insights from your mobile logs."
        onRefresh={refresh}
        isLoading={isLoading}
      />
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Expenses Logged"
          value={expenses.length.toLocaleString()}
          icon={Hash}
          description="All-time transaction count"
          colorClass="bg-primary"
          delay={0.1}
        />
        <StatCard
          title="All-Time Expenditures"
          value={formatCurrency(total)}
          icon={DollarSign}
          description="Cumulative amount spent"
          colorClass="bg-accent"
          delay={0.15}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyChart data={monthly} />
        <CategoryChart data={categories} />
      </div>
      <ExpenseLedger expenses={expenses} />
    </div>
  );
}
