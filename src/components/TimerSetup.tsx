import { useState } from 'react';
import { TimerConfig } from '@/lib/types';

interface TimerSetupProps {
  onApply: (config: TimerConfig) => void;
  initial?: TimerConfig;
}

export default function TimerSetup({ onApply, initial }: TimerSetupProps) {
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
  const scale = actual > 0 ? (apparent / actual).toFixed(2) : '—';

  const handleApply = () => {
    if (apparent > 0 && actual > 0) {
      onApply({ apparentSeconds: apparent, actualSeconds: actual });
    }
  };

  const InputBox = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number"
        min={0}
        max={label === 'HRS' ? 23 : 59}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-16 h-12 rounded-xl bg-surf2 border-2 border-transparent focus:border-primary text-center text-xl font-mono font-bold text-foreground outline-none"
      />
      <span className="text-[8px] font-bold tracking-widest text-text3">{label}</span>
    </div>
  );

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-extrabold mb-1">Configure Timer</h3>
      <p className="text-xs text-text2 mb-5">Set what the timer shows vs. how long it actually runs</p>

      <div className="mb-4">
        <label className="text-[9px] font-bold tracking-widest text-text3 uppercase mb-2 block">
          Apparent Duration — displayed countdown
        </label>
        <div className="flex items-end gap-1">
          <InputBox value={apH} onChange={setApH} label="HRS" />
          <span className="text-xl font-mono font-bold text-text3 pb-5">:</span>
          <InputBox value={apM} onChange={setApM} label="MIN" />
          <span className="text-xl font-mono font-bold text-text3 pb-5">:</span>
          <InputBox value={apS} onChange={setApS} label="SEC" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[9px] font-bold tracking-widest text-text3 uppercase mb-2 block">
          Actual Duration — real elapsed time
        </label>
        <div className="flex items-end gap-1">
          <InputBox value={acH} onChange={setAcH} label="HRS" />
          <span className="text-xl font-mono font-bold text-text3 pb-5">:</span>
          <InputBox value={acM} onChange={setAcM} label="MIN" />
          <span className="text-xl font-mono font-bold text-text3 pb-5">:</span>
          <InputBox value={acS} onChange={setAcS} label="SEC" />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary-dim border border-primary/20 mb-4">
        <span className="text-xs text-text2">Time Scale Factor</span>
        <span className="font-mono text-sm font-bold text-primary">×{scale}</span>
      </div>

      <button
        onClick={handleApply}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide glow-primary hover:brightness-110 active:scale-[0.98] transition-all"
      >
        Apply Timer
      </button>
    </div>
  );
}
