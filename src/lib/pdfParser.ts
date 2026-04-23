import { pdfjs } from 'react-pdf';
import { DetectedSection, DetectedQuestion } from './types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export { pdfjs };

interface PageTextItem {
  str: string;
  transform: number[];
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
    const items: PageTextItem[] = textContent.items.map((item: any) => ({
      str: item.str,
      transform: item.transform,
      y: item.transform ? item.transform[5] : 0,
      height: item.height || 10,
    }));
    const text = items.map(item => item.str).join(' ');
    pages.push({
      pageIndex: i,
      text,
      items,
      pageHeight: viewport.height,
    });
  }

  return pages;
}

function findQuestionYRatio(items: PageTextItem[], pageHeight: number, qNum: number): number {
  for (const item of items) {
    const match = item.str.match(/^Q\.(\d+)/);
    if (match && parseInt(match[1]) === qNum) {
      const ratio = 1 - (item.y / pageHeight);
      return Math.max(0, Math.min(1, ratio));
    }
  }
  return 0;
}

function detectSubject(pageText: string, currentSubject: string): string {
  const physicsKeywords = ['physics', 'kinematics', 'mechanics', 'thermodynamics', 'electromagnetism', 'optics', 'waves', 'motion', 'force', 'energy', 'momentum', 'pressure', 'velocity', 'acceleration'];
  const chemistryKeywords = ['chemistry', 'chemical', 'molecule', 'atom', 'reaction', 'bond', 'acid', 'base', 'solution', 'oxidation', 'reduction', 'equilibrium', 'mole', 'atomic', 'compound', 'organic', 'inorganic'];
  const mathsKeywords = ['mathematics', 'math', 'calculus', 'algebra', 'geometry', 'trigonometry', 'vectors', 'matrix', 'function', 'equation', 'integral', 'derivative', 'polynomial', 'sequence', 'series', 'probability'];

  const lowerText = pageText.toLowerCase();
  const physicsScore = physicsKeywords.filter(k => lowerText.includes(k)).length;
  const chemistryScore = chemistryKeywords.filter(k => lowerText.includes(k)).length;
  const mathsScore = mathsKeywords.filter(k => lowerText.includes(k)).length;

  if (physicsScore > chemistryScore && physicsScore > mathsScore && physicsScore > 0) return 'Physics';
  if (chemistryScore > physicsScore && chemistryScore > mathsScore && chemistryScore > 0) return 'Chemistry';
  if (mathsScore > physicsScore && mathsScore > chemistryScore && mathsScore > 0) return 'Mathematics';

  return currentSubject;
}

export async function parsePdfSections(file: File): Promise<DetectedSection[]> {
  const pages = await extractAllPageTexts(file);
  const sections: DetectedSection[] = [];
  let currentSubject = 'Physics';
  let currentSection: DetectedSection | null = null;
  let globalSectionIdx = 0;

  for (const { pageIndex, text, items, pageHeight } of pages) {
    const detectedSubject = detectSubject(text, currentSubject);
    if (detectedSubject !== currentSubject) {
      currentSubject = detectedSubject;
      currentSection = null;
    }

    const sectionMatches = [...text.matchAll(/SECTION\s+(\d+)/gi)];
    for (const sm of sectionMatches) {
      const sectionNum = parseInt(sm[1]);
      const sectionId = `${currentSubject.toLowerCase()}-s${sectionNum}-${globalSectionIdx}`;

      const existing = sections.find(
        s => s.subject === currentSubject && s.sectionNumber === sectionNum &&
        Math.abs(sections.indexOf(s) - globalSectionIdx) < 2
      );

      if (!existing || existing.subject !== currentSubject) {
        currentSection = {
          id: sectionId,
          subject: currentSubject,
          sectionNumber: sectionNum,
          sectionLabel: `${currentSubject} - Section ${sectionNum}`,
          questions: [],
        };
        sections.push(currentSection);
        globalSectionIdx++;
      } else {
        currentSection = existing;
      }
    }

    if (!currentSection) {
      currentSection = {
        id: `${currentSubject.toLowerCase()}-s1-${globalSectionIdx}`,
        subject: currentSubject,
        sectionNumber: 1,
        sectionLabel: `${currentSubject} - Section 1`,
        questions: [],
      };
      sections.push(currentSection);
      globalSectionIdx++;
    }

    const qMatches = [...text.matchAll(/Q\.(\d+)/g)];
    for (const qm of qMatches) {
      const qNum = parseInt(qm[1]);
      const exists = currentSection.questions.some(q => q.number === qNum);
      if (!exists) {
        const yRatio = findQuestionYRatio(items, pageHeight, qNum);
        currentSection.questions.push({
          id: `${currentSection.id}-q${qNum}`,
          label: `Q.${qNum}`,
          number: qNum,
          page: pageIndex,
          yRatio,
        });
      }
    }
  }

  return sections.filter(s => s.questions.length > 0);
}
