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
}

export default function TestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageState = location.state as TestPageState | undefined;

  const sections = pageState?.sections ?? [];
  const timerConfig = pageState?.timerConfig ?? { apparentSeconds: 3600, actualSeconds: 3600 };
  const testName = pageState?.testName ?? 'Test';
  const file = pageState?.file;

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

  const questionMap = useMemo(() => {
    const map: Record<string, { page: number; sectionId: string }> = {};
    for (const s of sections) {
      for (const q of s.questions) {
        map[q.id] = { page: q.page, sectionId: s.id };
      }
    }
    return map;
  }, [sections]);

  const activeSection = useMemo(
    () => sections.find(s => s.id === activeSectionId) ?? sections[0],
    [sections, activeSectionId]
  );

  const activeQuestion = useMemo(
    () => activeSection?.questions.find(q => q.id === activeQuestionId) ?? activeSection?.questions[0],
    [activeSection, activeQuestionId]
  );

  const activeQuestionIndex = useMemo(
    () => activeSection?.questions.findIndex(q => q.id === activeQuestionId) ?? 0,
    [activeSection, activeQuestionId]
  );

  const markVisited = useCallback((qId: string) => {
    setVisited(prev => {
      if (prev[qId]) return prev;
      return { ...prev, [qId]: true };
    });
  }, []);

  const navigateToQuestion = useCallback((qId: string) => {
    const info = questionMap[qId];
    if (!info) return;
    setActiveSectionId(info.sectionId);
    setActiveQuestionId(qId);
    markVisited(qId);
    setScrollToQuestionId(qId);
    setTimeout(() => setScrollToQuestionId(undefined), 200);
  }, [questionMap, markVisited]);

  const handleAnswerChange = useCallback((qId: string, answer: QuestionAnswer) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  }, []);

  const handleClearResponse = useCallback(() => {
    if (!activeQuestionId) return;
    setAnswers(prev => {
      const next = { ...prev };
      delete next[activeQuestionId];
      return next;
    });
  }, [activeQuestionId]);

  const handleSaveAndNext = useCallback(() => {
    if (!activeQuestion) return;
    const questions = activeSection.questions;
    const idx = questions.findIndex(q => q.id === activeQuestionId);
    if (idx < questions.length - 1) {
      navigateToQuestion(questions[idx + 1].id);
    } else {
      const sectionIdx = sections.findIndex(s => s.id === activeSectionId);
      if (sectionIdx < sections.length - 1) {
        const nextSection = sections[sectionIdx + 1];
        navigateToQuestion(nextSection.questions[0]?.id);
      }
    }
  }, [activeQuestion, activeSection, sections, activeSectionId, activeQuestionId, navigateToQuestion]);

  const handleMarkForReviewAndNext = useCallback(() => {
    if (!activeQuestionId) return;
    setMarkedForReview(prev => ({ ...prev, [activeQuestionId]: true }));
    handleSaveAndNext();
  }, [activeQuestionId, handleSaveAndNext]);

  const handlePrev = useCallback(() => {
    if (!activeQuestion) return;
    const questions = activeSection.questions;
    const idx = questions.findIndex(q => q.id === activeQuestionId);
    if (idx > 0) {
      navigateToQuestion(questions[idx - 1].id);
    } else {
      const sectionIdx = sections.findIndex(s => s.id === activeSectionId);
      if (sectionIdx > 0) {
        const prevSection = sections[sectionIdx - 1];
        navigateToQuestion(prevSection.questions[prevSection.questions.length - 1]?.id);
      }
    }
  }, [activeQuestion, activeSection, sections, activeSectionId, activeQuestionId, navigateToQuestion]);

  const handleNext = useCallback(() => {
    if (!activeQuestion) return;
    const questions = activeSection.questions;
    const idx = questions.findIndex(q => q.id === activeQuestionId);
    if (idx < questions.length - 1) {
      navigateToQuestion(questions[idx + 1].id);
    } else {
      const sectionIdx = sections.findIndex(s => s.id === activeSectionId);
      if (sectionIdx < sections.length - 1) {
        const nextSection = sections[sectionIdx + 1];
        navigateToQuestion(nextSection.questions[0]?.id);
      }
    }
  }, [activeQuestion, activeSection, sections, activeSectionId, activeQuestionId, navigateToQuestion]);

  const handlePaletteClick = useCallback((qId: string) => {
    navigateToQuestion(qId);
    setMobileTab('question');
  }, [navigateToQuestion]);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.values(answers).filter(a => a.options.length > 0 || a.numerical.trim()).length;

  const handleSubmit = useCallback(() => {
    const session: TestSession = {
      id: testId,
      name: testName,
      sections,
      answers,
      markedForReview,
      visited,
      timerConfig,
      startedAt,
      completedAt: Date.now(),
      timeTakenSeconds: Math.round((Date.now() - startedAt) / 1000),
    };
    saveTest(session);
    navigate('/');
  }, [testId, testName, sections, answers, markedForReview, visited, timerConfig, startedAt, navigate]);

  if (!pageState || !file) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4 bg-white">
        <p className="text-muted-foreground">No test loaded.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-bold text-sm">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white" style={{ overflow: 'hidden' }}>
      {/* Top header bar - JEE Navy */}
      <header className="flex items-center justify-between px-4 py-2 bg-jee-navy text-white" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 text-sm transition-colors">
            &larr;
          </button>
          <div>
            <h1 className="text-sm font-bold truncate max-w-[200px] md:max-w-none">{testName}</h1>
            <p className="text-[10px] text-white/60">{answeredCount}/{totalQuestions} answered</p>
          </div>
        </div>
        <FasterTimer config={timerConfig} compact onTimeUp={handleSubmit} />
        <button onClick={handleSubmit} className="px-4 py-1.5 rounded-md bg-jee-red text-white text-xs font-bold hover:bg-jee-red/90 transition-colors" style={{ flexShrink: 0 }}>
          Submit Test
        </button>
      </header>

      {/* Section navigation tabs */}
      <div className="flex items-center bg-jee-navy-light text-white" style={{ flexShrink: 0 }}>
        {sections.map(section => {
          const isActive = section.id === activeSectionId;
          const sectionAnswered = section.questions.filter(q => {
            const a = answers[q.id];
            return a && (a.options.length > 0 || a.numerical.trim());
          }).length;
          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveSectionId(section.id);
                if (!section.questions.find(q => q.id === activeQuestionId)) {
                  navigateToQuestion(section.questions[0]?.id);
                }
              }}
              className={`flex-1 py-2.5 text-xs font-bold tracking-wide text-center transition-all relative
                ${isActive
                  ? 'bg-white text-foreground'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {section.subject} - Section {section.sectionNumber}
              <span className={`ml-1.5 text-[10px] ${isActive ? 'text-primary' : 'text-white/40'}`}>
                ({sectionAnswered}/{section.questions.length})
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-border bg-white" style={{ flexShrink: 0 }}>
        <button
          onClick={() => setMobileTab('paper')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide text-center transition-colors ${mobileTab === 'paper' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
        >
          Paper
        </button>
        <button
          onClick={() => setMobileTab('question')}
          className={`flex-1 py-2 text-xs font-bold tracking-wide text-center transition-colors ${mobileTab === 'question' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
        >
          Question
        </button>
      </div>

      {/* Main content area - uses calc to fill remaining height exactly */}
      <div className="flex" style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
        {/* PDF Viewer - left side */}
        <div className={`${mobileTab === 'paper' ? 'flex' : 'hidden'} md:flex flex-col min-w-0 border-r border-border`} style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
          <PdfViewer file={file} sections={sections} scrollToQuestionId={scrollToQuestionId} />
        </div>

        {/* Question view - center */}
        <div className={`${mobileTab === 'question' ? 'flex' : 'hidden'} md:flex flex-col min-w-0 border-r border-border`} style={{ width: '400px', flexShrink: 0, minHeight: 0, overflow: 'hidden' }}>
          {activeQuestion && activeSection && (
            <QuestionView
              section={activeSection}
              question={activeQuestion}
              questionIndex={activeQuestionIndex}
              totalInSection={activeSection.questions.length}
              answer={answers[activeQuestion.id] ?? { options: [], numerical: '' }}
              onAnswerChange={handleAnswerChange}
              onClearResponse={handleClearResponse}
              onSaveAndNext={handleSaveAndNext}
              onMarkForReviewAndNext={handleMarkForReviewAndNext}
              onPrev={handlePrev}
              onNext={handleNext}
              isFirst={activeQuestionIndex === 0 && sections.findIndex(s => s.id === activeSectionId) === 0}
              isLast={activeQuestionIndex === activeSection.questions.length - 1 && sections.findIndex(s => s.id === activeSectionId) === sections.length - 1}
            />
          )}
        </div>

        {/* Question Palette - right side */}
        <div className={`hidden md:flex flex-col transition-all duration-200`} style={{ width: paletteCollapsed ? 0 : 220, flexShrink: 0, minHeight: 0, overflow: paletteCollapsed ? 'hidden' : 'auto' }}>
          <QuestionPalette
            sections={sections}
            answers={answers}
            markedForReview={markedForReview}
            visited={visited}
            activeQuestionId={activeQuestionId}
            onQuestionClick={handlePaletteClick}
          />
        </div>

        {/* Palette toggle button */}
        <button
          onClick={() => setPaletteCollapsed(!paletteCollapsed)}
          className="hidden md:flex items-center justify-center w-5 bg-jee-gray2 hover:bg-border text-muted-foreground hover:text-foreground text-xs border-l border-border transition-colors"
          style={{ flexShrink: 0 }}
          title={paletteCollapsed ? 'Show palette' : 'Hide palette'}
        >
          {paletteCollapsed ? '\u203A' : '\u2039'}
        </button>
      </div>
    </div>
  );
}
