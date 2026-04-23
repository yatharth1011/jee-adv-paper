export type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-for-review' | 'answered-marked-for-review';

export interface DetectedQuestion {
  id: string;
  label: string;
  number: number;
  page: number;
}

export interface DetectedSection {
  id: string;
  subject: string;
  sectionNumber: number;
  sectionLabel: string;
  questions: DetectedQuestion[];
}

export interface TimerConfig {
  apparentSeconds: number;
  actualSeconds: number;
}

export interface QuestionAnswer {
  options: string[]; // e.g. ['A', 'C'] for multiple correct
  numerical: string; // e.g. "3.14" or "42"
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
}
