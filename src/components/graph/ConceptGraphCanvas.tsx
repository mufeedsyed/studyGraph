import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { LayoutGrid, ZoomIn, ZoomOut, Maximize2, MapPin, Undo, Redo, Plus, Sparkles } from 'lucide-react';
import { GraphNodeData, GraphEdgeData, NodeStatus } from '../../types';
import { TopicNode } from './TopicNode';

interface ConceptGraphCanvasProps {
  initialNodes: GraphNodeData[];
  initialEdges: GraphEdgeData[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onStatusChange: (nodeId: string, status: NodeStatus) => void;
  onAddChildNode: (parentId: string) => void;
  onNodesChangePersist: (nodes: GraphNodeData[]) => void;
  onEdgesChangePersist: (edges: GraphEdgeData[]) => void;
}

const nodeTypes = {
  topicNode: TopicNode,
};

// Dagre Hierarchical Layout Helper
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 35,
    ranksep: 90,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition ? nodeWithPosition.x - 110 : node.position.x,
        y: nodeWithPosition ? nodeWithPosition.y - 30 : node.position.y,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const GraphCanvasInner: React.FC<ConceptGraphCanvasProps> = ({
  initialNodes,
  initialEdges,
  selectedNodeId,
  onSelectNode,
  onStatusChange,
  onAddChildNode,
  onNodesChangePersist,
  onEdgesChangePersist,
}) => {
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const [showMinimap, setShowMinimap] = React.useState(false);

  // Convert GraphNodeData[] to React Flow Node[]
  const flowNodes: Node[] = useMemo(() => {
    return initialNodes.map((n) => ({
      id: n.id,
      type: 'topicNode',
      position: { x: n.position_x, y: n.position_y },
      selected: n.id === selectedNodeId,
      data: {
        ...n,
        onAddChild: onAddChildNode,
        onStatusChange,
        onSelectNode,
      },
    }));
  }, [initialNodes, selectedNodeId, onAddChildNode, onStatusChange, onSelectNode]);

  // Convert GraphEdgeData[] to React Flow Edge[]
  const flowEdges: Edge[] = useMemo(() => {
    return initialEdges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      type: 'smoothstep',
      style: {
        stroke: 'rgba(255, 255, 255, 0.28)',
        strokeWidth: 1.5,
      },
    }));
  }, [initialEdges]);

  const [nodes, setNodes] = useNodesState(flowNodes);
  const [edges, setEdges] = useEdgesState(flowEdges);

  // Sync when initialNodes or initialEdges change from parent/backend
  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  // Center on selected node when selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId) {
      const targetNode = nodes.find((n) => n.id === selectedNodeId);
      if (targetNode) {
        setCenter(targetNode.position.x + 100, targetNode.position.y + 30, {
          duration: 600,
          zoom: 1.1,
        });
      }
    }
  }, [selectedNodeId, nodes, setCenter]);

  // Handle Node Changes (Drag, Select, Position)
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  // Persist final node positions on drag stop
  const handleNodeDragStop = useCallback(() => {
    const updated: GraphNodeData[] = nodes.map((n) => {
      const original = initialNodes.find((on) => on.id === n.id);
      return {
        ...(original || (n.data as unknown as GraphNodeData)),
        position_x: n.position.x,
        position_y: n.position.y,
      };
    });
    onNodesChangePersist(updated);
  }, [nodes, initialNodes, onNodesChangePersist]);

  // Handle Edge Changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  // Connect new edge manually by dragging handle
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdgeId = `edge-${Date.now()}`;
      const newFlowEdge: Edge = {
        ...params,
        id: newEdgeId,
        type: 'smoothstep',
        style: { stroke: 'rgba(255, 255, 255, 0.28)', strokeWidth: 1.5 },
      };
      setEdges((eds) => addEdge(newFlowEdge, eds));

      const newEdgesList: GraphEdgeData[] = [
        ...initialEdges,
        {
          id: newEdgeId,
          graph_id: initialNodes[0]?.graph_id || 'default',
          source_node_id: params.source,
          target_node_id: params.target,
          edge_type: 'smoothstep',
        },
      ];
      onEdgesChangePersist(newEdgesList);
    },
    [initialEdges, initialNodes, onEdgesChangePersist, setEdges]
  );

  // Auto Layout using Dagre
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    const updated: GraphNodeData[] = layoutedNodes.map((n) => {
      const orig = initialNodes.find((on) => on.id === n.id);
      return {
        ...(orig || (n.data as unknown as GraphNodeData)),
        position_x: n.position.x,
        position_y: n.position.y,
      };
    });
    onNodesChangePersist(updated);
    setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 50);
  }, [nodes, edges, initialNodes, onNodesChangePersist, setNodes, setEdges, fitView]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0d] overflow-hidden select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        className="touch-none"
      >
        {/* Subtle Academic Dotted Grid Matching Reference */}
        <Background
          color="rgba(255, 255, 255, 0.08)"
          gap={26}
          size={1.1}
        />

        {showMinimap && (
          <MiniMap
            nodeColor={(n) => {
              const d = n.data as unknown as GraphNodeData;
              return d?.status === 'completed' ? '#15803d' : '#26262e';
            }}
            maskColor="rgba(10, 10, 13, 0.85)"
            className="!bg-[#121217] !border !border-white/10 !rounded-xl !bottom-16 !left-4"
          />
        )}
      </ReactFlow>

      {/* Floating Canvas Controls Toolbar (Bottom Left) */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center space-x-1.5 p-1.5 rounded-2xl bg-[#141419]/90 border border-white/10 backdrop-blur-md shadow-2xl">
        <button
          onClick={() => zoomIn({ duration: 300 })}
          title="Zoom In"
          className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => zoomOut({ duration: 300 })}
          title="Zoom Out"
          className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => fitView({ duration: 400, padding: 0.2 })}
          title="Fit Graph to View"
          className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          onClick={handleAutoLayout}
          title="Hierarchical Auto-Layout (Dagre)"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
          <span>Auto Layout</span>
        </button>

        <button
          onClick={() => setShowMinimap(!showMinimap)}
          title="Toggle Minimap"
          className={`p-2 rounded-xl transition-colors ${
            showMinimap ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Node Button (Top Left on Canvas) */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => onAddChildNode(selectedNodeId || '')}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#16161c]/90 hover:bg-[#1f1f26] text-white border border-white/15 text-xs font-medium shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>{selectedNodeId ? 'Add Subtopic' : 'Add Root Node'}</span>
        </button>
      </div>
    </div>
  );
};

export const ConceptGraphCanvas: React.FC<ConceptGraphCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
