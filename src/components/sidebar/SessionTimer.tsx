import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface SessionTimerProps {
  startedAt?: string;
  className?: string;
}

export function SessionTimer({ startedAt, className = '' }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;

    const start = new Date(startedAt).getTime();

    function update() {
      const diff = Date.now() - start;
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        hrs > 0
          ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : `${mins}:${String(secs).padStart(2, '0')}`,
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <div className={`flex items-center gap-1.5 font-mono text-xs text-muted-foreground ${className}`}>
      <Timer className="h-3.5 w-3.5" />
      <span>{elapsed}</span>
    </div>
  );
}
