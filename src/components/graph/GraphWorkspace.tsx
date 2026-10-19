import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Save, Plus, Share2, Layers, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { ConceptGraph, GraphNodeData, GraphEdgeData, NodeStatus, DocumentItem, Subject } from '../../types';
import { SyllabusTree } from './SyllabusTree';
import { ConceptGraphCanvas } from './ConceptGraphCanvas';
import { TopicDetailsPanel } from './TopicDetailsPanel';
import { api } from '../../api/client';

interface GraphWorkspaceProps {
  graph: ConceptGraph;
  subject?: Subject | null;
  documents: DocumentItem[];
  allGraphs: ConceptGraph[];
  onBackToLibrary: () => void;
  onSelectGraph: (graphId: string) => void;
  onCreateGraph: () => void;
  onOpenPdfAtPage: (doc: DocumentItem, pageNumber: number) => void;
}

export const GraphWorkspace: React.FC<GraphWorkspaceProps> = ({
  graph,
  subject,
  documents,
  allGraphs,
  onBackToLibrary,
  onSelectGraph,
  onCreateGraph,
  onOpenPdfAtPage,
}) => {
  const [nodes, setNodes] = useState<GraphNodeData[]>(graph.nodes || []);
  const [edges, setEdges] = useState<GraphEdgeData[]>(graph.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    graph.nodes && graph.nodes.length > 0 ? graph.nodes[0].id : null
  );

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Debounced auto-save timer ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when graph prop changes
  useEffect(() => {
    setNodes(graph.nodes || []);
    setEdges(graph.edges || []);
    if (graph.nodes && graph.nodes.length > 0) {
      // Find Kinematic Equations or first node
      const defaultNode = graph.nodes.find(n => n.title.includes('Kinematic Equations')) || graph.nodes[0];
      setSelectedNodeId(defaultNode.id);
    }
  }, [graph]);

  // Persist graph nodes and edges to backend with debouncing
  const triggerPersist = useCallback(
    (newNodes: GraphNodeData[], newEdges: GraphEdgeData[]) => {
      setSaveStatus('unsaved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setSaveStatus('saving');
          await api.syncGraph(graph.id, newNodes, newEdges);
          setSaveStatus('saved');
        } catch (err) {
          console.error('Auto-save error:', err);
          setSaveStatus('unsaved');
        }
      }, 600);
    },
    [graph.id]
  );

  // Status toggle handler
  const handleStatusChange = useCallback(
    (nodeId: string, status: NodeStatus) => {
      setNodes((prev) => {
        const updated = prev.map((n) => (n.id === nodeId ? { ...n, status } : n));
        triggerPersist(updated, edges);
        return updated;
      });
    },
    [edges, triggerPersist]
  );

  // Add child node handler
  const handleAddChildNode = useCallback(
    (parentId: string | null) => {
      const parentNode = parentId ? nodes.find((n) => n.id === parentId) : null;
      const newNodeId = `node-${Date.now()}`;
      const defaultX = parentNode ? parentNode.position_x + 260 : 120;
      const defaultY = parentNode ? parentNode.position_y + (Math.random() * 80 - 40) : 240;

      const newNode: GraphNodeData = {
        id: newNodeId,
        graph_id: graph.id,
        parent_node_id: parentId,
        title: parentId ? 'New Subtopic' : 'New Concept',
        description: '',
        notes: '',
        position_x: defaultX,
        position_y: defaultY,
        status: 'not_started',
      };

      const updatedNodes = [...nodes, newNode];
      let updatedEdges = [...edges];

      if (parentId) {
        const newEdge: GraphEdgeData = {
          id: `edge-${Date.now()}`,
          graph_id: graph.id,
          source_node_id: parentId,
          target_node_id: newNodeId,
          edge_type: 'smoothstep',
        };
        updatedEdges.push(newEdge);
      }

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setSelectedNodeId(newNodeId);
      triggerPersist(updatedNodes, updatedEdges);
    },
    [graph.id, nodes, edges, triggerPersist]
  );

  // Update node details from right panel
  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<GraphNodeData>) => {
      setNodes((prev) => {
        const updated = prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n));
        triggerPersist(updated, edges);
        return updated;
      });
    },
    [edges, triggerPersist]
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="relative w-full h-screen bg-[#080808] flex flex-col overflow-hidden select-none">
      {/* ============================================================== */}
      {/* WORKSPACE TOP BAR (Matching SophistAI Screenshot 4)           */}
      {/* ============================================================== */}
      <header className="h-14 bg-[#121216] border-b border-white/10 px-5 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Back to Library & Breadcrumb */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onBackToLibrary}
            className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Library</span>
          </button>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* App Brand & Graph Title */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#18181f] border border-white/15 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              StudyGraph
            </span>
          </div>

          <span className="text-neutral-500 text-xs">/</span>

          {/* Graph Selector Dropdown */}
          <select
            value={graph.id}
            onChange={(e) => onSelectGraph(e.target.value)}
            className="bg-[#18181d] border border-white/10 text-xs text-neutral-200 font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-white/20 truncate max-w-[200px]"
          >
            {allGraphs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        {/* Center / Right: Save Status & Actions */}
        <div className="flex items-center space-x-4">
          {/* Save Status Indicator */}
          <div className="flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
            {saveStatus === 'saving' ? (
              <span className="flex items-center space-x-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Saving...</span>
              </span>
            ) : saveStatus === 'unsaved' ? (
              <span className="flex items-center space-x-1.5 text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span>Unsaved changes</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Saved</span>
              </span>
            )}
          </div>

          {/* New Graph Button */}
          <button
            onClick={onCreateGraph}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Graph</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* THREE-PANEL ACADEMIC WORKSPACE BODY                            */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL: Syllabus Tree Navigation */}
        <SyllabusTree
          graphTitle={graph.title}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          isOpen={leftPanelOpen}
          onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onAddChildNode={handleAddChildNode}
        />

        {/* CENTER PANEL: Interactive Graph Canvas */}
        <div className="flex-1 h-full relative overflow-hidden">
          <ConceptGraphCanvas
            initialNodes={nodes}
            initialEdges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onStatusChange={handleStatusChange}
            onAddChildNode={handleAddChildNode}
            onNodesChangePersist={(updated) => {
              setNodes(updated);
              triggerPersist(updated, edges);
            }}
            onEdgesChangePersist={(updated) => {
              setEdges(updated);
              triggerPersist(nodes, updated);
            }}
          />
        </div>

        {/* RIGHT PANEL: Topic Details, Formulas & Notes */}
        <TopicDetailsPanel
          selectedNode={selectedNode}
          documents={documents}
          isOpen={rightPanelOpen}
          onToggle={() => setRightPanelOpen(!rightPanelOpen)}
          onUpdateNode={handleUpdateNode}
          onOpenPdfAtPage={onOpenPdfAtPage}
        />
      </div>
    </div>
  );
};
