export type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-for-review' | 'answered-marked-for-review';

export interface DetectedQuestion {
  id: string;
  label: string;
  number: number;
  page: number;
  yRatio: number; // 0-1 ratio of vertical position on the page
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
}
