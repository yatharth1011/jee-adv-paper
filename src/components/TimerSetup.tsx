import { useState, useEffect } from 'react';
import { TimerConfig } from '@/lib/types';

interface TimerSetupProps {
  onChange: (config: TimerConfig) => void;
  initial?: TimerConfig;
}

export default function TimerSetup({ onChange, initial }: TimerSetupProps) {
  const defaultApp = initial ? initial.apparentSeconds : 3 * 3600;
  const defaultAct = initial ? initial.actualSeconds : 3 * 3600;

  const [apH, setApH] = useState(Math.floor(defaultApp / 3600));
  const [apM, setApM] = useState(Math.floor((defaultApp % 3600) / 60));
  const [apS, setApS] = useState(defaultApp % 60);
  const [acH, setAcH] = useState(Math.floor(defaultAct / 3600));
  const [acM, setAcM] = useState(Math.floor((defaultAct % 3600) / 60));
  const [acS, setAcS] = useState(defaultAct % 60);

  const apparent = apH * 3600 + apM * 60 + apS;
  const actual = acH * 3600 + acM * 60 + acS;
  const scale = actual > 0 ? (apparent / actual).toFixed(2) : '--';

  useEffect(() => {
    if (apparent > 0 && actual > 0) {
      onChange({ apparentSeconds: apparent, actualSeconds: actual });
    }
  }, [apparent, actual, onChange]);

  const InputBox = ({ value, onChange: onValChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number"
        min={0}
        max={label === 'HRS' ? 23 : 59}
        value={value}
        onChange={(e) => onValChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-16 h-12 rounded-md border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-center text-xl font-mono font-bold text-foreground outline-none transition-all"
      />
      <span className="text-[8px] font-bold tracking-widest text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-md p-5 border border-border">
      <h3 className="text-lg font-extrabold mb-1">Timer Configuration</h3>
      <p className="text-xs text-muted-foreground mb-5">Set what the timer shows vs. how long it actually runs</p>

      <div className="mb-4">
        <label className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
          Apparent Duration - displayed countdown
        </label>
        <div className="flex items-end gap-1">
          <InputBox value={apH} onChange={setApH} label="HRS" />
          <span className="text-xl font-mono font-bold text-muted-foreground pb-5">:</span>
          <InputBox value={apM} onChange={setApM} label="MIN" />
          <span className="text-xl font-mono font-bold text-muted-foreground pb-5">:</span>
          <InputBox value={apS} onChange={setApS} label="SEC" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
          Actual Duration - real elapsed time
        </label>
        <div className="flex items-end gap-1">
          <InputBox value={acH} onChange={setAcH} label="HRS" />
          <span className="text-xl font-mono font-bold text-muted-foreground pb-5">:</span>
          <InputBox value={acM} onChange={setAcM} label="MIN" />
          <span className="text-xl font-mono font-bold text-muted-foreground pb-5">:</span>
          <InputBox value={acS} onChange={setAcS} label="SEC" />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-primary/5 border border-primary/20">
        <span className="text-xs text-muted-foreground">Time Scale Factor</span>
        <span className="font-mono text-sm font-bold text-primary">x{scale}</span>
      </div>
    </div>
  );
}
