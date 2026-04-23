import { TestSession, QuestionAnswer } from './types';

const TESTS_KEY = 'examSimulator_tests';

function migrateOldAnswers(data: any): TestSession[] {
  if (!Array.isArray(data)) return [];
  return data.map((test: any) => {
    if (test.answers && typeof Object.values(test.answers)[0] === 'string') {
      const newAnswers: Record<string, QuestionAnswer> = {};
      for (const [k, v] of Object.entries(test.answers as Record<string, string>)) {
        if (v.trim()) {
          if (/^[A-D]+$/.test(v)) {
            newAnswers[k] = { options: v.split(''), numerical: '' };
          } else {
            newAnswers[k] = { options: [], numerical: v };
          }
        } else {
          newAnswers[k] = { options: [], numerical: '' };
        }
      }
      test.answers = newAnswers;
    }
    if (!test.markedForReview) test.markedForReview = {};
    if (!test.visited) test.visited = {};
    return test;
  });
}

export function getSavedTests(): TestSession[] {
  try {
    const data = localStorage.getItem(TESTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return migrateOldAnswers(parsed);
  } catch {
    return [];
  }
}

export function saveTest(test: TestSession): void {
  const tests = getSavedTests();
  const idx = tests.findIndex(t => t.id === test.id);
  if (idx >= 0) {
    tests[idx] = test;
  } else {
    tests.unshift(test);
  }
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
}

export function deleteTest(id: string): void {
  const tests = getSavedTests().filter(t => t.id !== id);
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
