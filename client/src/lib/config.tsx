import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AppConfig } from './api';

const ConfigContext = createContext<AppConfig | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.config().then(setConfig).catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Could not reach the API server. Is it running on port 3001?
      </div>
    );
  }
  if (!config) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const config = useContext(ConfigContext);
  if (!config) throw new Error('useConfig must be used inside ConfigProvider');
  return config;
}
