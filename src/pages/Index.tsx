import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parsePdfSections } from '@/lib/pdfParser';
import { getSavedTests, deleteTest } from '@/lib/storage';
import { DetectedSection, TimerConfig, TestSession } from '@/lib/types';
import TimerSetup from '@/components/TimerSetup';

export default function Index() {
  const navigate = useNavigate();
  const [savedTests, setSavedTests] = useState<TestSession[]>(() => getSavedTests());
  const [step, setStep] = useState<'home' | 'setup'>('home');
  const [file, setFile] = useState<File | null>(null);
  const [sections, setSections] = useState<DetectedSection[]>([]);
  const [testName, setTestName] = useState('');
  const [timerConfig, setTimerConfig] = useState<TimerConfig>({ apparentSeconds: 10800, actualSeconds: 10800 });
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setTestName(f.name.replace(/\.pdf$/i, ''));
    setParsing(true);
    setError('');
    try {
      const detected = await parsePdfSections(f);
      if (detected.length === 0) {
        setError('Could not detect any questions (Q.1, Q.2...) in this PDF. Make sure it follows the expected format.');
        setParsing(false);
        return;
      }
      setSections(detected);
      setStep('setup');
    } catch (err) {
      setError('Failed to parse PDF: ' + (err as Error).message);
    }
    setParsing(false);
  }, []);

  const handleStart = () => {
    if (!file || sections.length === 0) return;
    navigate('/test', {
      state: { file, sections, timerConfig, testName },
    });
  };

  const handleDelete = (id: string) => {
    deleteTest(id);
    setSavedTests(getSavedTests());
  };

  const totalQ = (s: DetectedSection[]) => s.reduce((sum, sec) => sum + sec.questions.length, 0);

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-4 py-8">
          <button onClick={() => setStep('home')} className="text-text2 hover:text-foreground text-sm mb-6 flex items-center gap-1">
            ← Back
          </button>

          <h1 className="text-2xl font-extrabold mb-1">Test Setup</h1>
          <p className="text-sm text-text2 mb-6">Configure your test before starting</p>

          {/* Test name */}
          <div className="mb-5">
            <label className="text-[9px] font-bold tracking-widest text-text3 uppercase mb-2 block">Test Name</label>
            <input
              type="text"
              value={testName}
              onChange={e => setTestName(e.target.value)}
              className="w-full h-11 rounded-xl bg-surf2 border-2 border-transparent focus:border-primary px-3 text-foreground outline-none font-medium"
            />
          </div>

          {/* Detected sections */}
          <div className="mb-5">
            <label className="text-[9px] font-bold tracking-widest text-text3 uppercase mb-2 block">
              Detected Sections ({sections.length})
            </label>
            <div className="space-y-1.5">
              {sections.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surf">
                  <span className="text-sm font-semibold truncate">{s.sectionLabel}</span>
                  <span className="text-xs text-text2 font-mono">{s.questions.length} Q</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text2 mt-2">
              Total: {totalQ(sections)} questions
            </p>
          </div>

          {/* Timer */}
          <div className="mb-6">
            <TimerSetup initial={timerConfig} onApply={setTimerConfig} />
          </div>

          <button
            onClick={handleStart}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-extrabold text-base tracking-wide glow-primary hover:brightness-110 active:scale-[0.98] transition-all"
          >
            ▶ Start Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 42%, hsla(33, 78%, 60%, 0.05) 0%, transparent 70%)'
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-xl glow-primary">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Exam<span className="text-primary">Sim</span>
            </h1>
            <p className="text-[10px] text-text2 tracking-wide">PDF Question Paper Simulator</p>
          </div>
        </div>

        {/* Upload */}
        <div className="mb-8">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-2xl py-10 cursor-pointer transition-colors group">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</span>
            <span className="text-sm font-bold text-foreground">
              {parsing ? 'Parsing PDF...' : 'Upload Question Paper'}
            </span>
            <span className="text-xs text-text2 mt-1">PDF format • JEE/NEET style supported</span>
          </label>
          {error && <p className="text-destructive text-xs mt-2">{error}</p>}
        </div>

        {/* Past tests */}
        <div>
          <h2 className="text-sm font-bold text-text2 tracking-widest uppercase mb-4">Past Tests</h2>
          {savedTests.length === 0 ? (
            <div className="text-center py-12 text-text3 text-sm">
              No tests yet. Upload a paper to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {savedTests.map(test => {
                const total = totalQ(test.sections);
                const answered = Object.values(test.answers).filter(v => v.trim()).length;
                const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
                const timeTaken = test.timeTakenSeconds
                  ? `${Math.floor(test.timeTakenSeconds / 60)}m ${test.timeTakenSeconds % 60}s`
                  : '—';
                return (
                  <div key={test.id} className="bg-surf rounded-2xl p-4 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-extrabold">{test.name}</h3>
                        <p className="text-[10px] text-text2">
                          {test.completedAt ? new Date(test.completedAt).toLocaleDateString() : '—'} • {timeTaken}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(test.id)} className="text-text3 hover:text-destructive text-sm">✕</button>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-2 rounded-full bg-surf2 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">{pct}%</span>
                    </div>

                    <div className="text-xs text-text2 mb-2">
                      {answered}/{total} answered
                    </div>

                    {/* Section breakdown */}
                    <div className="flex flex-wrap gap-1.5">
                      {test.sections.map(s => {
                        const sAnswered = s.questions.filter(q => test.answers[q.id]?.trim()).length;
                        return (
                          <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-md bg-surf2 text-text2">
                            {s.sectionLabel}: {sAnswered}/{s.questions.length}
                          </span>
                        );
                      })}
                    </div>

                    {/* Show answers collapsible */}
                    <details className="mt-3">
                      <summary className="text-[10px] text-text3 cursor-pointer hover:text-text2">
                        View Answers
                      </summary>
                      <div className="mt-2 space-y-2">
                        {test.sections.map(s => (
                          <div key={s.id}>
                            <p className="text-[9px] font-bold tracking-widest text-text3 uppercase mb-1">{s.sectionLabel}</p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                              {s.questions.map(q => (
                                <div key={q.id} className={`text-[10px] px-1.5 py-1 rounded text-center font-mono
                                  ${test.answers[q.id]?.trim() ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'}
                                `}>
                                  {q.number}: {test.answers[q.id] || '—'}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
