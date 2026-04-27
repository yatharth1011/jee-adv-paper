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
  const qType = question.questionType ?? section.questionType ?? 'Unknown';

  const toggleOption = (opt: string) => {
    const current = answer.options;
    const singleMode = qType === 'Single Correct';
    const next = singleMode
      ? (current.includes(opt) ? [] : [opt])
      : (current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt].sort());
    onAnswerChange(question.id, { ...answer, options: next, numerical: '' });
  };

  const handleNumericalChange = (val: string) => {
    onAnswerChange(question.id, { ...answer, numerical: val, options: [] });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 py-3 border-b border-border bg-jee-gray flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-foreground">Question No. {question.number}</span>
            <span className="text-xs text-muted-foreground ml-2">({questionIndex + 1} of {totalInSection})</span>
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{section.sectionLabel}</div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Detected type: <b>{qType}</b></div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {qType !== 'Numerical' && (
          <div className="mb-5">
            <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">Select Option{qType === 'Multi Correct' ? '(s)' : ''}</div>
            <div className="grid grid-cols-2 gap-2">
              {OPTIONS.map(opt => {
                const isSelected = answer.options.includes(opt);
                return (
                  <button key={opt} onClick={() => toggleOption(opt)} className={`flex items-center gap-3 px-4 py-3 rounded-md border-2 ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-foreground'}`}>
                    <span className="text-sm font-bold">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {qType !== 'Single Correct' && qType !== 'Multi Correct' && (
          <div>
            <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">Numerical / Integer Answer</div>
            <input type="text" inputMode="decimal" value={answer.numerical} onChange={e => handleNumericalChange(e.target.value)} placeholder="Enter numerical value" className="w-full h-11 px-4 rounded-md border-2 border-border focus:border-primary" />
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-border bg-jee-gray flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={onPrev} disabled={isFirst} className="px-4 py-2 rounded-md text-sm font-semibold border border-border bg-white disabled:opacity-40">&lt; Prev</button>
            <button onClick={onNext} disabled={isLast} className="px-4 py-2 rounded-md text-sm font-semibold border border-border bg-white disabled:opacity-40">Next &gt;</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClearResponse} className="px-4 py-2 rounded-md text-sm font-semibold bg-jee-red text-white">Clear Response</button>
            <button onClick={onSaveAndNext} className="px-4 py-2 rounded-md text-sm font-semibold bg-jee-green text-white">Save &amp; Next</button>
            <button onClick={onMarkForReviewAndNext} className="px-4 py-2 rounded-md text-sm font-semibold bg-jee-purple text-white">Mark for Review &amp; Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
