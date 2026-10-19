import React, { useState } from 'react';
import { Plus, MoreHorizontal, FileText, ChevronRight, Network, Trash2, Edit2, Palette, FolderOpen } from 'lucide-react';
import { Subject, DocumentItem } from '../../types';
import { MarbleArt } from './MarbleArt';

interface GlassFolderCardProps {
  subject: Subject;
  documents?: DocumentItem[];
  isExpanded?: boolean;
  onToggleExpand?: (subjectId: string) => void;
  onOpenFolder?: (subjectId: string) => void;
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
  onOpenFolder,
  onOpenDocument,
  onOpenGraphWorkspace,
  onUploadClick,
  onRename,
  onChangeArtwork,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const realDocs = (subject.documents && subject.documents.length > 0)
    ? subject.documents
    : documents.filter((d) => d.subject_id === subject.id);
  const itemCount = realDocs.length;

  return (
    <div
      className={`relative group select-none transition-all duration-300 ${
        isExpanded ? 'z-40' : 'z-10 hover:z-20'
      }`}
    >
      {/* ============================================================== */}
      {/* FAN-OUT STACKED FILES (Image 2 Reference - Real Files Only!)   */}
      {/* ============================================================== */}
      {isExpanded && (
        <div className="absolute bottom-[50px] left-0 right-0 z-0 transition-all duration-300 ease-out origin-bottom animate-in fade-in slide-in-from-bottom-4">
          <div className="relative w-full h-[180px] flex items-center justify-center">
            {itemCount === 0 ? (
              <div className="w-[240px] p-4 rounded-2xl bg-[#141419] border border-white/10 text-center shadow-2xl -translate-y-6">
                <FileText className="w-6 h-6 text-neutral-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-neutral-300">No PDFs in this folder</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadClick?.(subject.id);
                  }}
                  className="mt-2 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                >
                  + Upload PDF now
                </button>
              </div>
            ) : (
              realDocs.slice(0, 3).map((doc, idx) => {
                const rotations = ['-rotate-8 -translate-x-10 -translate-y-6', 'rotate-0 -translate-y-10', 'rotate-8 translate-x-10 -translate-y-6'];
                return (
                  <div
                    key={doc.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDocument?.(doc);
                    }}
                    className={`absolute w-[220px] h-[140px] rounded-2xl bg-white shadow-[-6px_14px_28px_rgba(0,0,0,0.55)] border border-neutral-200 p-3.5 cursor-pointer hover:scale-105 hover:-translate-y-3 transition-transform duration-200 ${rotations[idx % 3]}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-neutral-800 truncate max-w-[130px]">
                        {doc.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">PDF</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="h-2 w-full bg-neutral-200 rounded" />
                      <div className="h-2 w-4/5 bg-neutral-100 rounded" />
                      <div className="h-2 w-2/3 bg-neutral-100 rounded" />
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium mt-3">
                      Double-click to study
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Action Pill */}
          <div className="flex justify-center mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder?.(subject.id);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#18181f]/95 text-white border border-white/20 text-xs font-medium shadow-xl hover:bg-neutral-800 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Folder Contents ({itemCount})</span>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* AUTHENTIC FOLDER SILHOUETTE CARD (Images 2 & 3)                 */}
      {/* ============================================================== */}
      <div
        onClick={() => onToggleExpand?.(subject.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onOpenFolder?.(subject.id);
        }}
        title="Double-click to open folder contents"
        className="relative w-full max-w-[340px] h-[230px] mx-auto cursor-pointer group-hover:-translate-y-1 transition-all duration-300"
      >
        {/* Back Plate with Tab (Contains Marbled Artwork) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="relative w-full h-full">
            {/* Top Tab on Left */}
            <div className="absolute top-0 left-0 w-[54%] h-[40px] rounded-t-2xl overflow-hidden bg-neutral-800 border-t border-l border-r border-white/20">
              <div className="absolute inset-0">
                <MarbleArt id={subject.artwork || 'marble-1'} />
              </div>
            </div>

            {/* Back Plate Body */}
            <div className="absolute top-[28px] inset-x-0 bottom-0 rounded-2xl overflow-hidden bg-neutral-900 border border-white/15 shadow-xl">
              <div className="absolute inset-0 opacity-80">
                <MarbleArt id={subject.artwork || 'marble-1'} />
              </div>
            </div>
          </div>
        </div>

        {/* Layered White Paper Sheets Behind the Front Glass Lip */}
        <div className="absolute top-[22px] left-3 right-3 h-[24px] rounded-t-xl bg-neutral-100/90 z-10 border-t border-white/60 shadow-sm pointer-events-none" />
        <div className="absolute top-[26px] left-2 right-2 h-[22px] rounded-t-xl bg-white z-20 border-t border-white shadow-sm pointer-events-none" />

        {/* Front Glossy Translucent Glass Panel (The White Front Surface) */}
        <div
          className="absolute top-[34px] inset-x-0 bottom-0 z-30 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.6)] transition-all duration-300 border border-white/70"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(245, 246, 250, 0.86) 60%, rgba(235, 238, 245, 0.92) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Specular gloss highlight reflection */}
          <div className="absolute -top-12 -left-12 w-48 h-28 bg-gradient-to-br from-white/70 to-transparent rotate-12 pointer-events-none" />

          {/* Folder Tab Cutout Notch on Front Lip */}
          <div className="absolute -top-1 left-0 w-[42%] h-[8px] bg-white/40 rounded-b-lg pointer-events-none" />

          {/* Folder Information */}
          <div className="pt-2 z-10">
            <h3 className="text-xl font-bold tracking-tight text-neutral-900 leading-snug truncate">
              {subject.title}
            </h3>
            <p className="text-xs font-mono text-neutral-500 mt-1 flex items-center gap-1.5">
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              <span className="text-neutral-300">•</span>
              <span className="text-emerald-700 font-medium">Double-click to open</span>
            </p>
          </div>

          {/* Bottom Floating Control Buttons */}
          <div className="flex items-center justify-between z-10 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder?.(subject.id);
              }}
              className="text-[11px] font-medium text-neutral-700 hover:text-neutral-950 flex items-center space-x-1 group/btn transition-colors"
            >
              <span>Inspect Folder</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center space-x-2">
              {/* Floating Black Plus Button for Direct Upload (Image 3 Left) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUploadClick?.(subject.id);
                }}
                title="Upload PDF to this folder"
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
                  title="Folder actions"
                  className="w-11 h-9 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-95 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5 text-neutral-700" strokeWidth={2.4} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 bottom-12 w-48 rounded-2xl bg-[#16161a] border border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenFolder?.(subject.id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 rounded-xl flex items-center space-x-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Open Folder</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenGraphWorkspace?.(subject.id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 rounded-xl flex items-center space-x-2"
                    >
                      <Network className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Concept Graph</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onRename?.(subject);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 rounded-xl flex items-center space-x-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Rename Subject</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onChangeArtwork?.(subject);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 rounded-xl flex items-center space-x-2"
                    >
                      <Palette className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Change Artwork</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete?.(subject.id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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
