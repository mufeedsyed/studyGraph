import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Circle, Clock, Plus, Search, ChevronLeft, FolderKanban } from 'lucide-react';
import { GraphNodeData } from '../../types';

interface SyllabusTreeProps {
  graphTitle: string;
  nodes: GraphNodeData[];
  selectedNodeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectNode: (nodeId: string) => void;
  onAddChildNode: (parentId: string | null) => void;
}

export const SyllabusTree: React.FC<SyllabusTreeProps> = ({
  graphTitle,
  nodes,
  selectedNodeId,
  isOpen,
  onToggle,
  onSelectNode,
  onAddChildNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-20 z-30 p-2.5 rounded-xl bg-[#141418] border border-white/10 text-neutral-400 hover:text-white shadow-xl backdrop-blur-md"
        title="Open Syllabus Tree"
      >
        <FolderKanban className="w-4 h-4 text-emerald-400" />
      </button>
    );
  }

  // Filter nodes if search query is present
  const filteredNodes = searchQuery.trim()
    ? nodes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : nodes;

  // Build root nodes (those without parent) and children mapping
  const rootNodes = filteredNodes.filter(n => !n.parent_node_id);
  const childrenMap = new Map<string, GraphNodeData[]>();

  filteredNodes.forEach(n => {
    if (n.parent_node_id) {
      const list = childrenMap.get(n.parent_node_id) || [];
      list.push(n);
      childrenMap.set(n.parent_node_id, list);
    }
  });

  const toggleBranch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedBranches(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNodeItem = (node: GraphNodeData, level: number = 0) => {
    const children = childrenMap.get(node.id) || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedBranches[node.id];
    const isSelected = selectedNodeId === node.id;
    const isCompleted = node.status === 'completed';
    const isInProgress = node.status === 'in_progress';

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => onSelectNode(node.id)}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          className={`group flex items-center justify-between py-1.5 pr-3 rounded-lg text-xs cursor-pointer transition-colors ${
            isSelected
              ? 'bg-white/15 text-white font-medium border-l-2 border-emerald-400'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => toggleBranch(node.id, e)}
                className="p-0.5 text-neutral-500 hover:text-neutral-300"
              >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            ) : (
              <span className="w-3" />
            )}

            {/* Status icon in tree matching SophistAI */}
            <span className="flex-shrink-0">
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : isInProgress ? (
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Circle className="w-3 h-3 text-neutral-600" />
              )}
            </span>

            <span className="truncate">{node.title}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChildNode(node.id);
            }}
            title="Add subtopic"
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-opacity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="space-y-0.5">
            {children.map(child => renderNodeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 lg:w-72 h-full bg-[#101014] border-r border-white/10 flex flex-col justify-between overflow-hidden z-20">
      {/* Top Header */}
      <div>
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#141418]">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 truncate">
              {graphTitle || 'Syllabus Navigator'}
            </span>
          </div>
          <button
            onClick={onToggle}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#18181d] border border-white/5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {rootNodes.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No matching topics found.
          </div>
        ) : (
          rootNodes.map(node => renderNodeItem(node, 0))
        )}
      </div>

      {/* Bottom Action Button */}
      <div className="p-3 border-t border-white/10 bg-[#141418]">
        <button
          onClick={() => onAddChildNode(null)}
          className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center space-x-2 transition-colors border border-white/5"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add Root Topic</span>
        </button>
      </div>
    </aside>
  );
};
