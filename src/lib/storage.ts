import { TestSession } from './types';

const TESTS_KEY = 'examSimulator_tests';

export function getSavedTests(): TestSession[] {
  try {
    const data = localStorage.getItem(TESTS_KEY);
    return data ? JSON.parse(data) : [];
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
