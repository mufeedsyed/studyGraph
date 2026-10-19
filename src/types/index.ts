export type NodeStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_revision';

export interface DocumentItem {
  id: string;
  user_id?: string;
  subject_id?: string | null;
  unit_id?: string | null;
  title: string;
  storage_path: string;
  original_filename: string;
  mime_type?: string;
  size_bytes: number;
  page_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  artwork: string;
  accent: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  document_count?: number;
  graph_count?: number;
  documents?: DocumentItem[];
}

export interface Unit {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface GraphNodeData {
  id: string;
  graph_id: string;
  parent_node_id?: string | null;
  title: string;
  description: string;
  notes: string;
  position_x: number;
  position_y: number;
  width?: number | null;
  height?: number | null;
  status: NodeStatus;
  style_settings?: string;
  collapsed?: boolean;
  sort_order?: number;
  linked_doc_id?: string | null;
  linked_page?: number | null;
  linked_doc_title?: string | null;
  // UI callbacks passed via node data
  onAddChild?: (parentId: string) => void;
  onStatusChange?: (nodeId: string, status: NodeStatus) => void;
  onSelectNode?: (nodeId: string) => void;
}

export interface GraphEdgeData {
  id: string;
  graph_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  style_settings?: string;
}

export interface ConceptGraph {
  id: string;
  subject_id?: string | null;
  unit_id?: string | null;
  title: string;
  description: string;
  layout_mode: 'hierarchical' | 'manual' | 'radial';
  settings?: any;
  created_at?: string;
  updated_at?: string;
  node_count?: number;
  completed_node_count?: number;
  nodes?: GraphNodeData[];
  edges?: GraphEdgeData[];
}

export interface ReadingProgress {
  id?: string;
  document_id: string;
  last_page: number;
}

export interface AppStats {
  totalSubjects: number;
  totalDocuments: number;
  totalGraphs: number;
  completedNodes: number;
  totalNodes: number;
  progressPercentage: number;
}
