import { pdfjs } from 'react-pdf';
import { DetectedSection, QuestionType } from './types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
export { pdfjs };

interface PageTextItem {
  str: string;
  y: number;
  height: number;
}

interface PageText {
  pageIndex: number;
  text: string;
  items: PageTextItem[];
  pageHeight: number;
}

async function extractAllPageTexts(file: File): Promise<PageText[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: PageText[] = [];
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const items: PageTextItem[] = textContent.items.map((item: any) => ({ str: item.str, y: item.transform?.[5] ?? 0, height: item.height || 10 }));
    pages.push({ pageIndex: i, text: items.map(i => i.str).join(' '), items, pageHeight: viewport.height });
  }
  return pages;
}

function detectSubject(text: string, fallback: string): string {
  const t = text.toLowerCase();
  if (/(subject|section)\s*[:\-]?\s*physics|\bphysics\b/.test(t)) return 'Physics';
  if (/(subject|section)\s*[:\-]?\s*chemistry|\bchemistry\b/.test(t)) return 'Chemistry';
  if (/(subject|section)\s*[:\-]?\s*(mathematics|maths|math)|\bmathematics\b|\bmaths\b/.test(t)) return 'Mathematics';
  return fallback;
}

function detectQuestionType(text: string): QuestionType {
  const t = text.toLowerCase();
  if (/one\s+or\s+more\s+than\s+one\s+option|multiple\s+correct|more than one correct/.test(t)) return 'Multi Correct';
  if (/numerical|integer\s+type|answer\s+is\s+an?\s+integer/.test(t)) return 'Numerical';
  if (/single\s+correct|only\s+one\s+correct/.test(t)) return 'Single Correct';
  return 'Unknown';
}

function extractQuestionNumbers(raw: string): number[] {
  const out = new Set<number>();
  const patterns = [/\bQ\.?\s*(\d{1,3})\b/gi, /\bQuestion\s*(\d{1,3})\b/gi, /(?:^|\s)(\d{1,3})\s*[\).](?=\s)/g];
  for (const pattern of patterns) {
    for (const m of raw.matchAll(pattern)) {
      const n = Number(m[1]);
      if (n > 0 && n <= 200) out.add(n);
    }
  }
  return Array.from(out).sort((a, b) => a - b);
}

function findY(items: PageTextItem[], pageHeight: number, qNum: number): number {
  const patt = new RegExp(`^\\s*(Q\\.?\\s*${qNum}|${qNum}[\\).])\\b`, 'i');
  const hit = items.find(i => patt.test(i.str));
  if (!hit) return 0;
  return Math.max(0, Math.min(1, 1 - hit.y / pageHeight));
}

export async function parsePdfSections(file: File): Promise<DetectedSection[]> {
  const pages = await extractAllPageTexts(file);
  const sections: DetectedSection[] = [];
  let subject = 'Physics';
  let secNo = 1;
  let current: DetectedSection | null = null;

  const ensureSection = (nextSubject: string, nextSecNo: number, type: QuestionType) => {
    const id = `${nextSubject.toLowerCase()}-s${nextSecNo}-${sections.length}`;
    const exists = [...sections].reverse().find(s => s.subject === nextSubject && s.sectionNumber === nextSecNo);
    if (exists && exists.questions.length === 0) return exists;
    const created: DetectedSection = {
      id,
      subject: nextSubject,
      sectionNumber: nextSecNo,
      sectionLabel: `${nextSubject} - Section ${nextSecNo}`,
      questionType: type === 'Unknown' ? undefined : type,
      questions: [],
    };
    sections.push(created);
    return created;
  };

  for (const page of pages) {
    subject = detectSubject(page.text, subject);
    const type = detectQuestionType(page.text);

    const secMatches = [...page.text.matchAll(/SECTION\s*(\d+)/gi)];
    if (secMatches.length > 0) {
      secNo = Number(secMatches[secMatches.length - 1][1]);
      current = ensureSection(subject, secNo, type);
    }

    if (!current) current = ensureSection(subject, secNo, type);
    if (!current.questionType && type !== 'Unknown') current.questionType = type;

    const qNums = extractQuestionNumbers(page.text);
    for (const q of qNums) {
      if (!current.questions.some(x => x.number === q)) {
        current.questions.push({
          id: `${current.id}-q${q}`,
          label: `Q.${q}`,
          number: q,
          page: page.pageIndex,
          yRatio: findY(page.items, page.pageHeight, q),
          questionType: current.questionType,
        });
      }
    }

    if (qNums.length === 1 && /section\s*\d+/i.test(page.text)) {
      current = null;
    }
  }

  return sections
    .map(s => ({ ...s, questions: s.questions.sort((a, b) => a.number - b.number) }))
    .filter(s => s.questions.length > 0);
}
