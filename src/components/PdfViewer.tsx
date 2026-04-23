import { useRef, useCallback, useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from '@/lib/pdfParser';
import { DetectedSection } from '@/lib/types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PdfViewerProps {
  file: File;
  sections: DetectedSection[];
  scrollToQuestionId?: string;
}

export default function PdfViewer({ file, sections, scrollToQuestionId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollToQuestionId) return;
    const el = document.getElementById(`pdf-q-${scrollToQuestionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToQuestionId]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  // Build a map of page -> questions for placing anchors
  const pageQuestions = useCallback(() => {
    const map: Record<number, Array<{ id: string; yRatio: number }>> = {};
    for (const s of sections) {
      for (const q of s.questions) {
        if (!map[q.page]) map[q.page] = [];
        map[q.page].push({ id: q.id, yRatio: q.yRatio });
      }
    }
    // Sort each page's questions by yRatio (top to bottom)
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => a.yRatio - b.yRatio);
    }
    return map;
  }, [sections]);

  const pgQuestions = pageQuestions();

  if (!fileUrl) return null;

  return (
    <div ref={containerRef} className="h-full overflow-y-auto scrollbar-thin bg-jee-gray">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Loading PDF...
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => {
          const questions = pgQuestions[i] ?? [];
          return (
            <div key={i} id={`pdf-page-${i}`} className="relative mb-2">
              <Page
                pageNumber={i + 1}
                width={Math.min(containerWidth - 16, 900)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {/* Invisible anchor markers for each question */}
              {questions.map(q => (
                <div
                  key={q.id}
                  id={`pdf-q-${q.id}`}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: `${q.yRatio * 100}%`, height: '2px' }}
                />
              ))}
            </div>
          );
        })}
      </Document>
    </div>
  );
}
