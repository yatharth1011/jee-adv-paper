import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parsePdfSections } from '@/lib/pdfParser';
import { getSavedTests, deleteTest } from '@/lib/storage';
import { DetectedSection, TimerConfig, TestSession, QuestionAnswer } from '@/lib/types';
import { DEFAULT_PAPERS, fetchPaperAsFile, DefaultPaper } from '@/lib/defaultPapers';
import { getAgendaForDate } from '@/lib/timetable';
import TimerSetup from '@/components/TimerSetup';
import { getAnswerKey, getMarkingScheme, calculateScore } from '@/lib/answerKeys';

const SUBJECT_ORDERS = ['PCM', 'PMC', 'MPC', 'MCP', 'CPM', 'CMP'] as const;

function hasAnswer(ans: QuestionAnswer | undefined): boolean { return !!ans && (ans.options.length > 0 || ans.numerical.trim() !== ''); }

export default function Index() {
  const navigate = useNavigate();
  const [savedTests, setSavedTests] = useState<TestSession[]>([]);
  const [step, setStep] = useState<'home' | 'setup'>('home');
  const [file, setFile] = useState<File | null>(null);
  const [sections, setSections] = useState<DetectedSection[]>([]);
  const [testName, setTestName] = useState('');
  const [timerConfig, setTimerConfig] = useState<TimerConfig>({ apparentSeconds: 10800, actualSeconds: 10800 });
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [paperMeta, setPaperMeta] = useState<TestSession['paperMeta']>({ source: 'custom' });
  const [subjectOrder, setSubjectOrder] = useState<(typeof SUBJECT_ORDERS)[number]>('PCM');

  useEffect(() => { getSavedTests().then(setSavedTests); }, []);

  const processFile = useCallback(async (f: File, displayName?: string, defaultPaper?: DefaultPaper) => {
    setFile(f); setTestName((displayName ?? f.name).replace(/\.pdf$/i, '')); setParsing(true); setError('');
    try {
      const detected = await parsePdfSections(f);
      if (detected.length === 0) { setError('Could not detect any questions.'); setParsing(false); return; }
      setSections(detected);
      setPaperMeta(defaultPaper ? { source: 'default', year: defaultPaper.year, paper: defaultPaper.paper, subjectOrder } : { source: 'custom', subjectOrder });
      setStep('setup');
    } catch (err) { setError('Failed to parse PDF: ' + (err as Error).message); }
    setParsing(false);
  }, [subjectOrder]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; await processFile(f); }, [processFile]);
  const handleDefaultPaper = useCallback(async (p: DefaultPaper) => { setError(''); setParsing(true); try { const f = await fetchPaperAsFile(p); await processFile(f, p.name, p); } catch (err) { setError((err as Error).message); setParsing(false); } }, [processFile]);

  const handleStart = () => {
    if (!file || sections.length === 0) return;
    navigate('/test', { state: { file, sections, timerConfig, testName, paperMeta: { ...paperMeta, subjectOrder } } });
  };

  const handleDelete = async (id: string) => { await deleteTest(id); setSavedTests(await getSavedTests()); };
  const totalQ = (s: DetectedSection[]) => s.reduce((sum, sec) => sum + sec.questions.length, 0);
  const agenda = getAgendaForDate(new Date());

  const scoreTest = (test: TestSession) => {
    if (!test.paperMeta?.year || !test.paperMeta.paper) return null;
    const marking = getMarkingScheme(test.paperMeta.year, test.paperMeta.paper); if (!marking) return null;
    let score = 0;
    const rows: Array<{ q: string; user: string; key: string; delta: number }> = [];
    for (const s of test.sections) {
      for (const q of s.questions) {
        const key = getAnswerKey(test.paperMeta.year, test.paperMeta.paper, s.subject, q.number);
        if (!key) continue;
        const ans = test.answers[q.id];
        const userParts = ans?.options.length ? ans.options : ans?.numerical ? [ans.numerical] : [];
        const delta = calculateScore(userParts, key.questionType as any, key.answer, marking);
        score += delta;
        rows.push({ q: `${s.subject} Q${q.number}`, user: userParts.join(' ') || '—', key: key.answer, delta });
      }
    }
    return { score, rows };
  };

  if (step === 'setup') return <div className="min-h-screen bg-white"><div className="max-w-xl mx-auto px-4 py-8"><button onClick={() => setStep('home')}>&larr; Back</button><h1 className="text-2xl font-extrabold">Test Setup</h1><input type="text" value={testName} onChange={e => setTestName(e.target.value)} className="w-full border rounded px-3 py-2 my-3" />
    <div className="mb-3 text-sm">Conflict-breaker question paper order</div><select value={subjectOrder} onChange={e => setSubjectOrder(e.target.value as any)} className="w-full border rounded px-3 py-2 mb-3">{SUBJECT_ORDERS.map(o => <option key={o}>{o}</option>)}</select>
    <div className="space-y-1.5">{sections.map(s => <div key={s.id} className="flex justify-between border rounded p-2"><span>{s.sectionLabel} ({s.questionType ?? 'Unknown'})</span><span>{s.questions.length} Q</span></div>)}</div><TimerSetup initial={timerConfig} onChange={setTimerConfig} /><button onClick={handleStart} className="w-full h-12 bg-primary text-primary-foreground rounded">Start Test</button></div></div>;

  return (<div className="min-h-screen bg-jee-gray"><div className="max-w-3xl mx-auto px-4 py-8">
    <div className="bg-white border rounded-md p-4 mb-6"><h2 className="text-lg font-extrabold">Hi! Ready for today?</h2><p className="text-sm text-muted-foreground">Today&apos;s agenda: <b>{agenda?.preferred ?? 'Free Practice'}</b>. You can still choose any paper or upload custom PDF.</p></div>
    <div className="mb-8"><label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md py-10 cursor-pointer bg-white"><input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" /><span>{parsing ? 'Parsing PDF...' : 'Upload Question Paper'}</span></label>{error && <p className="text-destructive text-xs mt-2">{error}</p>}</div>
    <div className="mb-8"><h2 className="text-sm font-bold mb-3">JEE Advanced Papers</h2><div className="grid grid-cols-2 gap-2">{DEFAULT_PAPERS.map(p => <button key={p.url} onClick={() => handleDefaultPaper(p)} disabled={parsing} className="text-left bg-white border rounded px-3 py-2"><div className="text-[10px]">{p.year}</div><div className="text-sm font-extrabold">Paper {p.paper}</div></button>)}</div></div>
    <div><h2 className="text-sm font-bold mb-3">Past Tests</h2>{savedTests.length === 0 ? <div className="text-center py-8 bg-white rounded border">No tests yet.</div> : <div className="space-y-3">{savedTests.map(test => { const total = totalQ(test.sections); const answered = Object.values(test.answers).filter(a => hasAnswer(a)).length; const evalRes = scoreTest(test); return <div key={test.id} className="bg-white rounded p-4 border"><div className="flex justify-between"><h3 className="font-bold">{test.name}</h3><button onClick={() => handleDelete(test.id)}>x</button></div><div className="text-xs text-muted-foreground">{answered}/{total} answered</div>{evalRes && <details className="mt-2"><summary className="text-xs cursor-pointer">Evaluate with FIITJEE key</summary><p className="text-sm font-bold mt-2">Score: {evalRes.score}</p><div className="max-h-40 overflow-auto text-xs"><table className="w-full"><thead><tr><th className="text-left">Question</th><th>User</th><th>Key</th><th>Marks</th></tr></thead><tbody>{evalRes.rows.slice(0, 60).map((r, i) => <tr key={i}><td>{r.q}</td><td>{r.user}</td><td>{r.key}</td><td>{r.delta}</td></tr>)}</tbody></table></div></details>}</div>; })}</div>}</div>
  </div></div>);
}
