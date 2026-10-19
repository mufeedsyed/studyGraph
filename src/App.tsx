import React, { useState, useEffect } from 'react';
import { Subject, DocumentItem, ConceptGraph, AppStats } from './types';
import { api } from './api/client';
import { DottedSurface } from './components/hero/DottedSurface';
import { FolderLibrary } from './components/folder/FolderLibrary';
import { FolderContentsView } from './components/folder/FolderContentsView';
import { GraphWorkspace } from './components/graph/GraphWorkspace';
import { PdfReaderModal } from './components/reader/PdfReaderModal';
import { PdfUploadModal } from './components/upload/PdfUploadModal';
import { Network, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'home' | 'folder' | 'workspace'>('home');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [graphs, setGraphs] = useState<ConceptGraph[]>([]);
  const [activeGraph, setActiveGraph] = useState<ConceptGraph | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);

  // Modals & Reader state
  const [readerDoc, setReaderDoc] = useState<DocumentItem | null>(null);
  const [readerPage, setReaderPage] = useState<number>(1);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  const [uploadSubjectId, setUploadSubjectId] = useState<string | undefined>(undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [isCreateGraphOpen, setIsCreateGraphOpen] = useState(false);
  const [newGraphTitle, setNewGraphTitle] = useState('');
  const [newGraphSubjectId, setNewGraphSubjectId] = useState('');

  // Initial Data Load
  const loadData = async () => {
    try {
      const [subs, docs, grs, st] = await Promise.all([
        api.getSubjects(),
        api.getDocuments(),
        api.getGraphs(),
        api.getStats().catch(() => null),
      ]);
      setSubjects(subs);
      setDocuments(docs);
      setGraphs(grs);
      if (st) setStats(st);

      if (grs.length > 0 && !activeGraph) {
        const fullGraph = await api.getGraph(grs[0].id);
        setActiveGraph(fullGraph);
      }
    } catch (err) {
      console.error('Failed to load StudyGraph data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleOpenDocument = (doc: DocumentItem, page: number = 1) => {
    setReaderDoc(doc);
    setReaderPage(page);
    setIsReaderOpen(true);
  };

  const handleOpenFolder = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    setView('folder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenGraphWorkspace = async (subjectId?: string) => {
    if (subjectId) {
      const matched = graphs.find((g) => g.subject_id === subjectId);
      if (matched) {
        const fullGraph = await api.getGraph(matched.id);
        setActiveGraph(fullGraph);
      }
    } else if (graphs.length > 0 && !activeGraph) {
      const fullGraph = await api.getGraph(graphs[0].id);
      setActiveGraph(fullGraph);
    }
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGraph = async (graphId: string) => {
    try {
      const full = await api.getGraph(graphId);
      setActiveGraph(full);
    } catch (err) {
      console.error('Failed to switch graph:', err);
    }
  };

  const handleDeleteGraph = async (graphId: string) => {
    await api.deleteGraph(graphId);
    const updatedGraphs = graphs.filter((g) => g.id !== graphId);
    setGraphs(updatedGraphs);
    if (updatedGraphs.length > 0) {
      const nextGraph = await api.getGraph(updatedGraphs[0].id);
      setActiveGraph(nextGraph);
    } else {
      setActiveGraph(null);
      setView('home');
    }
    loadData();
  };

  const handleDeleteDocument = async (docId: string) => {
    await api.deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    loadData();
  };

  const handleCreateSubject = async (data: { title: string; description: string; artwork: string }) => {
    const created = await api.createSubject(data);
    setSubjects((prev) => [created, ...prev]);
  };

  const handleUpdateSubject = async (id: string, data: Partial<Subject>) => {
    const updated = await api.updateSubject(id, data);
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const handleDeleteSubject = async (id: string) => {
    await api.deleteSubject(id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (activeSubjectId === id) {
      setView('home');
      setActiveSubjectId(null);
    }
    loadData();
  };

  const handleCreateGraphSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGraphTitle.trim()) return;

    try {
      const created = await api.createGraph({
        title: newGraphTitle.trim(),
        subject_id: newGraphSubjectId || null,
      });
      setGraphs((prev) => [created, ...prev]);
      setActiveGraph(created);
      setIsCreateGraphOpen(false);
      setNewGraphTitle('');
      setView('workspace');
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // VIEW: FULL-SCREEN GRAPH WORKSPACE
  // ==========================================
  if (view === 'workspace' && activeGraph) {
    const currentSubject = subjects.find((s) => s.id === activeGraph.subject_id) || null;
    return (
      <>
        <GraphWorkspace
          graph={activeGraph}
          subject={currentSubject}
          documents={documents}
          allGraphs={graphs}
          onBackToLibrary={() => setView('home')}
          onSelectGraph={handleSelectGraph}
          onCreateGraph={() => setIsCreateGraphOpen(true)}
          onDeleteGraph={handleDeleteGraph}
          onOpenPdfAtPage={(doc, page) => handleOpenDocument(doc, page)}
        />

        {/* PDF Reader Modal */}
        <PdfReaderModal
          document={readerDoc}
          initialPage={readerPage}
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
        />

        {/* Create Graph Modal */}
        {isCreateGraphOpen && renderCreateGraphModal()}
      </>
    );
  }

  // ==========================================
  // VIEW: DEDICATED FOLDER CONTENTS VIEW
  // ==========================================
  if (view === 'folder' && activeSubjectId) {
    const currentSubject = subjects.find((s) => s.id === activeSubjectId);
    if (currentSubject) {
      return (
        <>
          <FolderContentsView
            subject={currentSubject}
            documents={documents}
            onBack={() => setView('home')}
            onOpenPdf={(doc) => handleOpenDocument(doc)}
            onUploadClick={(subId) => {
              setUploadSubjectId(subId);
              setIsUploadOpen(true);
            }}
            onOpenGraph={(subId) => handleOpenGraphWorkspace(subId)}
            onRenameSubject={(s) => {
              const newTitle = window.prompt('Rename Subject:', s.title);
              if (newTitle && newTitle.trim()) {
                handleUpdateSubject(s.id, { title: newTitle.trim() });
              }
            }}
            onDeleteDocument={handleDeleteDocument}
          />

          {/* PDF Reader Modal */}
          <PdfReaderModal
            document={readerDoc}
            initialPage={readerPage}
            isOpen={isReaderOpen}
            onClose={() => setIsReaderOpen(false)}
          />

          {/* PDF Upload Modal */}
          <PdfUploadModal
            isOpen={isUploadOpen}
            subjects={subjects}
            initialSubjectId={uploadSubjectId}
            onClose={() => setIsUploadOpen(false)}
            onUploadSuccess={(doc) => {
              setDocuments((prev) => [doc, ...prev]);
              loadData();
            }}
          />
        </>
      );
    }
  }

  function renderCreateGraphModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-md bg-[#131317] border border-white/15 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">New Concept Graph</h3>
            <button onClick={() => setIsCreateGraphOpen(false)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateGraphSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">GRAPH TITLE</label>
              <input
                type="text"
                required
                placeholder="e.g. Electromagnetism & Circuits"
                value={newGraphTitle}
                onChange={(e) => setNewGraphTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c22] border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">ASSOCIATED SUBJECT</label>
              <select
                value={newGraphSubjectId}
                onChange={(e) => setNewGraphSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c22] border border-white/10 text-white text-sm focus:outline-none"
              >
                <option value="">No subject (Standalone)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreateGraphOpen(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 shadow-lg"
              >
                Create Graph Canvas
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: HOME CONTINUOUS SCROLLING
  // ==========================================
  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3]">
      {/* 1. Live Dotted-Wave Hero with Interactive Cursor Displacement */}
      <DottedSurface
        onExploreFolders={() => {
          const el = document.getElementById('folder-library');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenWorkspace={() => handleOpenGraphWorkspace()}
      />

      {/* 2. Live Stats & Metrics Ribbon */}
      <div className="border-y border-white/10 bg-[#0d0d12]/80 backdrop-blur-md py-6 px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <p className="text-2xl font-bold tracking-tight text-white">
              {stats?.totalSubjects ?? subjects.length}
            </p>
            <p className="text-[11px] font-mono uppercase text-neutral-400 mt-0.5">
              Subject Collections
            </p>
          </div>
          <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold tracking-tight text-white">
              {stats?.totalDocuments ?? documents.length}
            </p>
            <p className="text-[11px] font-mono uppercase text-neutral-400 mt-0.5">
              Academic PDFs Stored
            </p>
          </div>
          <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold tracking-tight text-white">
              {stats?.totalGraphs ?? graphs.length}
            </p>
            <p className="text-[11px] font-mono uppercase text-neutral-400 mt-0.5">
              Concept Graphs Built
            </p>
          </div>
          <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold tracking-tight text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{stats?.progressPercentage ?? 50}%</span>
            </p>
            <p className="text-[11px] font-mono uppercase text-neutral-400 mt-0.5">
              Syllabus Mastery
            </p>
          </div>
        </div>
      </div>

      {/* 3. Glossy Folder Library & Real Fan-Out Files (Images 2 & 3) */}
      <FolderLibrary
        subjects={subjects}
        documents={documents}
        onOpenFolder={handleOpenFolder}
        onOpenDocument={(doc) => handleOpenDocument(doc)}
        onOpenGraphWorkspace={(subjectId) => handleOpenGraphWorkspace(subjectId)}
        onUploadClick={(subId) => {
          setUploadSubjectId(subId);
          setIsUploadOpen(true);
        }}
        onCreateSubject={handleCreateSubject}
        onUpdateSubject={handleUpdateSubject}
        onDeleteSubject={handleDeleteSubject}
      />

      {/* 4. Graph Workspace Preview Section */}
      <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono tracking-wider text-emerald-400 mb-3">
              <span>SOPHISTAI ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Concept Graph Workspace
            </h2>
            <p className="mt-2 text-sm text-neutral-400 max-w-xl">
              Construct manual topic hierarchies, link nodes to specific PDF pages, and track your revision progress on an infinite academic canvas.
            </p>
          </div>

          <button
            onClick={() => handleOpenGraphWorkspace()}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-neutral-200 transition-all shadow-xl active:scale-95 self-start md:self-auto"
          >
            <Network className="w-4 h-4 text-emerald-600" />
            <span>Launch Full Workspace</span>
          </button>
        </div>

        {/* Workspace Preview Frame */}
        <div
          onClick={() => handleOpenGraphWorkspace()}
          className="relative w-full h-[460px] rounded-3xl border border-white/15 bg-[#0a0a0d] overflow-hidden shadow-2xl cursor-pointer group hover:border-white/30 transition-all"
        >
          {/* Dotted grid overlay */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Realistic preview mock cards */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="flex items-center gap-12 scale-90 sm:scale-100">
              <div className="w-48 p-4 rounded-xl bg-[#15803d] text-white border border-emerald-400/40 shadow-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-xs font-semibold">Kinematics</span>
                </div>
                <p className="text-[10px] text-white/80 mt-1">Branch Completed</p>
              </div>

              <div className="w-56 p-4 rounded-xl bg-[#18181d] text-white ring-2 ring-white shadow-2xl">
                <span className="text-xs font-semibold">Equations of Motion</span>
                <p className="text-[10px] text-emerald-300 font-mono mt-1">
                  p.4 • Kinematics Handbook
                </p>
                <p className="text-[10px] text-neutral-400 mt-2 font-mono">
                  v = u + at, s = ut + 0.5at²
                </p>
              </div>

              <div className="w-48 p-4 rounded-xl bg-[#18181d] text-neutral-300 border border-white/10 shadow-lg">
                <span className="text-xs font-medium">Kinematic Equations</span>
                <p className="text-[10px] text-neutral-500 mt-1">In Progress</p>
              </div>
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 backdrop-blur-[1px] flex items-center justify-center transition-all">
            <div className="px-5 py-3 rounded-full bg-white text-black font-semibold text-xs tracking-wide shadow-2xl flex items-center space-x-2 group-hover:scale-105 transition-transform">
              <Network className="w-4 h-4 text-emerald-600" />
              <span>Click to Enter Interactive Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-8 text-center text-xs font-mono text-neutral-500">
        <p>StudyGraph — The Student Owns the Knowledge Structure.</p>
        <p className="mt-1 text-neutral-600">
          Autonomous manual concept graphs • Authentic PDF.js reading • Zero external AI dependencies
        </p>
      </footer>

      {/* PDF Reader Modal */}
      <PdfReaderModal
        document={readerDoc}
        initialPage={readerPage}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />

      {/* PDF Upload Modal */}
      <PdfUploadModal
        isOpen={isUploadOpen}
        subjects={subjects}
        initialSubjectId={uploadSubjectId}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(doc) => {
          setDocuments((prev) => [doc, ...prev]);
          loadData();
        }}
      />

      {/* Create Graph Modal */}
      {isCreateGraphOpen && renderCreateGraphModal()}
    </div>
  );
}
