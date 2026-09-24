import { CircleAlert } from 'lucide-react';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
      <CircleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Could not load data from Google Sheets.</p>
        <p className="text-xs mt-1">{message}</p>
      </div>
    </div>
  );
}
