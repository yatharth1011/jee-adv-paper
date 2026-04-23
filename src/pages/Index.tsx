import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parsePdfSections } from '@/lib/pdfParser';
import { getSavedTests, deleteTest } from '@/lib/storage';
import { DetectedSection, TimerConfig, TestSession, QuestionAnswer } from '@/lib/types';
import { DEFAULT_PAPERS, fetchPaperAsFile, DefaultPaper } from '@/lib/defaultPapers';
import TimerSetup from '@/components/TimerSetup';

function formatAnswer(ans: QuestionAnswer | undefined): string {
  if (!ans) return '';
  const parts: string[] = [];
  if (ans.options.length > 0) parts.push(ans.options.join(''));
  if (ans.numerical.trim()) parts.push(ans.numerical);
  return parts.join(', ');
}

function hasAnswer(ans: QuestionAnswer | undefined): boolean {
  return !!ans && (ans.options.length > 0 || ans.numerical.trim() !== '');
}

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

  const processFile = useCallback(async (f: File, displayName?: string) => {
    setFile(f);
    setTestName((displayName ?? f.name).replace(/\.pdf$/i, ''));
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

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await processFile(f);
  }, [processFile]);

  const handleDefaultPaper = useCallback(async (p: DefaultPaper) => {
    setError('');
    setParsing(true);
    try {
      const f = await fetchPaperAsFile(p);
      await processFile(f, p.name);
    } catch (err) {
      setError((err as Error).message);
      setParsing(false);
    }
  }, [processFile]);

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
      <div className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-4 py-8">
          <button onClick={() => setStep('home')} className="text-muted-foreground hover:text-foreground text-sm mb-6 flex items-center gap-1 transition-colors">
            &larr; Back
          </button>

          <h1 className="text-2xl font-extrabold mb-1 text-foreground">Test Setup</h1>
          <p className="text-sm text-muted-foreground mb-6">Configure your test before starting</p>

          <div className="mb-5">
            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">Test Name</label>
            <input
              type="text"
              value={testName}
              onChange={e => setTestName(e.target.value)}
              className="w-full h-11 rounded-md border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 px-3 text-foreground outline-none font-medium transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
              Detected Sections ({sections.length})
            </label>
            <div className="space-y-1.5">
              {sections.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-jee-gray border border-border">
                  <span className="text-sm font-semibold truncate">{s.sectionLabel}</span>
                  <span className="text-xs text-muted-foreground font-mono">{s.questions.length} Q</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total: {totalQ(sections)} questions
            </p>
          </div>

          <div className="mb-6">
            <TimerSetup initial={timerConfig} onApply={setTimerConfig} />
          </div>

          <button
            onClick={handleStart}
            className="w-full h-14 rounded-md bg-primary text-primary-foreground font-extrabold text-base tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jee-gray">
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-md bg-jee-navy flex items-center justify-center text-white text-lg font-extrabold">
            E
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Exam<span className="text-primary">Sim</span>
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-wide">JEE Advanced CBT Simulator</p>
          </div>
        </div>

        {/* Upload */}
        <div className="mb-8">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-md py-10 cursor-pointer transition-colors group bg-white">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            <svg className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-bold text-foreground">
              {parsing ? 'Parsing PDF...' : 'Upload Question Paper'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">PDF format - JEE/NEET style supported</span>
          </label>
          {error && <p className="text-destructive text-xs mt-2">{error}</p>}
        </div>

        {/* Default Papers */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-4">JEE Advanced Papers</h2>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_PAPERS.map(p => (
              <button
                key={p.url}
                onClick={() => handleDefaultPaper(p)}
                disabled={parsing}
                className="text-left bg-white hover:bg-jee-gray disabled:opacity-50 border border-border hover:border-primary/40 rounded-md px-3 py-2.5 transition-all group"
              >
                <div className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold">{p.year}</div>
                <div className="text-sm font-extrabold group-hover:text-primary transition-colors">Paper {p.paper}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Past tests */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-4">Past Tests</h2>
          {savedTests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm bg-white rounded-md border border-border">
              No tests yet. Upload a paper to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {savedTests.map(test => {
                const total = totalQ(test.sections);
                const answered = Object.values(test.answers).filter(a => hasAnswer(a)).length;
                const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
                const timeTaken = test.timeTakenSeconds
                  ? `${Math.floor(test.timeTakenSeconds / 60)}m ${test.timeTakenSeconds % 60}s`
                  : '--';
                return (
                  <div key={test.id} className="bg-white rounded-md p-4 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-extrabold">{test.name}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {test.completedAt ? new Date(test.completedAt).toLocaleDateString() : '--'} - {timeTaken}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(test.id)} className="text-muted-foreground hover:text-destructive text-sm transition-colors">x</button>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-2 rounded-full bg-jee-gray overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">{pct}%</span>
                    </div>

                    <div className="text-xs text-muted-foreground mb-2">
                      {answered}/{total} answered
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {test.sections.map(s => {
                        const sAnswered = s.questions.filter(q => hasAnswer(test.answers[q.id])).length;
                        return (
                          <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-md bg-jee-gray text-muted-foreground">
                            {s.sectionLabel}: {sAnswered}/{s.questions.length}
                          </span>
                        );
                      })}
                    </div>

                    <details className="mt-3">
                      <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        View Answers
                      </summary>
                      <div className="mt-2 space-y-2">
                        {test.sections.map(s => (
                          <div key={s.id}>
                            <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-1">{s.sectionLabel}</p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                              {s.questions.map(q => {
                                const ans = formatAnswer(test.answers[q.id]);
                                return (
                                  <div key={q.id} className={`text-[10px] px-1.5 py-1 rounded text-center font-mono
                                    ${hasAnswer(test.answers[q.id]) ? 'bg-jee-green/10 text-jee-green' : 'bg-jee-red/10 text-jee-red'}
                                  `}>
                                    {q.number}: {ans || '--'}
                                  </div>
                                );
                              })}
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
