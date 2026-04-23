import { DetectedSection, QuestionStatus, QuestionAnswer } from '@/lib/types';

interface QuestionPaletteProps {
  sections: DetectedSection[];
  answers: Record<string, QuestionAnswer>;
  markedForReview: Record<string, boolean>;
  visited: Record<string, boolean>;
  activeQuestionId: string;
  onQuestionClick: (questionId: string) => void;
}

function getQuestionStatus(
  qId: string,
  answers: Record<string, QuestionAnswer>,
  markedForReview: Record<string, boolean>,
  visited: Record<string, boolean>,
): QuestionStatus {
  const isMarked = !!markedForReview[qId];
  const answer = answers[qId];
  const hasAnswer = answer && (answer.options.length > 0 || answer.numerical.trim() !== '');
  const isVisited = !!visited[qId];

  if (hasAnswer && isMarked) return 'answered-marked-for-review';
  if (isMarked) return 'marked-for-review';
  if (hasAnswer) return 'answered';
  if (isVisited) return 'not-answered';
  return 'not-visited';
}

const statusColors: Record<QuestionStatus, string> = {
  'not-visited': 'bg-jee-gray-dot text-white',
  'not-answered': 'bg-jee-red text-white',
  'answered': 'bg-jee-green text-white',
  'marked-for-review': 'bg-jee-purple text-white',
  'answered-marked-for-review': 'bg-jee-purple text-white ring-2 ring-jee-green ring-offset-1',
};

const statusLabels: Record<QuestionStatus, string> = {
  'not-visited': 'Not Visited',
  'not-answered': 'Not Answered',
  'answered': 'Answered',
  'marked-for-review': 'Marked for Review',
  'answered-marked-for-review': 'Answered & Marked for Review',
};

export default function QuestionPalette({
  sections, answers, markedForReview, visited, activeQuestionId, onQuestionClick
}: QuestionPaletteProps) {
  const allQuestions = sections.flatMap(s => s.questions);
  const statusCounts = {
    'not-visited': 0,
    'not-answered': 0,
    'answered': 0,
    'marked-for-review': 0,
    'answered-marked-for-review': 0,
  } as Record<QuestionStatus, number>;

  for (const q of allQuestions) {
    const s = getQuestionStatus(q.id, answers, markedForReview, visited);
    statusCounts[s]++;
  }

  return (
    <div className="flex flex-col h-full bg-jee-gray">
      {/* Legend */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <div className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider mb-2">Legend</div>
        <div className="grid grid-cols-1 gap-1.5">
          {(Object.keys(statusLabels) as QuestionStatus[]).map(status => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-sm flex-shrink-0 ${statusColors[status]}`} />
              <span className="text-[11px] text-foreground/70">{statusLabels[status]} ({statusCounts[status]})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section-wise question buttons */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {sections.map(section => (
          <div key={section.id} className="mb-4">
            <div className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-2 truncate" title={section.sectionLabel}>
              {section.sectionLabel}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {section.questions.map(q => {
                const status = getQuestionStatus(q.id, answers, markedForReview, visited);
                const isActive = q.id === activeQuestionId;
                return (
                  <button
                    key={q.id}
                    onClick={() => onQuestionClick(q.id)}
                    title={`${q.label} - ${statusLabels[status]}`}
                    className={`w-9 h-9 rounded-md text-xs font-bold transition-all duration-100 flex items-center justify-center
                      ${statusColors[status]}
                      ${isActive ? 'ring-2 ring-primary ring-offset-1 scale-110 z-10' : 'hover:scale-105'}
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
    </div>
  );
}
