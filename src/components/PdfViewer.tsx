import { useRef, useCallback, useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from '@/lib/pdfParser';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PdfViewerProps {
  file: File;
  scrollToPage?: number;
}

export default function PdfViewer({ file, scrollToPage }: PdfViewerProps) {
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
    if (scrollToPage === undefined || scrollToPage < 0) return;
    const el = document.getElementById(`pdf-page-${scrollToPage}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToPage]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

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
        {Array.from({ length: numPages }, (_, i) => (
          <div key={i} id={`pdf-page-${i}`} className="mb-2">
            <Page
              pageNumber={i + 1}
              width={Math.min(containerWidth - 16, 900)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
