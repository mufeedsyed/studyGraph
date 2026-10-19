import React, { useState } from 'react';
import { FolderPlus, X, Check, AlertTriangle } from 'lucide-react';
import { Subject, DocumentItem } from '../../types';
import { GlassFolderCard } from './GlassFolderCard';
import { MarbleArt } from './MarbleArt';

interface FolderLibraryProps {
  subjects: Subject[];
  documents: DocumentItem[];
  onOpenFolder: (subjectId: string) => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onOpenGraphWorkspace: (subjectId?: string) => void;
  onUploadClick: (subjectId: string) => void;
  onCreateSubject: (data: { title: string; description: string; artwork: string }) => Promise<void>;
  onUpdateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
}

const ARTWORK_OPTIONS = [
  { id: 'marble-1', name: 'Violet & Peach Swirl' },
  { id: 'marble-2', name: 'Terracotta & Teal Fluid' },
  { id: 'marble-3', name: 'Ice Slate & Pearl' },
  { id: 'marble-4', name: 'Obsidian & Emerald Vein' },
  { id: 'marble-5', name: 'Titanium & Cyber Amber' },
];

export const FolderLibrary: React.FC<FolderLibraryProps> = ({
  subjects,
  documents,
  onOpenFolder,
  onOpenDocument,
  onOpenGraphWorkspace,
  onUploadClick,
  onCreateSubject,
  onUpdateSubject,
  onDeleteSubject,
}) => {
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [artworkSubject, setArtworkSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState('marble-1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleExpand = (id: string) => {
    setExpandedFolderId(prev => (prev === id ? null : id));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreateSubject({
        title: newTitle.trim(),
        description: newDesc.trim(),
        artwork: selectedArtwork,
      });
      setNewTitle('');
      setNewDesc('');
      setSelectedArtwork('marble-1');
      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!subjectToDelete) return;
    try {
      await onDeleteSubject(subjectToDelete);
      setSubjectToDelete(null);
    } catch (err) {
      console.error('Delete subject error:', err);
    }
  };

  return (
    <section id="folder-library" className="w-full py-20 px-6 sm:px-10 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono tracking-wider text-neutral-400 mb-3">
            <span>COLLECTION REPOSITORY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Subject Library
          </h2>
          <p className="mt-2 text-sm text-neutral-400 max-w-xl">
            Curate your academic domains, store lecture materials, and organize PDF archives. Double-click any folder to view its documents, or click its buttons to upload and inspect graphs.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-neutral-200 transition-all shadow-lg self-start md:self-auto active:scale-95"
        >
          <FolderPlus className="w-4 h-4 text-emerald-600" />
          <span>New Subject Folder</span>
        </button>
      </div>

      {/* Grid of Glossy Folders with Generous Spacing to Prevent Any Overlap */}
      {subjects.length === 0 ? (
        <div className="w-full py-20 rounded-3xl border border-dashed border-white/10 bg-[#0d0d10] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-400 mb-4">
            <FolderPlus className="w-8 h-8 text-neutral-300" />
          </div>
          <h3 className="text-lg font-medium text-white">No subject folders yet</h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-md">
            Create your first academic folder to begin organizing your lecture PDFs and manually building concept graphs.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-6 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
          >
            Create First Folder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20 pt-6 pb-16">
          {subjects.map((subject) => (
            <GlassFolderCard
              key={subject.id}
              subject={subject}
              documents={documents}
              isExpanded={expandedFolderId === subject.id}
              onToggleExpand={handleToggleExpand}
              onOpenFolder={onOpenFolder}
              onOpenDocument={onOpenDocument}
              onOpenGraphWorkspace={onOpenGraphWorkspace}
              onUploadClick={onUploadClick}
              onRename={(s) => setEditingSubject(s)}
              onChangeArtwork={(s) => setArtworkSubject(s)}
              onDelete={(id) => setSubjectToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Create Subject Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#131317] border border-white/15 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Create Subject Folder</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                  SUBJECT TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum Computing, Biochemistry"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c22] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key focus areas, course codes, exam topics..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c22] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-2">
                  CHOOSE MARBLED ARTWORK
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ARTWORK_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setSelectedArtwork(opt.id)}
                      className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedArtwork === opt.id
                          ? 'border-emerald-400 scale-105 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <MarbleArt id={opt.id} />
                      {selectedArtwork === opt.id && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 disabled:opacity-50 transition-colors shadow-lg"
                >
                  {isSubmitting ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#131317] border border-white/15 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Rename Subject</h3>
            <input
              type="text"
              value={editingSubject.title}
              onChange={(e) => setEditingSubject({ ...editingSubject, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c22] border border-white/10 text-white text-sm focus:outline-none focus:border-white/40"
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (editingSubject.title.trim()) {
                    await onUpdateSubject(editingSubject.id, { title: editingSubject.title.trim() });
                    setEditingSubject(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Artwork Modal */}
      {artworkSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#131317] border border-white/15 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-3">Choose Artwork</h3>
            <div className="grid grid-cols-3 gap-3 my-4">
              {ARTWORK_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={async () => {
                    await onUpdateSubject(artworkSubject.id, { artwork: opt.id });
                    setArtworkSubject(null);
                  }}
                  className="h-20 rounded-xl overflow-hidden border border-white/20 hover:scale-105 transition-transform"
                >
                  <MarbleArt id={opt.id} />
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setArtworkSubject(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#131317] border border-white/15 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete Subject Folder</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Are you sure you want to delete this folder? Its documents and associated concept graphs will be unlinked. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-lg"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
