import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfViewer from '@/components/PdfViewer';
import QuestionPalette from '@/components/QuestionPalette';
import QuestionView from '@/components/QuestionView';
import FasterTimer from '@/components/FasterTimer';
import { DetectedSection, TimerConfig, TestSession, QuestionAnswer } from '@/lib/types';
import { saveTest, generateId } from '@/lib/storage';

interface TestPageState {
  file: File;
  sections: DetectedSection[];
  timerConfig: TimerConfig;
  testName: string;
  paperMeta?: TestSession['paperMeta'];
}

export default function TestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageState = location.state as TestPageState | undefined;
  const sections = pageState?.sections ?? [];
  const timerConfig = pageState?.timerConfig ?? { apparentSeconds: 3600, actualSeconds: 3600 };
  const testName = pageState?.testName ?? 'Test';
  const file = pageState?.file;
  const paperMeta = pageState?.paperMeta;

  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [activeSectionId, setActiveSectionId] = useState<string>(() => sections[0]?.id ?? '');
  const [activeQuestionId, setActiveQuestionId] = useState<string>(() => sections[0]?.questions[0]?.id ?? '');
  const [scrollToQuestionId, setScrollToQuestionId] = useState<string>();
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<'paper' | 'question'>('question');
  const [testId] = useState(() => generateId());
  const [startedAt] = useState(() => Date.now());

  const questionMap = useMemo(() => Object.fromEntries(sections.flatMap(s => s.questions.map(q => [q.id, { page: q.page, sectionId: s.id }] as const))), [sections]);
  const activeSection = useMemo(() => sections.find(s => s.id === activeSectionId) ?? sections[0], [sections, activeSectionId]);
  const activeQuestion = useMemo(() => activeSection?.questions.find(q => q.id === activeQuestionId) ?? activeSection?.questions[0], [activeSection, activeQuestionId]);
  const activeQuestionIndex = useMemo(() => activeSection?.questions.findIndex(q => q.id === activeQuestionId) ?? 0, [activeSection, activeQuestionId]);

  const markVisited = useCallback((qId: string) => setVisited(prev => prev[qId] ? prev : ({ ...prev, [qId]: true })), []);
  const navigateToQuestion = useCallback((qId: string) => {
    const info = questionMap[qId]; if (!info) return;
    setActiveSectionId(info.sectionId); setActiveQuestionId(qId); markVisited(qId); setScrollToQuestionId(qId); setTimeout(() => setScrollToQuestionId(undefined), 200);
  }, [questionMap, markVisited]);

  const handleAnswerChange = useCallback((qId: string, answer: QuestionAnswer) => setAnswers(prev => ({ ...prev, [qId]: answer })), []);
  const handleClearResponse = useCallback(() => { if (!activeQuestionId) return; setAnswers(prev => { const next = { ...prev }; delete next[activeQuestionId]; return next; }); }, [activeQuestionId]);

  const goByOffset = useCallback((offset: number) => {
    if (!activeQuestion) return;
    const all = sections.flatMap(s => s.questions);
    const idx = all.findIndex(q => q.id === activeQuestion.id);
    const next = all[idx + offset];
    if (next) navigateToQuestion(next.id);
  }, [activeQuestion, sections, navigateToQuestion]);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.values(answers).filter(a => a.options.length > 0 || a.numerical.trim()).length;

  const handleSubmit = useCallback(async () => {
    const session: TestSession = { id: testId, name: testName, sections, answers, markedForReview, visited, timerConfig, startedAt, completedAt: Date.now(), timeTakenSeconds: Math.round((Date.now() - startedAt) / 1000), paperMeta };
    await saveTest(session);
    navigate('/');
  }, [testId, testName, sections, answers, markedForReview, visited, timerConfig, startedAt, paperMeta, navigate]);

  if (!pageState || !file) return <div className="h-screen flex items-center justify-center"><button onClick={() => navigate('/')}>Go Home</button></div>;

  return (<div className="h-screen flex flex-col bg-white" style={{ overflow: 'hidden' }}>
      <header className="flex items-center justify-between px-4 py-2 bg-jee-navy text-white" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-3"><button onClick={() => navigate('/')}>&larr;</button><div><h1 className="text-sm font-bold">{testName}</h1><p className="text-[10px]">{answeredCount}/{totalQuestions} answered</p></div></div>
        <FasterTimer config={timerConfig} compact onTimeUp={handleSubmit} />
        <button onClick={handleSubmit} className="px-4 py-1.5 rounded-md bg-jee-red text-white text-xs font-bold">Submit Test</button>
      </header>
      <div className="flex items-center bg-jee-navy-light text-white" style={{ flexShrink: 0 }}>{sections.map(section => <button key={section.id} onClick={() => { setActiveSectionId(section.id); navigateToQuestion(section.questions[0]?.id); }} className={`flex-1 py-2.5 text-xs ${section.id === activeSectionId ? 'bg-white text-foreground' : ''}`}>{section.subject} - Section {section.sectionNumber}</button>)}</div>
      <div className="md:hidden flex border-b" style={{ flexShrink: 0 }}><button onClick={() => setMobileTab('paper')} className="flex-1">Paper</button><button onClick={() => setMobileTab('question')} className="flex-1">Question</button></div>
      <div className="flex" style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
        <div className={`${mobileTab === 'paper' ? 'flex' : 'hidden'} md:flex flex-col min-w-0 border-r`} style={{ flex: '1 1 0%' }}><PdfViewer file={file} sections={sections} scrollToQuestionId={scrollToQuestionId} /></div>
        <div className={`${mobileTab === 'question' ? 'flex' : 'hidden'} md:flex flex-col min-w-0 border-r`} style={{ width: '400px', flexShrink: 0 }}>
          {activeQuestion && activeSection && <QuestionView section={activeSection} question={activeQuestion} questionIndex={activeQuestionIndex} totalInSection={activeSection.questions.length} answer={answers[activeQuestion.id] ?? { options: [], numerical: '' }} onAnswerChange={handleAnswerChange} onClearResponse={handleClearResponse} onSaveAndNext={() => goByOffset(1)} onMarkForReviewAndNext={() => { setMarkedForReview(prev => ({ ...prev, [activeQuestion.id]: true })); goByOffset(1); }} onPrev={() => goByOffset(-1)} onNext={() => goByOffset(1)} isFirst={sections.flatMap(s => s.questions)[0]?.id === activeQuestion.id} isLast={sections.flatMap(s => s.questions).at(-1)?.id === activeQuestion.id} />}
        </div>
        <div className={`hidden md:flex flex-col`} style={{ width: paletteCollapsed ? 0 : 220, flexShrink: 0 }}><QuestionPalette sections={sections} answers={answers} markedForReview={markedForReview} visited={visited} activeQuestionId={activeQuestionId} onQuestionClick={(qId) => { navigateToQuestion(qId); setMobileTab('question'); }} /></div>
        <button onClick={() => setPaletteCollapsed(!paletteCollapsed)} className="hidden md:flex">{paletteCollapsed ? '›' : '‹'}</button>
      </div>
    </div>);
}
