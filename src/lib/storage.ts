import { TestSession, QuestionAnswer } from './types';
import { getAuthSession, getUserData, putUserData } from './serverApi';

function migrateOldAnswers(data: any): TestSession[] {
  if (!Array.isArray(data)) return [];
  return data.map((test: any) => {
    if (test.answers && typeof Object.values(test.answers)[0] === 'string') {
      const newAnswers: Record<string, QuestionAnswer> = {};
      for (const [k, v] of Object.entries(test.answers as Record<string, string>)) {
        if ((v || '').trim()) {
          if (/^[A-D]+$/.test(v)) newAnswers[k] = { options: v.split(''), numerical: '' };
          else newAnswers[k] = { options: [], numerical: v };
        } else newAnswers[k] = { options: [], numerical: '' };
      }
      test.answers = newAnswers;
    }
    if (!test.markedForReview) test.markedForReview = {};
    if (!test.visited) test.visited = {};
    if (test.sections) {
      for (const s of test.sections) {
        if (s.questions) {
          for (const q of s.questions) {
            if (q.yRatio === undefined) q.yRatio = 0;
          }
        }
      }
    }
    return test;
  });
}

export async function getSavedTests(): Promise<TestSession[]> {
  const session = getAuthSession();
  if (!session) return [];
  const data = await getUserData(session.token);
  return migrateOldAnswers(data.tests);
}

export async function saveTest(test: TestSession): Promise<void> {
  const session = getAuthSession();
  if (!session) return;
  const data = await getUserData(session.token);
  const tests = migrateOldAnswers(data.tests);
  const idx = tests.findIndex(t => t.id === test.id);
  if (idx >= 0) tests[idx] = test;
  else tests.unshift(test);
  await putUserData(session.token, { ...data, tests });
}

export async function deleteTest(id: string): Promise<void> {
  const session = getAuthSession();
  if (!session) return;
  const data = await getUserData(session.token);
  const tests = migrateOldAnswers(data.tests).filter(t => t.id !== id);
  await putUserData(session.token, { ...data, tests });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
