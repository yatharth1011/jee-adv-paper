import { useRef, useEffect } from 'react';
import { DetectedSection } from '@/lib/types';

interface AnswerPanelProps {
  sections: DetectedSection[];
  answers: Record<string, string>;
  activeQuestionId?: string;
  onAnswerChange: (questionId: string, value: string) => void;
  onQuestionFocus: (questionId: string) => void;
  scrollToQuestionId?: string;
}

export default function AnswerPanel({
  sections, answers, activeQuestionId,
  onAnswerChange, onQuestionFocus, scrollToQuestionId
}: AnswerPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToQuestionId) return;
    const el = document.getElementById(`answer-${scrollToQuestionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input');
      input?.focus();
    }
  }, [scrollToQuestionId]);

  return (
    <div ref={containerRef} className="flex flex-col gap-4 overflow-y-auto scrollbar-thin flex-1 pr-1">
      {sections.map((section) => (
        <div key={section.id}>
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm py-2 mb-2">
            <h3 className="text-[10px] font-bold tracking-widest text-text3 uppercase">
              {section.sectionLabel}
            </h3>
            <div className="h-px bg-border mt-1.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            {section.questions.map((q) => {
              const value = answers[q.id] || '';
              const isActive = q.id === activeQuestionId;
              return (
                <div
                  key={q.id}
                  id={`answer-${q.id}`}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150
                    ${isActive ? 'bg-primary-dim ring-1 ring-primary/30' : 'hover:bg-surf'}
                  `}
                >
                  <span className={`w-8 text-center text-[11px] font-bold rounded-md py-0.5
                    ${value.trim() ? 'text-success bg-success/15' : 'text-destructive bg-destructive/15'}
                  `}>
                    {q.number}
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                    onFocus={() => onQuestionFocus(q.id)}
                    placeholder="Answer..."
                    className="flex-1 bg-surf2 border border-transparent focus:border-primary rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-text3 outline-none transition-colors font-mono"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
