export type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-for-review' | 'answered-marked-for-review';
export type QuestionType = 'Single Correct' | 'Multi Correct' | 'Numerical' | 'Unknown';

export interface DetectedQuestion {
  id: string;
  label: string;
  number: number;
  page: number;
  yRatio: number;
  questionType?: QuestionType;
}

export interface DetectedSection {
  id: string;
  subject: string;
  sectionNumber: number;
  sectionLabel: string;
  questionType?: QuestionType;
  questions: DetectedQuestion[];
}

export interface TimerConfig {
  apparentSeconds: number;
  actualSeconds: number;
}

export interface QuestionAnswer {
  options: string[];
  numerical: string;
}

export interface TestSession {
  id: string;
  name: string;
  sections: DetectedSection[];
  answers: Record<string, QuestionAnswer>;
  markedForReview: Record<string, boolean>;
  visited: Record<string, boolean>;
  timerConfig: TimerConfig;
  startedAt: number;
  completedAt?: number;
  timeTakenSeconds?: number;
  paperMeta?: { year?: number; paper?: number; source?: 'default' | 'custom'; subjectOrder?: string };
}
