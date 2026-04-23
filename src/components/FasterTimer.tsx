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

  const statusClass = state === 'running' ? 'bg-jee-green/10 text-jee-green' :
    state === 'paused' ? 'bg-primary/10 text-primary' :
    state === 'done' ? 'bg-jee-red/10 text-jee-red' : 'bg-muted text-muted-foreground';

  const statusLabel = state === 'running' ? 'RUNNING' :
    state === 'paused' ? 'PAUSED' :
    state === 'done' ? 'FINISHED' : 'READY';

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="white"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          </svg>
        </div>
        <div className="flex flex-col items-start">
          <span className="font-mono text-lg font-bold tracking-tight text-white">
            {time.h !== '00' ? `${time.h}:` : ''}{time.m}:{time.s}
          </span>
          <span className="text-[9px] text-white/50 font-semibold">TIME LEFT</span>
        </div>
        <div className="flex gap-1.5 ml-2">
          {state === 'running' ? (
            <button onClick={pause} className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/70 hover:text-white text-xs transition-colors">||</button>
          ) : state !== 'done' ? (
            <button onClick={start} className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-xs transition-colors">&gt;</button>
          ) : null}
          <button onClick={reset} className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/70 hover:text-white text-xs transition-colors">R</button>
        </div>
        {scale !== 1 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
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
          <span className="font-mono text-sm text-muted-foreground">.{time.ms}</span>
          <span className="text-[8px] font-bold tracking-[2px] text-muted-foreground mt-1">APPARENT TIME</span>
        </div>
      </div>

      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${statusClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${state === 'running' ? 'animate-pulse-dot' : ''}`} />
        {statusLabel}
      </span>

      <div className="flex gap-2">
        <button onClick={reset} className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground text-lg transition-colors">R</button>
        {state === 'running' ? (
          <button onClick={pause} className="flex-1 h-12 px-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide">PAUSE</button>
        ) : state === 'done' ? (
          <button onClick={reset} className="flex-1 h-12 px-8 rounded-lg bg-muted text-muted-foreground font-bold text-sm tracking-wide">RESTART</button>
        ) : (
          <button onClick={start} className="flex-1 h-12 px-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide">START</button>
        )}
      </div>

      {scale !== 1 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted text-xs">
          <span className="text-muted-foreground">Apparent: {Math.round(config.apparentSeconds / 60)}m</span>
          <span className="text-primary font-bold">x{scale.toFixed(2)}</span>
          <span className="text-muted-foreground">Actual: {Math.round(config.actualSeconds / 60)}m</span>
        </div>
      )}
    </div>
  );
}
