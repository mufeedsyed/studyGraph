import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure database and uploads exist
initDatabase();
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed.'));
    }
  }
});

// Serve uploaded PDFs with range request support (essential for PDF.js streaming)
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/pdf',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'application/pdf',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// ==========================================
// SUBJECTS API
// ==========================================
app.get('/api/subjects', (req, res) => {
  try {
    const subjects = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM documents WHERE subject_id = s.id) AS document_count,
        (SELECT COUNT(*) FROM graphs WHERE subject_id = s.id) AS graph_count
      FROM subjects s
      ORDER BY s.sort_order ASC, s.created_at DESC
    `).all();

    // Attach documents list to each subject for the folder stacked fanning display!
    const docsStmt = db.prepare(`SELECT * FROM documents WHERE subject_id = ? ORDER BY created_at DESC LIMIT 6`);
    const enriched = subjects.map(s => ({
      ...s,
      documents: docsStmt.all(s.id)
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subjects', (req, res) => {
  try {
    const { title, description = '', artwork = 'marble-1', accent = '#22c55e' } = req.body;
    if (!title) return res.status(400).json({ error: 'Subject title is required' });

    const id = 'sub-' + Date.now();
    const count = db.prepare('SELECT COUNT(*) as c FROM subjects').get().c;
    
    db.prepare(`
      INSERT INTO subjects (id, title, description, artwork, accent, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, description, artwork, accent, count);

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    res.status(201).json({ ...subject, document_count: 0, graph_count: 0, documents: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/subjects/:id', (req, res) => {
  try {
    const { title, description, artwork, accent } = req.body;
    db.prepare(`
      UPDATE subjects 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          artwork = COALESCE(?, artwork),
          accent = COALESCE(?, accent),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, artwork, accent, req.params.id);

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subjects/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DOCUMENTS API
// ==========================================
app.get('/api/documents', (req, res) => {
  try {
    const { subjectId } = req.query;
    let docs;
    if (subjectId) {
      docs = db.prepare('SELECT * FROM documents WHERE subject_id = ? ORDER BY created_at DESC').all(subjectId);
    } else {
      docs = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    }
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { subject_id, title } = req.body;
    const id = 'doc-' + Date.now();
    const docTitle = title || req.file.originalname;
    const storagePath = req.file.filename;
    const sizeBytes = req.file.size;

    db.prepare(`
      INSERT INTO documents (id, subject_id, title, storage_path, original_filename, size_bytes, page_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, subject_id || null, docTitle, storagePath, req.file.originalname, sizeBytes, 1);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.status(201).json(doc);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documents/:id', (req, res) => {
  try {
    const { title, subject_id, page_count } = req.body;
    db.prepare(`
      UPDATE documents 
      SET title = COALESCE(?, title),
          subject_id = COALESCE(?, subject_id),
          page_count = COALESCE(?, page_count),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, subject_id, page_count, req.params.id);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    const doc = db.prepare('SELECT storage_path FROM documents WHERE id = ?').get(req.params.id);
    if (doc && doc.storage_path) {
      const fullPath = path.join(uploadsDir, doc.storage_path);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { /* ignore */ }
      }
    }
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GRAPHS API
// ==========================================
app.get('/api/graphs', (req, res) => {
  try {
    const { subjectId } = req.query;
    let graphs;
    if (subjectId) {
      graphs = db.prepare(`
        SELECT g.*, 
          (SELECT COUNT(*) FROM graph_nodes WHERE graph_id = g.id) AS node_count,
          (SELECT COUNT(*) FROM graph_nodes WHERE graph_id = g.id AND status = 'completed') AS completed_node_count
        FROM graphs g 
        WHERE g.subject_id = ?
        ORDER BY g.updated_at DESC
      `).all(subjectId);
    } else {
      graphs = db.prepare(`
        SELECT g.*, 
          (SELECT COUNT(*) FROM graph_nodes WHERE graph_id = g.id) AS node_count,
          (SELECT COUNT(*) FROM graph_nodes WHERE graph_id = g.id AND status = 'completed') AS completed_node_count
        FROM graphs g 
        ORDER BY g.updated_at DESC
      `).all();
    }
    res.json(graphs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/graphs/:id', (req, res) => {
  try {
    const graph = db.prepare('SELECT * FROM graphs WHERE id = ?').get(req.params.id);
    if (!graph) return res.status(404).json({ error: 'Graph not found' });

    const nodes = db.prepare(`
      SELECT n.*, 
        r.document_id as linked_doc_id,
        r.page_number as linked_page,
        d.title as linked_doc_title
      FROM graph_nodes n
      LEFT JOIN node_document_references r ON r.node_id = n.id
      LEFT JOIN documents d ON d.id = r.document_id
      WHERE n.graph_id = ?
      ORDER BY n.sort_order ASC, n.created_at ASC
    `).all(req.params.id);

    const edges = db.prepare('SELECT * FROM graph_edges WHERE graph_id = ?').all(req.params.id);

    res.json({
      ...graph,
      nodes,
      edges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/graphs', (req, res) => {
  try {
    const { title, description = '', subject_id = null, layout_mode = 'hierarchical' } = req.body;
    if (!title) return res.status(400).json({ error: 'Graph title is required' });

    const id = 'graph-' + Date.now();
    db.prepare(`
      INSERT INTO graphs (id, subject_id, title, description, layout_mode)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, subject_id, title, description, layout_mode);

    // Create an initial root node
    const rootNodeId = 'node-root-' + Date.now();
    db.prepare(`
      INSERT INTO graph_nodes (id, graph_id, title, description, position_x, position_y, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(rootNodeId, id, title, 'Root concept branch', 120, 240, 'not_started');

    const graph = db.prepare('SELECT * FROM graphs WHERE id = ?').get(id);
    const nodes = db.prepare('SELECT * FROM graph_nodes WHERE graph_id = ?').all(id);

    res.status(201).json({ ...graph, nodes, edges: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/graphs/:id', (req, res) => {
  try {
    const { title, description, layout_mode, settings } = req.body;
    db.prepare(`
      UPDATE graphs
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          layout_mode = COALESCE(?, layout_mode),
          settings = COALESCE(?, settings),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, layout_mode, settings ? JSON.stringify(settings) : null, req.params.id);

    const graph = db.prepare('SELECT * FROM graphs WHERE id = ?').get(req.params.id);
    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/graphs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM graphs WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ATOMIC GRAPH SYNC (Autosave & Persistence)
// ==========================================
app.post('/api/graphs/:id/sync', (req, res) => {
  const graphId = req.params.id;
  const { nodes = [], edges = [] } = req.body;

  const transaction = db.transaction(() => {
    // Touch graph timestamp
    db.prepare('UPDATE graphs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(graphId);

    // Upsert or delete nodes
    const existingNodes = db.prepare('SELECT id FROM graph_nodes WHERE graph_id = ?').all(graphId).map(n => n.id);
    const newNodeIds = new Set(nodes.map(n => n.id));

    // Remove deleted nodes
    for (const exId of existingNodes) {
      if (!newNodeIds.has(exId)) {
        db.prepare('DELETE FROM graph_nodes WHERE id = ?').run(exId);
      }
    }

    // Upsert nodes
    const upsertNode = db.prepare(`
      INSERT INTO graph_nodes (id, graph_id, parent_node_id, title, description, notes, position_x, position_y, status, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        parent_node_id = excluded.parent_node_id,
        title = excluded.title,
        description = excluded.description,
        notes = excluded.notes,
        position_x = excluded.position_x,
        position_y = excluded.position_y,
        status = excluded.status,
        sort_order = excluded.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `);

    const upsertDocRef = db.prepare(`
      INSERT INTO node_document_references (id, node_id, document_id, page_number)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        document_id = excluded.document_id,
        page_number = excluded.page_number
    `);

    for (const n of nodes) {
      upsertNode.run(
        n.id,
        graphId,
        n.parent_node_id || null,
        n.title || 'Untitled Node',
        n.description || '',
        n.notes || '',
        n.position_x ?? 0,
        n.position_y ?? 0,
        n.status || 'not_started',
        n.sort_order ?? 0
      );

      if (n.linked_doc_id) {
        const refId = `ref-${n.id}`;
        upsertDocRef.run(refId, n.id, n.linked_doc_id, n.linked_page || 1);
      } else {
        db.prepare('DELETE FROM node_document_references WHERE node_id = ?').run(n.id);
      }
    }

    // Replace edges
    db.prepare('DELETE FROM graph_edges WHERE graph_id = ?').run(graphId);
    const insertEdge = db.prepare(`
      INSERT INTO graph_edges (id, graph_id, source_node_id, target_node_id, edge_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const e of edges) {
      insertEdge.run(e.id, graphId, e.source_node_id || e.source, e.target_node_id || e.target, e.edge_type || 'smoothstep');
    }
  });

  try {
    transaction();
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Graph sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// READING PROGRESS
// ==========================================
app.get('/api/reading-progress/:documentId', (req, res) => {
  try {
    const prog = db.prepare('SELECT * FROM reading_progress WHERE document_id = ?').get(req.params.documentId);
    res.json(prog || { document_id: req.params.documentId, last_page: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reading-progress', (req, res) => {
  try {
    const { document_id, last_page } = req.body;
    const id = 'prog-' + document_id;
    db.prepare(`
      INSERT INTO reading_progress (id, document_id, last_page, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(document_id) DO UPDATE SET
        last_page = excluded.last_page,
        updated_at = CURRENT_TIMESTAMP
    `).run(id, document_id, last_page);
    res.json({ success: true, document_id, last_page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// STATS
// ==========================================
app.get('/api/stats', (req, res) => {
  try {
    const totalSubjects = db.prepare('SELECT COUNT(*) as c FROM subjects').get().c;
    const totalDocuments = db.prepare('SELECT COUNT(*) as c FROM documents').get().c;
    const totalGraphs = db.prepare('SELECT COUNT(*) as c FROM graphs').get().c;
    const completedNodes = db.prepare("SELECT COUNT(*) as c FROM graph_nodes WHERE status = 'completed'").get().c;
    const totalNodes = db.prepare("SELECT COUNT(*) as c FROM graph_nodes").get().c;

    res.json({
      totalSubjects,
      totalDocuments,
      totalGraphs,
      completedNodes,
      totalNodes,
      progressPercentage: totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`StudyGraph API server running at http://localhost:${PORT}`);
});
