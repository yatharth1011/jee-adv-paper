import { DetectedQuestion, DetectedSection, QuestionAnswer } from '@/lib/types';

interface QuestionViewProps {
  section: DetectedSection;
  question: DetectedQuestion;
  questionIndex: number;
  totalInSection: number;
  answer: QuestionAnswer;
  onAnswerChange: (qId: string, answer: QuestionAnswer) => void;
  onClearResponse: () => void;
  onSaveAndNext: () => void;
  onMarkForReviewAndNext: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

export default function QuestionView({
  section, question, questionIndex, totalInSection,
  answer, onAnswerChange, onClearResponse, onSaveAndNext,
  onMarkForReviewAndNext, onPrev, onNext, isFirst, isLast
}: QuestionViewProps) {
  const toggleOption = (opt: string) => {
    const current = answer.options;
    const next = current.includes(opt)
      ? current.filter(o => o !== opt)
      : [...current, opt].sort();
    onAnswerChange(question.id, { ...answer, options: next });
  };

  const handleNumericalChange = (val: string) => {
    onAnswerChange(question.id, { ...answer, numerical: val });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Question header */}
      <div className="px-5 py-3 border-b border-border bg-jee-gray flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-foreground">
              Question No. {question.number}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ({questionIndex + 1} of {totalInSection})
            </span>
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {section.sectionLabel}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          View the question in the PDF panel. Enter your answer below.
        </div>
      </div>

      {/* Answer area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-5">
          <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
            Select Option(s)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {OPTIONS.map(opt => {
              const isSelected = answer.options.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md border-2 transition-all text-left
                    ${isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-white text-foreground hover:border-primary/40'
                    }
                  `}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all
                    ${isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white'
                    }
                  `}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-bold">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border mb-5" />

        <div>
          <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
            Numerical / Integer Answer
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={answer.numerical}
            onChange={e => handleNumericalChange(e.target.value)}
            placeholder="Enter numerical value (e.g. 3.14, -2, 42)"
            className="w-full h-11 px-4 rounded-md border-2 border-border focus:border-primary bg-white text-foreground text-sm outline-none font-mono transition-colors placeholder:text-muted-foreground/50"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Leave empty if the question requires option selection only.
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-5 py-3 border-t border-border bg-jee-gray flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={isFirst}
              className="px-4 py-2 rounded-md text-sm font-semibold border border-border bg-white text-foreground hover:bg-jee-gray2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              &lt; Prev
            </button>
            <button
              onClick={onNext}
              disabled={isLast}
              className="px-4 py-2 rounded-md text-sm font-semibold border border-border bg-white text-foreground hover:bg-jee-gray2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next &gt;
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearResponse}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-jee-red text-white hover:bg-jee-red/90 transition-colors"
            >
              Clear Response
            </button>
            <button
              onClick={onSaveAndNext}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-jee-green text-white hover:bg-jee-green/90 transition-colors"
            >
              Save &amp; Next
            </button>
            <button
              onClick={onMarkForReviewAndNext}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-jee-purple text-white hover:bg-jee-purple/90 transition-colors"
            >
              Mark for Review &amp; Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
