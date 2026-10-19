import React, { useState } from 'react';
import { Plus, MoreHorizontal, FileText, ChevronRight, Network, Trash2, Edit2, Palette } from 'lucide-react';
import { Subject, DocumentItem } from '../../types';
import { MarbleArt } from './MarbleArt';

interface GlassFolderCardProps {
  subject: Subject;
  documents?: DocumentItem[];
  isExpanded?: boolean;
  onToggleExpand?: (subjectId: string) => void;
  onOpenDocument?: (doc: DocumentItem) => void;
  onOpenGraphWorkspace?: (subjectId: string) => void;
  onUploadClick?: (subjectId: string) => void;
  onRename?: (subject: Subject) => void;
  onChangeArtwork?: (subject: Subject) => void;
  onDelete?: (subjectId: string) => void;
}

export const GlassFolderCard: React.FC<GlassFolderCardProps> = ({
  subject,
  documents = [],
  isExpanded = false,
  onToggleExpand,
  onOpenDocument,
  onOpenGraphWorkspace,
  onUploadClick,
  onRename,
  onChangeArtwork,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const docList = (subject.documents && subject.documents.length > 0) ? subject.documents : documents;
  const itemCount = subject.document_count ?? docList.length ?? 0;

  // Placeholder mock files for rich fan-out if subject has fewer than 4 files
  const displayFiles = docList.length > 0 ? docList : [
    { id: 'f-1', title: 'Contract.pdf', original_filename: 'Contract.pdf', size_bytes: 327680, page_count: 8, storage_path: 'sample-handbook.pdf' },
    { id: 'f-2', title: 'Lecture_Notes.pdf', original_filename: 'Lecture_Notes.pdf', size_bytes: 1048576, page_count: 14, storage_path: 'sample-lecture.pdf' },
    { id: 'f-3', title: 'Syllabus_Guide.pdf', original_filename: 'Syllabus_Guide.pdf', size_bytes: 524288, page_count: 6, storage_path: 'sample-java.pdf' },
    { id: 'f-4', title: 'Problem_Set_1.pdf', original_filename: 'Problem_Set_1.pdf', size_bytes: 2097152, page_count: 22, storage_path: 'sample-clrs.pdf' },
  ];

  return (
    <div className="relative group select-none transition-all duration-300">
      {/* ============================================================== */}
      {/* FAN-OUT STACKED FILES (Matching Image 2 Reference)              */}
      {/* ============================================================== */}
      <div
        className={`absolute bottom-[40px] left-0 right-0 z-0 transition-all duration-500 ease-out origin-bottom ${
          isExpanded
            ? 'opacity-100 translate-y-[-125px] pointer-events-auto'
            : 'opacity-0 translate-y-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-[210px] flex items-center justify-center">
          {/* Card 1: Top Left Layer (Lookbook style with marble header) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenDocument?.(displayFiles[0]);
            }}
            className="absolute w-[220px] h-[160px] rounded-2xl bg-white shadow-[-8px_16px_32px_rgba(0,0,0,0.5)] border border-neutral-200 overflow-hidden cursor-pointer hover:scale-105 hover:-translate-y-2 transition-transform duration-200 -rotate-12 -translate-x-14 -translate-y-8"
          >
            <div className="h-14 w-full overflow-hidden relative">
              <MarbleArt id={subject.artwork || 'marble-1'} />
              <div className="absolute inset-0 bg-black/20 p-2 text-white">
                <p className="text-xs font-semibold truncate">{displayFiles[0]?.title || 'Overview'}</p>
                <p className="text-[10px] text-white/80">38 pages • Study Notes</p>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              <div className="h-2 w-3/4 bg-neutral-200 rounded" />
              <div className="h-2 w-1/2 bg-neutral-100 rounded" />
              <div className="h-2 w-5/6 bg-neutral-100 rounded" />
            </div>
          </div>

          {/* Card 2: Top Center Document (Invoices style) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenDocument?.(displayFiles[1] || displayFiles[0]);
            }}
            className="absolute w-[220px] h-[160px] rounded-2xl bg-white shadow-[0_16px_36px_rgba(0,0,0,0.55)] border border-neutral-200 p-3.5 cursor-pointer hover:scale-105 hover:-translate-y-2 transition-transform duration-200 -rotate-3 -translate-y-14"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-neutral-800 truncate">
                {displayFiles[1]?.title || 'Curriculum.pdf'}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">12 PDFs</span>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-2.5 w-11/12 bg-neutral-200 rounded" />
              <div className="h-2.5 w-4/5 bg-neutral-200 rounded" />
              <div className="h-2.5 w-full bg-neutral-100 rounded" />
              <div className="h-2.5 w-3/4 bg-neutral-100 rounded" />
            </div>
          </div>

          {/* Card 3: Top Right Warm Marble Layer */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenDocument?.(displayFiles[2] || displayFiles[0]);
            }}
            className="absolute w-[220px] h-[160px] rounded-2xl bg-white shadow-[8px_16px_32px_rgba(0,0,0,0.5)] border border-neutral-200 overflow-hidden cursor-pointer hover:scale-105 hover:-translate-y-2 transition-transform duration-200 rotate-8 translate-x-12 -translate-y-10"
          >
            <div className="h-14 w-full overflow-hidden relative">
              <MarbleArt id="marble-2" />
              <div className="absolute inset-0 bg-black/25 p-2 text-white">
                <p className="text-xs font-semibold truncate">{displayFiles[2]?.title || 'Lab Report'}</p>
                <p className="text-[10px] text-white/80">PDF • 2.1 MB</p>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              <div className="h-2 w-4/5 bg-neutral-200 rounded" />
              <div className="h-2 w-2/3 bg-neutral-100 rounded" />
              <div className="h-2 w-3/4 bg-neutral-100 rounded" />
            </div>
          </div>

          {/* Card 4: Foreground White Contract.pdf Card */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenDocument?.(displayFiles[3] || displayFiles[0]);
            }}
            className="absolute w-[220px] h-[160px] rounded-2xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.6)] border border-neutral-200 p-3.5 cursor-pointer hover:scale-105 hover:-translate-y-2 transition-transform duration-200 rotate-2 translate-y-[-24px]"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-neutral-800 truncate">
                {displayFiles[3]?.title || 'Equations_Ref.pdf'}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">PDF • 320 KB</span>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-2.5 w-full bg-neutral-200 rounded" />
              <div className="h-2.5 w-11/12 bg-neutral-200 rounded" />
              <div className="h-2.5 w-4/5 bg-neutral-100 rounded" />
            </div>
          </div>
        </div>

        {/* Quick action pill on expanded deck */}
        <div className="flex justify-center mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenGraphWorkspace?.(subject.id);
            }}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-neutral-900/95 text-white border border-white/20 text-xs font-medium shadow-xl hover:bg-neutral-800 transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Concept Graph</span>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* AUTHENTIC FOLDER SILHOUETTE CARD (Images 2 & 3)                 */}
      {/* ============================================================== */}
      <div
        onClick={() => onToggleExpand?.(subject.id)}
        className="relative w-full max-w-[340px] h-[230px] mx-auto cursor-pointer group-hover:-translate-y-1 transition-all duration-300"
      >
        {/* Back Plate with Tab (Contains the Marbled Artwork!) */}
        <div className="absolute inset-0 z-0">
          {/* Custom SVG folder silhouette for pixel-perfect raised tab & rounded corners */}
          <div className="relative w-full h-full">
            {/* Top Tab on Left */}
            <div className="absolute top-0 left-0 w-[54%] h-[40px] rounded-t-2xl overflow-hidden bg-neutral-800 border-t border-l border-r border-white/20">
              <div className="absolute inset-0">
                <MarbleArt id={subject.artwork || 'marble-1'} />
              </div>
            </div>

            {/* Back Plate Body */}
            <div className="absolute top-[28px] inset-x-0 bottom-0 rounded-2xl overflow-hidden bg-neutral-900 border border-white/15 shadow-2xl">
              <div className="absolute inset-0 opacity-80">
                <MarbleArt id={subject.artwork || 'marble-1'} />
              </div>
            </div>
          </div>
        </div>

        {/* Layered White Paper Sheets Behind the Front Glass Lip */}
        <div className="absolute top-[22px] left-3 right-3 h-[24px] rounded-t-xl bg-neutral-100/90 z-10 border-t border-white/60 shadow-sm" />
        <div className="absolute top-[26px] left-2 right-2 h-[22px] rounded-t-xl bg-white z-20 border-t border-white shadow-sm" />

        {/* Front Glossy Translucent Glass Panel (The White Front Surface) */}
        <div
          className="absolute top-[34px] inset-x-0 bottom-0 z-30 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.65)] transition-all duration-300 border border-white/70"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(245, 246, 250, 0.86) 60%, rgba(235, 238, 245, 0.92) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Specular gloss highlight reflection across top of folder */}
          <div className="absolute -top-12 -left-12 w-48 h-28 bg-gradient-to-br from-white/70 to-transparent rotate-12 pointer-events-none" />

          {/* Folder Tab Cutout Silhouette Notch on Front Panel */}
          <div className="absolute -top-1 left-0 w-[42%] h-[8px] bg-white/40 rounded-b-lg pointer-events-none" />

          {/* Folder Information (Dark text on white glossy card) */}
          <div className="pt-2 z-10">
            <h3 className="text-xl font-bold tracking-tight text-neutral-900 leading-snug truncate">
              {subject.title}
            </h3>
            <p className="text-xs font-mono text-neutral-500 mt-1 flex items-center gap-1.5">
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              {subject.graph_count ? (
                <>
                  <span className="text-neutral-300">•</span>
                  <span className="text-emerald-700 font-medium">{subject.graph_count} graphs</span>
                </>
              ) : null}
            </p>
          </div>

          {/* Bottom Floating Control Buttons (Image 3: Black Plus or White ooo Button) */}
          <div className="flex items-center justify-between z-10 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenGraphWorkspace?.(subject.id);
              }}
              className="text-[11px] font-medium text-neutral-600 hover:text-neutral-950 flex items-center space-x-1 group/btn transition-colors"
            >
              <span>View Graph</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center space-x-2">
              {/* Floating Black Plus Button for Direct Upload (Image 3 Left) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUploadClick?.(subject.id);
                }}
                title="Add PDF to this subject"
                className="w-10 h-10 rounded-2xl bg-neutral-900 hover:bg-black text-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.35)] active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5 text-white" strokeWidth={2.2} />
              </button>

              {/* Floating Pill Three-Dot Menu (Image 3 Right) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  title="Subject actions"
                  className="w-11 h-9 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-95 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5 text-neutral-700" strokeWidth={2.4} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 bottom-12 w-44 rounded-xl bg-[#16161a] border border-white/15 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onRename?.(subject);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 rounded-lg flex items-center space-x-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Rename Subject</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onChangeArtwork?.(subject);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 rounded-lg flex items-center space-x-2"
                    >
                      <Palette className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Change Artwork</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete?.(subject.id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center space-x-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete Folder</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
