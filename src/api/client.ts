import { Subject, DocumentItem, ConceptGraph, GraphNodeData, GraphEdgeData, AppStats } from '../types';

const API_BASE = 'https://studygraph-cfh8.com/api';
//https://studygraph-cfh8.onrender.com/

export const api = {
  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const res = await fetch(`${API_BASE}/subjects`);
    if (!res.ok) throw new Error('Failed to fetch subjects');
    return res.json();
  },

  async createSubject(data: { title: string; description?: string; artwork?: string; accent?: string }): Promise<Subject> {
    const res = await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create subject');
    return res.json();
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    const res = await fetch(`${API_BASE}/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update subject');
    return res.json();
  },

  async deleteSubject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/subjects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete subject');
  },

  // Documents
  async getDocuments(subjectId?: string): Promise<DocumentItem[]> {
    const url = subjectId ? `${API_BASE}/documents?subjectId=${encodeURIComponent(subjectId)}` : `${API_BASE}/documents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(file: File, subjectId?: string, title?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (subjectId) formData.append('subject_id', subjectId);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },

  async updateDocument(id: string, data: { title?: string; subject_id?: string; page_count?: number }): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  // Graphs
  async getGraphs(subjectId?: string): Promise<ConceptGraph[]> {
    const url = subjectId ? `${API_BASE}/graphs?subjectId=${encodeURIComponent(subjectId)}` : `${API_BASE}/graphs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch graphs');
    return res.json();
  },

  async getGraph(id: string): Promise<ConceptGraph> {
    const res = await fetch(`${API_BASE}/graphs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch graph');
    return res.json();
  },

  async createGraph(data: { title: string; description?: string; subject_id?: string | null; layout_mode?: string }): Promise<ConceptGraph> {
    const res = await fetch(`${API_BASE}/graphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create graph');
    return res.json();
  },

  async updateGraph(id: string, data: Partial<ConceptGraph>): Promise<ConceptGraph> {
    const res = await fetch(`${API_BASE}/graphs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update graph');
    return res.json();
  },

  async deleteGraph(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/graphs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete graph');
  },

  // Atomic sync for nodes and edges
  async syncGraph(graphId: string, nodes: GraphNodeData[], edges: GraphEdgeData[]): Promise<{ success: boolean; timestamp: string }> {
    const res = await fetch(`${API_BASE}/graphs/${graphId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges }),
    });
    if (!res.ok) throw new Error('Failed to sync graph changes');
    return res.json();
  },

  // Reading Progress
  async getReadingProgress(docId: string): Promise<{ document_id: string; last_page: number }> {
    const res = await fetch(`${API_BASE}/reading-progress/${docId}`);
    if (!res.ok) return { document_id: docId, last_page: 1 };
    return res.json();
  },

  async saveReadingProgress(docId: string, page: number): Promise<void> {
    await fetch(`${API_BASE}/reading-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId, last_page: page }),
    });
  },

  // Stats
  async getStats(): Promise<AppStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }
};
