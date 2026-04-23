import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerConfig } from '@/lib/types';

interface FasterTimerProps {
  config: TimerConfig;
  onTimeUp?: () => void;
  compact?: boolean;
}

function formatTime(totalSeconds: number): { h: string; m: string; s: string } {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  return {
    h: h.toString().padStart(2, '0'),
    m: m.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0'),
  };
}

export default function FasterTimer({ config, onTimeUp, compact }: FasterTimerProps) {
  const [elapsedReal, setElapsedReal] = useState(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const onTimeUpRef = useRef(onTimeUp);
  const firedRef = useRef(false);

  onTimeUpRef.current = onTimeUp;

  const scale = config.apparentSeconds / config.actualSeconds;
  const apparentRemaining = Math.max(0, config.apparentSeconds - elapsedReal * scale);
  const progress = config.actualSeconds > 0 ? Math.min(1, elapsedReal / config.actualSeconds) : 0;

  const tick = useCallback(() => {
    const now = performance.now() / 1000;
    const elapsed = now - startTimeRef.current;
    setElapsedReal(elapsed);

    if (elapsed >= config.actualSeconds) {
      if (!firedRef.current) {
        firedRef.current = true;
        onTimeUpRef.current?.();
      }
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [config.actualSeconds]);

  useEffect(() => {
    startTimeRef.current = performance.now() / 1000;
    firedRef.current = false;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const time = formatTime(apparentRemaining);
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - progress);
  const isDone = elapsedReal >= config.actualSeconds;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" fill="none" stroke={isDone ? 'hsl(0, 72%, 51%)' : 'white'}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          </svg>
        </div>
        <div className="flex flex-col items-start">
          <span className={`font-mono text-lg font-bold tracking-tight ${isDone ? 'text-jee-red' : 'text-white'}`}>
            {time.h !== '00' ? `${time.h}:` : ''}{time.m}:{time.s}
          </span>
          <span className="text-[9px] text-white/50 font-semibold">TIME LEFT</span>
        </div>
        {scale !== 1 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70 ml-1">
            x{scale.toFixed(2)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={isDone ? 'hsl(0, 72%, 51%)' : 'hsl(var(--primary))'}
            strokeWidth="5" strokeLinecap="round" opacity="0.25" style={{ filter: 'blur(3px)' }}
            strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          <circle cx="50" cy="50" r="44" fill="none" stroke={isDone ? 'hsl(0, 72%, 51%)' : 'hsl(var(--primary))'}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-3xl font-bold tracking-tight ${isDone ? 'text-jee-red' : 'text-foreground'}`}>
            {time.h !== '00' ? `${time.h}:` : ''}{time.m}:{time.s}
          </span>
          <span className="text-[8px] font-bold tracking-[2px] text-muted-foreground mt-1">APPARENT TIME</span>
        </div>
      </div>

      {scale !== 1 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-md bg-muted text-xs">
          <span className="text-muted-foreground">Apparent: {Math.round(config.apparentSeconds / 60)}m</span>
          <span className="text-primary font-bold">x{scale.toFixed(2)}</span>
          <span className="text-muted-foreground">Actual: {Math.round(config.actualSeconds / 60)}m</span>
        </div>
      )}
    </div>
  );
}
