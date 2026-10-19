import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Circle, FileText, ExternalLink, ChevronRight, Edit3, Eye, BookOpen, Link2, Trash2 } from 'lucide-react';
import katex from 'katex';
import { GraphNodeData, NodeStatus, DocumentItem } from '../../types';

interface TopicDetailsPanelProps {
  selectedNode: GraphNodeData | null;
  documents: DocumentItem[];
  isOpen: boolean;
  onToggle: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<GraphNodeData>) => void;
  onDeleteNode?: (nodeId: string) => void;
  onOpenPdfAtPage: (doc: DocumentItem, pageNumber: number) => void;
}

export const TopicDetailsPanel: React.FC<TopicDetailsPanelProps> = ({
  selectedNode,
  documents,
  isOpen,
  onToggle,
  onUpdateNode,
  onDeleteNode,
  onOpenPdfAtPage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<NodeStatus>('not_started');
  const [linkedDocId, setLinkedDocId] = useState<string>('');
  const [linkedPage, setLinkedPage] = useState<number>(1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.title || '');
      setDescription(selectedNode.description || '');
      setNotes(selectedNode.notes || '');
      setStatus(selectedNode.status || 'not_started');
      setLinkedDocId(selectedNode.linked_doc_id || '');
      setLinkedPage(selectedNode.linked_page || 1);
    }
  }, [selectedNode]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-20 z-30 p-2.5 rounded-xl bg-[#141418] border border-white/10 text-neutral-400 hover:text-white shadow-xl backdrop-blur-md"
        title="Open Topic Details"
      >
        <BookOpen className="w-4 h-4 text-emerald-400" />
      </button>
    );
  }

  if (!selectedNode) {
    return (
      <aside className="w-80 lg:w-96 h-full bg-[#101014] border-l border-white/10 flex flex-col justify-between p-6 select-none">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            Topic Inspector
          </span>
          <button onClick={onToggle} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="my-auto text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <BookOpen className="w-6 h-6 text-neutral-500" />
          </div>
          <p className="text-sm font-medium text-neutral-300">No topic selected</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-[220px] mx-auto">
            Click any node on the graph canvas or syllabus tree to review derivations, notes, and references.
          </p>
        </div>
      </aside>
    );
  }

  const handleSave = () => {
    const linkedDoc = documents.find(d => d.id === linkedDocId);
    onUpdateNode(selectedNode.id, {
      title,
      description,
      notes,
      status,
      linked_doc_id: linkedDocId || null,
      linked_page: linkedPage || 1,
      linked_doc_title: linkedDoc ? linkedDoc.title : null,
    });
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: NodeStatus) => {
    setStatus(newStatus);
    onUpdateNode(selectedNode.id, { status: newStatus });
  };

  // Helper to render KaTeX formulas in rich text
  const renderMathContent = (content: string) => {
    if (!content) {
      return (
        <p className="text-xs text-neutral-500 italic">
          No academic notes written yet. Click &quot;Edit Notes&quot; to write derivations or LaTeX equations.
        </p>
      );
    }

    // Split on display math $$...$$ and inline math $...$
    const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
    const parts = content.split(displayMathRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Display math formula
        try {
          const html = katex.renderToString(part.trim(), { displayMode: true, throwOnError: false });
          return (
            <div
              key={index}
              className="my-3 py-2 px-3 bg-white/5 rounded-xl border border-white/10 overflow-x-auto text-emerald-300 text-center text-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <pre key={index} className="text-xs font-mono text-emerald-400">{part}</pre>;
        }
      }

      // Check for markdown headings and inline math $...$
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-2">
          {lines.map((line, lIdx) => {
            if (line.startsWith('### ')) {
              return (
                <h4 key={lIdx} className="text-sm font-semibold text-neutral-200 pt-3 pb-1 border-b border-white/5">
                  {line.replace('### ', '')}
                </h4>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <li key={lIdx} className="text-xs text-neutral-300 ml-4 list-disc">
                  {renderInlineMath(line.replace('- ', ''))}
                </li>
              );
            }
            if (!line.trim()) return <div key={lIdx} className="h-1.5" />;
            return (
              <p key={lIdx} className="text-xs text-neutral-300 leading-relaxed">
                {renderInlineMath(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const renderInlineMath = (text: string) => {
    const inlineMathRegex = /\$([^\$]+)\$/g;
    const segments = text.split(inlineMathRegex);

    return segments.map((seg, sIdx) => {
      if (sIdx % 2 === 1) {
        try {
          const html = katex.renderToString(seg, { displayMode: false, throwOnError: false });
          return <span key={sIdx} className="text-emerald-300 font-mono" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <code key={sIdx} className="text-xs bg-white/10 px-1 rounded">{seg}</code>;
        }
      }
      return seg;
    });
  };

  const activeDoc = documents.find(d => d.id === (selectedNode.linked_doc_id || linkedDocId));

  return (
    <aside className="w-80 lg:w-[410px] h-full bg-[#101014] border-l border-white/10 flex flex-col justify-between overflow-hidden z-20">
      {/* Top Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141418]">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Topic Inspector
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Preview' : 'Edit'}</span>
          </button>

          <button onClick={onToggle} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Topic Title */}
        {isEditing ? (
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">TOPIC TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18181d] border border-white/10 text-white text-base font-semibold focus:outline-none focus:border-white/30"
            />
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed font-normal">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Completion Status Selector */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-2">
            LEARNING STATUS
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStatusChange('completed')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                status === 'completed'
                  ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 shadow-md'
                  : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed</span>
            </button>

            <button
              onClick={() => handleStatusChange('in_progress')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                status === 'in_progress'
                  ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-md'
                  : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>In Progress</span>
            </button>

            <button
              onClick={() => handleStatusChange('not_started')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                status === 'not_started'
                  ? 'bg-neutral-800 border-white/30 text-white'
                  : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Circle className="w-3.5 h-3.5 text-neutral-400" />
              <span>Not Started</span>
            </button>

            <button
              onClick={() => handleStatusChange('needs_revision')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                status === 'needs_revision'
                  ? 'bg-rose-600/30 border-rose-400 text-rose-200 shadow-md'
                  : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Needs Revision</span>
            </button>
          </div>
        </div>

        {/* Linked PDF Reference Card (Direct Jump to Page!) */}
        {isEditing ? (
          <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 space-y-3">
            <label className="block text-[11px] font-mono text-neutral-400">
              ATTACH PDF REFERENCE
            </label>
            <select
              value={linkedDocId}
              onChange={(e) => setLinkedDocId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#1c1c22] border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="">No PDF attached</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            {linkedDocId && (
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  TARGET PAGE NUMBER
                </label>
                <input
                  type="number"
                  min={1}
                  value={linkedPage}
                  onChange={(e) => setLinkedPage(parseInt(e.target.value, 10) || 1)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-[#1c1c22] border border-white/10 text-white text-xs"
                />
              </div>
            )}
          </div>
        ) : (
          activeDoc && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#16161c] to-[#121216] border border-white/15 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Link2 className="w-3 h-3" />
                  <span>Linked Academic Reference</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Page {selectedNode.linked_page || 1}
                </span>
              </div>

              <div className="flex items-center space-x-3 my-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {activeDoc.title}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    PDF • {(activeDoc.size_bytes / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenPdfAtPage(activeDoc, selectedNode.linked_page || 1)}
                className="w-full mt-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center justify-center space-x-2 transition-colors border border-white/10"
              >
                <span>Jump to Page {selectedNode.linked_page || 1}</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          )
        )}

        {/* Academic Notes & LaTeX Equations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              ACADEMIC NOTES & FORMULAS
            </label>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={10}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write markdown and LaTeX equations, e.g. $$v = u + at$$, $s = ut + \frac{1}{2}at^2$"
                className="w-full px-3.5 py-3 rounded-xl bg-[#18181d] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-white/30 resize-y leading-relaxed"
              />
              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-lg"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#141418] border border-white/10 shadow-inner">
              {renderMathContent(notes)}
            </div>
          )}
        </div>

        {/* Delete Node Section */}
        {onDeleteNode && (
          <div className="pt-4 border-t border-white/10">
            {confirmDelete ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <p className="text-[11px] text-rose-300 font-medium">
                  Delete this concept node and all its connections?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      onDeleteNode(selectedNode.id);
                      setConfirmDelete(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Concept Node</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
