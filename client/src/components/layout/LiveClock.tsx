import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Thermometer, Wind } from 'lucide-react';
import { useConfig } from '@/lib/config';

interface CurrentWeather {
  temperature: number;
  weathercode: number;
}

// WMO weather codes: 0-1 clear, 2-3 cloudy, up to 67 rain/drizzle, 71-77 snow, higher = storms.
function WeatherIcon({ code }: { code: number }) {
  if (code <= 1) return <Sun className="w-4 h-4 text-yellow-400" />;
  if (code <= 3) return <Cloud className="w-4 h-4 text-slate-400" />;
  if (code <= 67) return <CloudRain className="w-4 h-4 text-blue-400" />;
  if (code <= 77) return <CloudSnow className="w-4 h-4 text-blue-200" />;
  return <Wind className="w-4 h-4 text-slate-400" />;
}

export function LiveClock() {
  const { weather: location } = useConfig();
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&temperature_unit=fahrenheit`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => d.current_weather && setWeather(d.current_weather))
      .catch(() => {});
  }, [location.latitude, location.longitude]);

  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex flex-col items-end leading-tight">
      <div className="flex items-center gap-1.5">
        <Thermometer className="w-3.5 h-3.5 text-primary/60" />
        <span className="text-xs font-semibold text-foreground">
          {date}
          {'  ·  '}
          {time}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {weather ? (
          <>
            <WeatherIcon code={weather.weathercode} />
            <span className="text-xs text-muted-foreground font-medium">
              {Math.round(weather.temperature)}°F · {location.label}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Loading weather…</span>
        )}
      </div>
    </div>
  );
}
