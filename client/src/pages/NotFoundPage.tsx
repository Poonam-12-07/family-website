import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
      <h1 className="text-5xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Link to="/" className="text-sm font-medium text-primary hover:underline">
        Back to the dashboard
      </Link>
    </div>
  );
}
