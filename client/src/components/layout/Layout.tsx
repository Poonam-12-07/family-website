import { NavLink, Outlet } from 'react-router-dom';
import { ChartColumn } from 'lucide-react';
import { LiveClock } from './LiveClock';
import { QuoteBanner } from './QuoteBanner';

const NAV_ITEMS = [
  { to: '/', label: 'Expense Tracker', emoji: '📊' },
  { to: '/reminders', label: 'Monthly Reminders', emoji: '📅' },
  { to: '/health', label: 'Health Tracker', emoji: '💪' },
  { to: '/family', label: 'Family Board', emoji: '🏠' },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-1">
          <div className="flex items-center gap-2 mr-6">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <ChartColumn className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground hidden sm:block">SpendWise</span>
          </div>
          {NAV_ITEMS.map(({ to, label, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <span>{emoji}</span>
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <div className="ml-auto hidden md:block">
            <LiveClock />
          </div>
        </div>
      </nav>
      <QuoteBanner />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
