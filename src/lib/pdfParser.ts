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
      // PDF y is from bottom, so invert: ratio = 1 - (y / pageHeight)
      const ratio = 1 - (item.y / pageHeight);
      return Math.max(0, Math.min(1, ratio));
    }
  }
  return 0;
}

export async function parsePdfSections(file: File): Promise<DetectedSection[]> {
  const pages = await extractAllPageTexts(file);
  const sections: DetectedSection[] = [];
  let currentSubject = 'General';
  let currentSection: DetectedSection | null = null;
  let globalSectionIdx = 0;

  for (const { pageIndex, text, items, pageHeight } of pages) {
    const subjectMatch = text.match(/\b(Mathematics|Physics|Chemistry|Biology|English|General\s*Studies)\b/i);
    if (subjectMatch) {
      const newSubject = subjectMatch[1].trim();
      if (newSubject.toLowerCase() !== currentSubject.toLowerCase()) {
        currentSubject = newSubject;
        currentSection = null;
      }
    }

    const sectionMatches = [...text.matchAll(/SECTION\s+(\d+)/gi)];
    for (const sm of sectionMatches) {
      const sectionNum = parseInt(sm[1]);
      const sectionId = `${currentSubject.toLowerCase().replace(/\s+/g, '')}-s${sectionNum}-${globalSectionIdx}`;

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
        id: `${currentSubject.toLowerCase().replace(/\s+/g, '')}-s1-${globalSectionIdx}`,
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
