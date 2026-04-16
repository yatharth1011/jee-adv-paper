import { pdfjs } from 'react-pdf';
import { DetectedSection, DetectedQuestion } from './types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export { pdfjs };

interface PageText {
  pageIndex: number;
  text: string;
}

async function extractAllPageTexts(file: File): Promise<PageText[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: PageText[] = [];

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(' ');
    pages.push({ pageIndex: i, text });
  }

  return pages;
}

export async function parsePdfSections(file: File): Promise<DetectedSection[]> {
  const pages = await extractAllPageTexts(file);
  const sections: DetectedSection[] = [];
  let currentSubject = 'General';
  let currentSection: DetectedSection | null = null;
  let globalSectionIdx = 0;

  for (const { pageIndex, text } of pages) {
    // Detect subject changes
    const subjectMatch = text.match(/\b(Mathematics|Physics|Chemistry|Biology|English|General\s*Studies)\b/i);
    if (subjectMatch) {
      const newSubject = subjectMatch[1].trim();
      if (newSubject.toLowerCase() !== currentSubject.toLowerCase()) {
        currentSubject = newSubject;
        currentSection = null; // reset section on subject change
      }
    }

    // Detect section headers
    const sectionMatches = [...text.matchAll(/SECTION\s+(\d+)/gi)];
    for (const sm of sectionMatches) {
      const sectionNum = parseInt(sm[1]);
      const sectionId = `${currentSubject.toLowerCase().replace(/\s+/g, '')}-s${sectionNum}-${globalSectionIdx}`;
      
      // Check if we already have this exact section
      const existing = sections.find(
        s => s.subject === currentSubject && s.sectionNumber === sectionNum && 
        Math.abs(sections.indexOf(s) - globalSectionIdx) < 2
      );
      
      if (!existing || existing.subject !== currentSubject) {
        currentSection = {
          id: sectionId,
          subject: currentSubject,
          sectionNumber: sectionNum,
          sectionLabel: `${currentSubject} — Section ${sectionNum}`,
          questions: [],
        };
        sections.push(currentSection);
        globalSectionIdx++;
      } else {
        currentSection = existing;
      }
    }

    // If no section yet, create a default one
    if (!currentSection) {
      currentSection = {
        id: `${currentSubject.toLowerCase().replace(/\s+/g, '')}-s1-${globalSectionIdx}`,
        subject: currentSubject,
        sectionNumber: 1,
        sectionLabel: `${currentSubject} — Section 1`,
        questions: [],
      };
      sections.push(currentSection);
      globalSectionIdx++;
    }

    // Detect questions - match Q.1, Q.2, etc.
    const qMatches = [...text.matchAll(/Q\.(\d+)/g)];
    for (const qm of qMatches) {
      const qNum = parseInt(qm[1]);
      const exists = currentSection.questions.some(q => q.number === qNum);
      if (!exists) {
        currentSection.questions.push({
          id: `${currentSection.id}-q${qNum}`,
          label: `Q.${qNum}`,
          number: qNum,
          page: pageIndex,
        });
      }
    }
  }

  // Remove empty sections
  return sections.filter(s => s.questions.length > 0);
}
