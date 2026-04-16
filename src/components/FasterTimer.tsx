import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerConfig } from '@/lib/types';

interface FasterTimerProps {
  config: TimerConfig;
  onTimeUp?: () => void;
  compact?: boolean;
}

function formatTime(totalSeconds: number): { h: string; m: string; s: string; ms: string } {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.floor((clamped % 1) * 1000);
  return {
    h: h.toString().padStart(2, '0'),
    m: m.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0'),
    ms: ms.toString().padStart(3, '0'),
  };
}

export default function FasterTimer({ config, onTimeUp, compact }: FasterTimerProps) {
  const [state, setState] = useState<'ready' | 'running' | 'paused' | 'done'>('ready');
  const [elapsedReal, setElapsedReal] = useState(0);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const scale = config.apparentSeconds / config.actualSeconds;
  const apparentRemaining = Math.max(0, config.apparentSeconds - elapsedReal * scale);
  const progress = config.actualSeconds > 0 ? Math.min(1, elapsedReal / config.actualSeconds) : 0;

  const tick = useCallback(() => {
    const now = performance.now() / 1000;
    const elapsed = pausedElapsedRef.current + (now - startTimeRef.current);
    setElapsedReal(elapsed);

    if (elapsed >= config.actualSeconds) {
      setState('done');
      onTimeUp?.();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [config.actualSeconds, onTimeUp]);

  const start = useCallback(() => {
    if (state === 'done') return;
    startTimeRef.current = performance.now() / 1000;
    setState('running');
    rafRef.current = requestAnimationFrame(tick);
  }, [state, tick]);

  const pause = useCallback(() => {
    if (state !== 'running') return;
    cancelAnimationFrame(rafRef.current);
    pausedElapsedRef.current = elapsedReal;
    setState('paused');
  }, [state, elapsedReal]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setElapsedReal(0);
    pausedElapsedRef.current = 0;
    setState('ready');
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const time = formatTime(apparentRemaining);
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - progress);

  const statusClass = state === 'running' ? 'bg-success/10 text-success' :
    state === 'paused' ? 'bg-primary-dim text-primary' :
    state === 'done' ? 'bg-secondary/10 text-secondary' : 'bg-surf text-text2';

  const statusLabel = state === 'running' ? 'RUNNING' :
    state === 'paused' ? 'PAUSED' :
    state === 'done' ? 'FINISHED' : 'READY';

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--surf2))" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          </svg>
        </div>
        <span className="font-mono text-lg font-bold tracking-tight text-foreground">
          {time.h !== '00' ? `${time.h}:` : ''}{time.m}:{time.s}
        </span>
        <span className={`text-[9px] font-bold tracking-widest px-2 py-1 rounded-full ${statusClass}`}>
          {statusLabel}
        </span>
        <div className="flex gap-1.5">
          {state === 'running' ? (
            <button onClick={pause} className="w-8 h-8 rounded-lg bg-surf flex items-center justify-center text-text2 hover:text-foreground text-sm">⏸</button>
          ) : state !== 'done' ? (
            <button onClick={start} className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm">▶</button>
          ) : null}
          <button onClick={reset} className="w-8 h-8 rounded-lg bg-surf flex items-center justify-center text-text2 hover:text-foreground text-sm">↺</button>
        </div>
        {scale !== 1 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-dim text-primary">
            ×{scale.toFixed(2)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--surf2))" strokeWidth="5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))"
            strokeWidth="5" strokeLinecap="round" opacity="0.25" style={{ filter: 'blur(3px)' }}
            strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))"
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {time.h !== '00' ? `${time.h}:` : ''}{time.m}:{time.s}
          </span>
          <span className="font-mono text-sm text-text3">.{time.ms}</span>
          <span className="text-[8px] font-bold tracking-[2px] text-text3 mt-1">APPARENT TIME</span>
        </div>
      </div>

      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${statusClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${state === 'running' ? 'animate-pulse-dot' : ''}`} />
        {statusLabel}
      </span>

      <div className="flex gap-2">
        <button onClick={reset} className="w-12 h-12 rounded-xl bg-surf flex items-center justify-center text-text2 hover:text-foreground text-lg">↺</button>
        {state === 'running' ? (
          <button onClick={pause} className="flex-1 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide glow-primary">⏸ PAUSE</button>
        ) : state === 'done' ? (
          <button onClick={reset} className="flex-1 h-12 px-8 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm tracking-wide">↺ RESTART</button>
        ) : (
          <button onClick={start} className="flex-1 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide glow-primary">▶ START</button>
        )}
      </div>

      {scale !== 1 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary-dim text-xs">
          <span className="text-text2">Apparent: {Math.round(config.apparentSeconds / 60)}m</span>
          <span className="text-primary font-bold">×{scale.toFixed(2)}</span>
          <span className="text-text2">Actual: {Math.round(config.actualSeconds / 60)}m</span>
        </div>
      )}
    </div>
  );
}
