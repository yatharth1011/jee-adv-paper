export interface DetectedQuestion {
  id: string;
  label: string;
  number: number;
  page: number; // 0-indexed
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

export interface TestSession {
  id: string;
  name: string;
  sections: DetectedSection[];
  answers: Record<string, string>; // questionId -> answer
  timerConfig: TimerConfig;
  startedAt: number;
  completedAt?: number;
  timeTakenSeconds?: number;
}
