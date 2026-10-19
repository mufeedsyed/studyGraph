import React, { useState } from 'react';
import {
  ChevronLeft,
  Upload,
  Network,
  FileText,
  Trash2,
  Download,
  BookOpen,
  Calendar,
  HardDrive,
  Edit2,
  FolderOpen,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Subject, DocumentItem } from '../../types';
import { MarbleArt } from './MarbleArt';

interface FolderContentsViewProps {
  subject: Subject;
  documents: DocumentItem[];
  onBack: () => void;
  onOpenPdf: (doc: DocumentItem) => void;
  onUploadClick: (subjectId: string) => void;
  onOpenGraph: (subjectId: string) => void;
  onRenameSubject: (subject: Subject) => void;
  onDeleteDocument: (docId: string) => Promise<void>;
}

export const FolderContentsView: React.FC<FolderContentsViewProps> = ({
  subject,
  documents,
  onBack,
  onOpenPdf,
  onUploadClick,
  onOpenGraph,
  onRenameSubject,
  onDeleteDocument,
}) => {
  // Only documents that genuinely belong to this subject!
  const subjectDocs = documents.filter((d) => d.subject_id === subject.id);

  // State for document deletion confirmation
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteDocument(docToDelete.id);
      setDocToDelete(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#080808] text-[#F3F3F3] py-12 px-6 sm:px-10 max-w-7xl mx-auto select-none">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-8 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-medium text-neutral-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Folders</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenGraph(subject.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 transition-all shadow-sm"
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Concept Graph</span>
          </button>

          <button
            onClick={() => onUploadClick(subject.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-lg active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Subject Header Banner */}
      <div className="mt-8 rounded-3xl overflow-hidden border border-white/15 bg-[#121216] shadow-2xl relative">
        {/* Top Marbled Art Accent Strip */}
        <div className="h-28 w-full relative overflow-hidden">
          <div className="absolute inset-0 opacity-90">
            <MarbleArt id={subject.artwork || 'marble-1'} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#121216]" />
        </div>

        {/* Content Info */}
        <div className="px-8 pb-8 -mt-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start space-x-5">
            {/* Folder Silhouette Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white text-neutral-900 flex items-center justify-center shadow-xl border border-white/60 flex-shrink-0">
              <FolderOpen className="w-8 h-8 text-neutral-800" />
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {subject.title}
                </h1>
                <button
                  onClick={() => onRenameSubject(subject)}
                  title="Rename Subject"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {subject.description ? (
                <p className="mt-1 text-xs text-neutral-400 max-w-xl">
                  {subject.description}
                </p>
              ) : null}

              <div className="mt-3 flex items-center space-x-4 text-xs font-mono text-neutral-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{subjectDocs.length} {subjectDocs.length === 1 ? 'PDF' : 'PDFs'} stored</span>
                </span>
                <span>•</span>
                <span>Double-click any PDF to open the reader</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Document List */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-400">
            Folder Documents ({subjectDocs.length})
          </h2>
        </div>

        {subjectDocs.length === 0 ? (
          /* Empty Folder State */
          <div className="w-full py-20 rounded-3xl border border-dashed border-white/10 bg-[#0d0d11] flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-white">This folder is empty</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Upload your lecture notes, slides, problem sets, or textbooks to start building your academic knowledge base for {subject.title}.
            </p>
            <button
              onClick={() => onUploadClick(subject.id)}
              className="mt-6 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-lg flex items-center space-x-2"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Upload First PDF</span>
            </button>
          </div>
        ) : (
          /* Real Documents Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjectDocs.map((doc) => (
              <div
                key={doc.id}
                onDoubleClick={() => onOpenPdf(doc)}
                className="group relative rounded-2xl bg-[#131318] hover:bg-[#181820] border border-white/10 hover:border-white/25 p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: File Type Badge & Actions */}
                  <div className="flex items-center justify-between pb-3">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 font-semibold uppercase">
                      PDF
                    </span>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`/uploads/${doc.storage_path}`}
                        download={doc.original_filename}
                        title="Download Original PDF"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <button
                        title="Delete Document"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocToDelete(doc);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Document Title */}
                  <h3 className="text-sm font-semibold text-white tracking-tight leading-snug line-clamp-2 mt-1">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-500 mt-1 truncate">
                    {doc.original_filename}
                  </p>
                </div>

                {/* Bottom Metadata & Study Action */}
                <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3 text-neutral-500" />
                      <span>{formatFileSize(doc.size_bytes)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>{formatDate(doc.created_at)}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenPdf(doc)}
                    className="flex items-center space-x-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Study</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Document Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#131317] border border-white/15 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete Document</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Are you sure you want to permanently delete <strong className="text-white">&quot;{docToDelete.title}&quot;</strong> from this folder? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-lg"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
