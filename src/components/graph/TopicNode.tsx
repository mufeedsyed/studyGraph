import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Check, Circle, Clock, AlertCircle, Plus, ChevronDown } from 'lucide-react';
import { GraphNodeData, NodeStatus } from '../../types';

export const TopicNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as GraphNodeData;
  const status = nodeData.status || 'not_started';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isNeedsRevision = status === 'needs_revision';

  const handleStatusCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nodeData.onStatusChange) return;
    const nextStatus: Record<NodeStatus, NodeStatus> = {
      not_started: 'in_progress',
      in_progress: 'completed',
      completed: 'needs_revision',
      needs_revision: 'not_started',
    };
    nodeData.onStatusChange(nodeData.id, nextStatus[status]);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    nodeData.onAddChild?.(nodeData.id);
  };

  return (
    <div
      onClick={() => nodeData.onSelectNode?.(nodeData.id)}
      className={`relative min-w-[190px] max-w-[240px] rounded-xl transition-all duration-200 select-none group ${
        isCompleted
          ? 'bg-[#15803d] text-white shadow-[0_6px_20px_rgba(21,128,61,0.35)] border border-emerald-400/40'
          : 'bg-[#18181d] text-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-white/10 hover:border-white/20'
      } ${
        selected
          ? 'ring-2 ring-white shadow-[0_0_0_2px_#ffffff,0_10px_30px_rgba(0,0,0,0.8)]'
          : ''
      }`}
    >
      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-neutral-400 !border-2 !border-[#080808] transition-transform group-hover:scale-125"
      />

      {/* Node Content Header */}
      <div className="px-3.5 py-3 flex items-center justify-between gap-2.5">
        {/* Status Indicator Icon (Matches Screenshot 4) */}
        <button
          onClick={handleStatusCycle}
          title={`Status: ${status.replace('_', ' ')}. Click to cycle.`}
          className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-black/20 text-white'
              : isInProgress
              ? 'text-amber-400 bg-amber-400/10'
              : isNeedsRevision
              ? 'text-rose-400 bg-rose-400/10'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          {isCompleted ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : isInProgress ? (
            <Clock className="w-3.5 h-3.5" />
          ) : isNeedsRevision ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-neutral-500" />
          )}
        </button>

        {/* Node Title */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium tracking-tight truncate leading-tight">
            {nodeData.title || 'Untitled Topic'}
          </p>
          {nodeData.linked_doc_title && (
            <p className="text-[10px] text-emerald-300/80 truncate mt-0.5 font-mono">
              p.{nodeData.linked_page || 1} • {nodeData.linked_doc_title}
            </p>
          )}
        </div>

        {/* Action Controls: Plus Button to Add Child Branch */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddChild}
            title="Add child topic branch"
            className="w-5 h-5 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Unfinished node subtle chevron/toggle */}
        {!isCompleted && (
          <div className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-neutral-400 !border-2 !border-[#080808] transition-transform group-hover:scale-125"
      />
    </div>
  );
});

TopicNode.displayName = 'TopicNode';
