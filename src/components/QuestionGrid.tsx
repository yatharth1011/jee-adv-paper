import { DetectedSection } from '@/lib/types';

interface QuestionGridProps {
  sections: DetectedSection[];
  answers: Record<string, string>;
  activeQuestionId?: string;
  onQuestionClick: (questionId: string) => void;
}

export default function QuestionGrid({ sections, answers, activeQuestionId, onQuestionClick }: QuestionGridProps) {
  return (
    <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1">
      {sections.map((section) => (
        <div key={section.id}>
          <div className="text-[9px] font-bold tracking-widest text-text3 uppercase mb-1.5 truncate" title={section.sectionLabel}>
            {section.sectionLabel}
          </div>
          <div className="flex flex-wrap gap-1">
            {section.questions.map((q) => {
              const answered = !!(answers[q.id] && answers[q.id].trim());
              const isActive = q.id === activeQuestionId;
              return (
                <button
                  key={q.id}
                  onClick={() => onQuestionClick(q.id)}
                  title={q.label}
                  className={`w-8 h-8 rounded-md text-[11px] font-bold transition-all duration-150 flex items-center justify-center
                    ${isActive ? 'ring-2 ring-primary scale-110' : ''}
                    ${answered 
                      ? 'bg-success/20 text-success border border-success/30' 
                      : 'bg-destructive/15 text-destructive border border-destructive/25'
                    }
                  `}
                >
                  {q.number}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
