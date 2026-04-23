export type QuestionType = 'Single Correct' | 'Multi Correct' | 'Numerical' | 'Bonus';

export interface AnswerKeyEntry {
  year: number;
  paper: number;
  subject: string;
  questionNumber: number;
  questionType: QuestionType;
  answer: string;
}

export interface MarkingScheme {
  year: number;
  paper: number;
  singleCorrect: { correct: number; unanswered: number; incorrect: number };
  multiCorrect: { all: number; three: number; two: number; one: number; unanswered: number; incorrect: number };
  numerical: { correct: number; unanswered: number; incorrect: number };
}

export const ANSWER_KEYS: AnswerKeyEntry[] = [
  // 2021 Paper 1 - Physics
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 1, questionType: 'Single Correct', answer: 'C'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 2, questionType: 'Single Correct', answer: 'C'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 3, questionType: 'Single Correct', answer: 'B'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 4, questionType: 'Single Correct', answer: 'D'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 5, questionType: 'Numerical', answer: '0.50'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 6, questionType: 'Numerical', answer: '7.50'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 7, questionType: 'Numerical', answer: '1.33'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 8, questionType: 'Numerical', answer: '0.67'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 9, questionType: 'Numerical', answer: '1.73'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 10, questionType: 'Numerical', answer: '3.00'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 11, questionType: 'Multi Correct', answer: 'B D'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 12, questionType: 'Multi Correct', answer: 'B C D'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 13, questionType: 'Multi Correct', answer: 'A B C'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 14, questionType: 'Multi Correct', answer: 'A D'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 16, questionType: 'Multi Correct', answer: 'A C'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 17, questionType: 'Multi Correct', answer: 'A C'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 18, questionType: 'Numerical', answer: '4'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 19, questionType: 'Numerical', answer: '49'},
  {year: 2021, paper: 1, subject: 'Physics', questionNumber: 20, questionType: 'Numerical', answer: '9'},
  // 2021 Paper 1 - Chemistry (abbreviated for space - add full list as needed)
  {year: 2021, paper: 1, subject: 'Chemistry', questionNumber: 1, questionType: 'Single Correct', answer: 'B'},
  {year: 2021, paper: 1, subject: 'Chemistry', questionNumber: 2, questionType: 'Single Correct', answer: 'B'},
  // 2021 Paper 1 - Mathematics (abbreviated)
  {year: 2021, paper: 1, subject: 'Mathematics', questionNumber: 1, questionType: 'Single Correct', answer: 'B'},
  {year: 2021, paper: 1, subject: 'Mathematics', questionNumber: 2, questionType: 'Single Correct', answer: 'A'},
  // Add all other entries similarly...
  {year: 2025, paper: 1, subject: 'Mathematics', questionNumber: 1, questionType: 'Single Correct', answer: 'C'},
  {year: 2025, paper: 1, subject: 'Physics', questionNumber: 1, questionType: 'Single Correct', answer: 'A'},
];

export const MARKING_SCHEMES: MarkingScheme[] = [
  {year: 2021, paper: 1, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
  {year: 2021, paper: 2, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
  {year: 2022, paper: 1, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 3, unanswered: 0, incorrect: 0}},
  {year: 2022, paper: 2, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 3, unanswered: 0, incorrect: 0}},
  {year: 2023, paper: 1, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
  {year: 2023, paper: 2, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
  {year: 2024, paper: 1, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
  {year: 2024, paper: 2, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
  {year: 2025, paper: 1, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
  {year: 2025, paper: 2, singleCorrect: {correct: 3, unanswered: 0, incorrect: -1}, multiCorrect: {all: 4, three: 3, two: 2, one: 1, unanswered: 0, incorrect: -2}, numerical: {correct: 4, unanswered: 0, incorrect: 0}},
];

export function getAnswerKey(year: number, paper: number, subject: string, questionNumber: number): AnswerKeyEntry | undefined {
  return ANSWER_KEYS.find(k =>
    k.year === year &&
    k.paper === paper &&
    k.subject === subject &&
    k.questionNumber === questionNumber
  );
}

export function getMarkingScheme(year: number, paper: number): MarkingScheme | undefined {
  return MARKING_SCHEMES.find(m => m.year === year && m.paper === paper);
}

export function calculateScore(userAnswer: string[], questionType: QuestionType, correctAnswer: string, marking: MarkingScheme): number {
  if (!userAnswer || userAnswer.length === 0) {
    return 0;
  }

  if (questionType === 'Single Correct') {
    const correct = userAnswer[0] === correctAnswer;
    return correct ? marking.singleCorrect.correct : marking.singleCorrect.incorrect;
  }

  if (questionType === 'Multi Correct') {
    const userSet = new Set(userAnswer);
    const correctSet = new Set(correctAnswer.split(' '));

    if (userSet.size === correctSet.size && Array.from(userSet).every(u => correctSet.has(u))) {
      return marking.multiCorrect.all;
    }

    let correctCount = 0;
    for (const u of userSet) {
      if (correctSet.has(u)) correctCount++;
    }

    if (correctCount === 3 && correctSet.size === 4) return marking.multiCorrect.three;
    if (correctCount === 2) return marking.multiCorrect.two;
    if (correctCount === 1) return marking.multiCorrect.one;

    return marking.multiCorrect.incorrect;
  }

  if (questionType === 'Numerical') {
    const userNum = parseFloat(userAnswer[0]);
    const correctStr = correctAnswer.split('-')[0];
    const rangeEnd = correctAnswer.split('-')[1];
    const correctNum = parseFloat(correctStr);
    const rangeEndNum = rangeEnd ? parseFloat(rangeEnd) : correctNum;

    if (userNum >= correctNum && userNum <= rangeEndNum) {
      return marking.numerical.correct;
    }
    return marking.numerical.incorrect;
  }

  return 0;
}
