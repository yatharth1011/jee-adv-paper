import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfViewer from '@/components/PdfViewer';
import AnswerPanel from '@/components/AnswerPanel';
import QuestionGrid from '@/components/QuestionGrid';
import FasterTimer from '@/components/FasterTimer';
import { DetectedSection, TimerConfig, TestSession } from '@/lib/types';
import { saveTest, generateId } from '@/lib/storage';

interface TestPageState {
  file: File;
  sections: DetectedSection[];
  timerConfig: TimerConfig;
  testName: string;
}

export default function TestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageState = location.state as TestPageState | undefined;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string>();
  const [scrollToPage, setScrollToPage] = useState<number>();
  const [scrollToQuestionId, setScrollToQuestionId] = useState<string>();
  const [mobileTab, setMobileTab] = useState<'paper' | 'answers'>('answers');
  const [testId] = useState(() => generateId());
  const [startedAt] = useState(() => Date.now());

  if (!pageState) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-text2">No test loaded.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          Go Home
        </button>
      </div>
    );
  }

  const { file, sections, timerConfig, testName } = pageState;

  const questionMap = useMemo(() => {
    const map: Record<string, { page: number }> = {};
    for (const s of sections) {
      for (const q of s.questions) {
        map[q.id] = { page: q.page };
      }
    }
    return map;
  }, [sections]);

  const handleAnswerChange = useCallback((qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const handleQuestionFocus = useCallback((qId: string) => {
    setActiveQuestionId(qId);
    const info = questionMap[qId];
    if (info) {
      setScrollToPage(info.page);
      // Reset after a tick so the same page can be scrolled to again
      setTimeout(() => setScrollToPage(undefined), 100);
    }
  }, [questionMap]);

  const handleGridClick = useCallback((qId: string) => {
    setActiveQuestionId(qId);
    const info = questionMap[qId];
    if (info) {
      setScrollToPage(info.page);
      setTimeout(() => setScrollToPage(undefined), 100);
    }
    setScrollToQuestionId(qId);
    setTimeout(() => setScrollToQuestionId(undefined), 100);
    setMobileTab('answers');
  }, [questionMap]);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.values(answers).filter(v => v.trim()).length;

  const handleSubmit = () => {
    const session: TestSession = {
      id: testId,
      name: testName,
      sections,
      answers,
      timerConfig,
      startedAt,
      completedAt: Date.now(),
      timeTakenSeconds: Math.round((Date.now() - startedAt) / 1000),
    };
    saveTest(session);
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 bg-surf border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-surf2 flex items-center justify-center text-text2 hover:text-foreground text-sm">←</button>
          <div>
            <h1 className="text-sm font-extrabold truncate max-w-[150px] md:max-w-none">{testName}</h1>
            <p className="text-[10px] text-text2">{answeredCount}/{totalQuestions} answered</p>
          </div>
        </div>
        <FasterTimer config={timerConfig} compact onTimeUp={handleSubmit} />
        <button onClick={handleSubmit} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold ml-2 flex-shrink-0">
          Submit
        </button>
      </header>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-border flex-shrink-0">
        <button
          onClick={() => setMobileTab('paper')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide text-center transition-colors ${mobileTab === 'paper' ? 'text-primary border-b-2 border-primary' : 'text-text2'}`}
        >
          📄 Paper
        </button>
        <button
          onClick={() => setMobileTab('answers')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide text-center transition-colors ${mobileTab === 'answers' ? 'text-primary border-b-2 border-primary' : 'text-text2'}`}
        >
          ✏️ Answers
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className={`${mobileTab === 'paper' ? 'flex' : 'hidden'} md:flex md:flex-1 flex-col min-w-0 flex-1`}>
          <PdfViewer file={file} scrollToPage={scrollToPage} />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border flex-shrink-0" />

        {/* Right panel */}
        <div className={`${mobileTab === 'answers' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[380px] lg:w-[420px] flex-shrink-0 p-3 gap-3 overflow-hidden`}>
          <QuestionGrid
            sections={sections}
            answers={answers}
            activeQuestionId={activeQuestionId}
            onQuestionClick={handleGridClick}
          />
          <div className="h-px bg-border flex-shrink-0" />
          <AnswerPanel
            sections={sections}
            answers={answers}
            activeQuestionId={activeQuestionId}
            onAnswerChange={handleAnswerChange}
            onQuestionFocus={handleQuestionFocus}
            scrollToQuestionId={scrollToQuestionId}
          />
        </div>
      </div>
    </div>
  );
}
