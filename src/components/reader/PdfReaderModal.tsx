import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Download,
  X,
  FileText,
  RotateCw,
  Sliders,
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { api } from '../../api/client';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfReaderModalProps {
  document: DocumentItem | null;
  initialPage?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
  document,
  initialPage = 1,
  isOpen,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Load document and initial reading progress
  useEffect(() => {
    if (!isOpen || !document) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    const loadDoc = async () => {
      try {
        // Fetch saved progress
        let targetPage = initialPage;
        try {
          const prog = await api.getReadingProgress(document.id);
          if (prog && prog.last_page && initialPage === 1) {
            targetPage = prog.last_page;
          }
        } catch {
          // Ignore
        }

        const fileUrl = `/uploads/${document.storage_path}`;
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist/cmaps/',
          cMapPacked: true,
        });

        const loadedPdf = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(Math.min(targetPage, loadedPdf.numPages));
        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('PDF Load Error:', err);
        setErrorMessage('Failed to load PDF document. Please verify the file integrity.');
        setIsLoading(false);
      }
    };

    loadDoc();

    return () => {
      isMounted = false;
    };
  }, [isOpen, document, initialPage]);

  // Render current page to canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        // Persist reading progress
        if (document) {
          api.saveReadingProgress(document.id, pageNumber).catch(() => {});
        }
      } catch (err) {
        console.error('Page render error:', err);
      }
    },
    [pdfDoc, scale, document]
  );

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement);
    };

    window.document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!window.document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      window.document.exitFullscreen().catch(() => {});
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (!isOpen || !document) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#08080a] text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Reader Toolbar */}
      <header className="h-14 bg-[#121216] border-b border-white/10 px-5 flex items-center justify-between z-20 flex-shrink-0">
        {/* Document Title & Page Count */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Close Reader"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 truncate">
            <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-white truncate max-w-sm">
              {document.title}
            </span>
          </div>
        </div>

        {/* Page Navigation Controls */}
        <div className="flex items-center space-x-2 bg-[#18181f] px-3 py-1.5 rounded-xl border border-white/10">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded text-neutral-300 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const p = parseInt(e.target.value, 10);
                if (p >= 1 && p <= totalPages) setCurrentPage(p);
              }}
              className="w-12 text-center bg-white/10 rounded px-1 py-0.5 text-white font-medium focus:outline-none"
            />
            <span className="text-neutral-500">of {totalPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded text-neutral-300 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            title="Zoom Out"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-neutral-400 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            title="Zoom In"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Download Original PDF */}
          <a
            href={`/uploads/${document.storage_path}`}
            download={document.original_filename}
            title="Download PDF"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Document Viewport */}
      <main className="flex-1 overflow-auto bg-[#0a0a0d] flex items-center justify-center p-8 relative">
        {isLoading && (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-neutral-400">Loading document pages...</p>
          </div>
        )}

        {errorMessage && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md">
            <p className="text-sm text-rose-300 font-medium">{errorMessage}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium"
            >
              Return to Workspace
            </button>
          </div>
        )}

        <div className={`shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-white ${isLoading ? 'hidden' : 'block'}`}>
          <canvas ref={canvasRef} />
        </div>
      </main>
    </div>
  );
};
