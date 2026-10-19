import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'studygraph.db');

export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      artwork TEXT DEFAULT 'marble-1',
      accent TEXT DEFAULT '#22c55e',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      subject_id TEXT,
      unit_id TEXT,
      title TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/pdf',
      size_bytes INTEGER DEFAULT 0,
      page_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS graphs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      subject_id TEXT,
      unit_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      layout_mode TEXT DEFAULT 'hierarchical',
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      graph_id TEXT NOT NULL,
      parent_node_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 0,
      width REAL,
      height REAL,
      status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'needs_revision'
      style_settings TEXT DEFAULT '{}',
      collapsed INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS graph_edges (
      id TEXT PRIMARY KEY,
      graph_id TEXT NOT NULL,
      source_node_id TEXT NOT NULL,
      target_node_id TEXT NOT NULL,
      edge_type TEXT DEFAULT 'default',
      style_settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE,
      FOREIGN KEY (source_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_graph_links (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      graph_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS node_document_references (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      page_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      document_id TEXT NOT NULL UNIQUE,
      last_page INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_graph ON graph_nodes(graph_id);
    CREATE INDEX IF NOT EXISTS idx_edges_graph ON graph_edges(graph_id);
    CREATE INDEX IF NOT EXISTS idx_docs_subject ON documents(subject_id);
  `);

  // Run seed ONLY on first install using persistent schema_meta
  const metaStmt = db.prepare("SELECT value FROM schema_meta WHERE key = 'seeded'");
  const isSeeded = metaStmt.get();

  if (!isSeeded) {
    seedInitialAcademicData();
    db.prepare("INSERT INTO schema_meta (key, value) VALUES ('seeded', 'true')").run();
  }
}

function seedInitialAcademicData() {
  const insertSubject = db.prepare(`
    INSERT INTO subjects (id, title, description, artwork, accent, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const physicsId = 'sub-physics-2';
  insertSubject.run(physicsId, 'Physics 2', 'Classical mechanics, kinematics, thermodynamics and electromagnetism', 'marble-1', '#22c55e', 0);
  insertSubject.run('sub-java', 'Java Programming', 'Object-oriented programming, concurrency, collections & JVM internals', 'marble-2', '#3b82f6', 1);
  insertSubject.run('sub-dsa', 'Data Structures & Algorithms', 'Trees, graphs, dynamic programming, sorting and asymptotic analysis', 'marble-3', '#f59e0b', 2);
  insertSubject.run('sub-digital', 'Digital Electronics', 'Combinational circuits, sequential logic, flip-flops, and FPGA design', 'marble-4', '#ec4899', 3);

  // Seed Units for Physics 2
  const insertUnit = db.prepare(`
    INSERT INTO units (id, subject_id, title, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUnit.run('unit-mechanics', physicsId, 'Unit 1: Kinematics & Dynamics', 'Motion in one and multi-dimensions', 0);
  insertUnit.run('unit-fields', physicsId, 'Unit 2: Electricity & Magnetism', 'Electric fields, Gauss law, magnetic induction', 1);

  // Seed Physics 2 Graph (Exact match to SophistAI Reference Screenshot!)
  const graphId = 'graph-physics-2-syllabus';
  const insertGraph = db.prepare(`
    INSERT INTO graphs (id, subject_id, unit_id, title, description, layout_mode)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertGraph.run(graphId, physicsId, 'unit-mechanics', 'Physics 2 Syllabus', 'Comprehensive concept map for kinematics, dynamics, and motion analysis', 'hierarchical');

  // Insert nodes matching SophistAI screenshot
  const insertNode = db.prepare(`
    INSERT INTO graph_nodes (id, graph_id, parent_node_id, title, description, notes, position_x, position_y, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Root branch: Kinematics
  insertNode.run('node-root-kinematics', graphId, null, 'Kinematics', 'Branch covering motion without forces', 'Kinematics is the branch of classical mechanics that describes the motion of points, bodies (objects), and systems of bodies without considering the forces that cause them to move.', 80, 240, 'completed', 0);
  insertNode.run('node-root-dynamics', graphId, null, 'Dynamics', 'Branch covering forces and torques', 'Dynamics studies the forces and torques that govern the motion of objects, building upon Newton\'s laws of motion.', 80, 360, 'not_started', 1);

  // Level 1 children of Kinematics
  insertNode.run('node-kinematics-1', graphId, 'node-root-kinematics', 'Kinematics', 'Fundamental motion parameters', 'Parameters include position, displacement, velocity, acceleration, and time.', 340, 100, 'completed', 0);
  insertNode.run('node-describing-motion', graphId, 'node-root-kinematics', 'Describing Motion', 'Frame of reference and coordinates', 'Motion is relative and must always be defined with respect to an inertial reference frame.', 340, 200, 'completed', 1);
  insertNode.run('node-equations-motion', graphId, 'node-root-kinematics', 'Equations of Motion', 'Mathematical relationships for constant acceleration', 'The equations of motion are a fundamental concept in physics, describing how objects move and respond to forces. Understanding these equations is crucial for predicting and analyzing the motion of various systems, from simple projectiles to complex mechanical systems.', 340, 320, 'in_progress', 2);
  insertNode.run('node-relative-motion', graphId, 'node-root-kinematics', 'Relative Motion', 'Transformations between moving frames', 'Galilean relativity and relative velocity vector addition: v_AB = v_A - v_B.', 340, 430, 'not_started', 3);

  // Level 2 children of Equations of Motion (matching right panel details in screenshot!)
  const notesKinematicEq = `### Kinematic Equations

The equations of motion are a fundamental concept in physics, describing how objects move and respond to forces. Understanding these equations is crucial for predicting and analyzing the motion of various systems, from simple projectiles to complex mechanical systems.

---

### Deriving the Kinematic Equations

To derive the kinematic equations, we start with the definitions of velocity and acceleration.

Velocity is defined as the rate of change of displacement:
$$v = \\frac{ds}{dt}$$

Acceleration is defined as the rate of change of velocity:
$$a = \\frac{dv}{dt}$$

For an object moving with constant acceleration, we can integrate the acceleration to obtain the velocity as a function of time:
$$v = u + at$$

By integrating the velocity, we can obtain the displacement as a function of time:
$$s = ut + \\frac{1}{2}at^2$$

The other two kinematic equations can be derived by manipulating these equations:
$$v^2 = u^2 + 2as$$
$$s = \\left(\\frac{u + v}{2}\\right)t$$

---

### Key Applications
- 1D linear trajectory prediction
- Free fall under gravitational acceleration ($g = 9.81\\ \\text{m/s}^2$)
- Projectile range and maximum altitude calculations`;

  insertNode.run('node-eq-1', graphId, 'node-equations-motion', 'Equations of Motion', 'General ODE formulation', 'Formulated through differential calculus linking coordinates and time.', 600, 190, 'not_started', 0);
  insertNode.run('node-kinematic-eq', graphId, 'node-equations-motion', 'Kinematic Equations', 'Derived constant acceleration equations', notesKinematicEq, 600, 280, 'in_progress', 1);
  insertNode.run('node-applying-eq', graphId, 'node-equations-motion', 'Applying the Kinematic Equations', 'Practical problem solving techniques', 'Techniques for choosing suitable equations based on knowns and unknowns in exam problems.', 600, 380, 'not_started', 2);
  insertNode.run('node-relative-motion-sub', graphId, 'node-equations-motion', 'Relative Motion and Kinematics', 'Combined relative motion analysis', 'Vector decomposition in multi-axis motion.', 600, 480, 'not_started', 3);

  // Insert Edges
  const insertEdge = db.prepare(`
    INSERT INTO graph_edges (id, graph_id, source_node_id, target_node_id, edge_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertEdge.run('edge-1', graphId, 'node-root-kinematics', 'node-kinematics-1', 'smoothstep');
  insertEdge.run('edge-2', graphId, 'node-root-kinematics', 'node-describing-motion', 'smoothstep');
  insertEdge.run('edge-3', graphId, 'node-root-kinematics', 'node-equations-motion', 'smoothstep');
  insertEdge.run('edge-4', graphId, 'node-root-kinematics', 'node-relative-motion', 'smoothstep');

  insertEdge.run('edge-5', graphId, 'node-equations-motion', 'node-eq-1', 'smoothstep');
  insertEdge.run('edge-6', graphId, 'node-equations-motion', 'node-kinematic-eq', 'smoothstep');
  insertEdge.run('edge-7', graphId, 'node-equations-motion', 'node-applying-eq', 'smoothstep');
  insertEdge.run('edge-8', graphId, 'node-equations-motion', 'node-relative-motion-sub', 'smoothstep');

  // Cross-link between Relative Motion and Relative Motion and Kinematics
  insertEdge.run('edge-cross-1', graphId, 'node-relative-motion', 'node-relative-motion-sub', 'smoothstep');

  // Seed documents matching folder references
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, subject_id, title, storage_path, original_filename, size_bytes, page_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertDoc.run('doc-contract', 'sub-physics-2', 'Kinematics_Handbook.pdf', 'sample-handbook.pdf', 'Kinematics_Handbook.pdf', 327680, 18);
  insertDoc.run('doc-invoices', 'sub-physics-2', 'Dynamics_Lecture_Notes.pdf', 'sample-lecture.pdf', 'Dynamics_Lecture_Notes.pdf', 1048576, 32);
  insertDoc.run('doc-java-oop', 'sub-java', 'Java_Concurrency_in_Practice.pdf', 'sample-java.pdf', 'Java_Concurrency_in_Practice.pdf', 2150000, 42);
  insertDoc.run('doc-dsa-trees', 'sub-dsa', 'CLRS_Binary_Search_Trees.pdf', 'sample-clrs.pdf', 'CLRS_Binary_Search_Trees.pdf', 1890000, 24);

  // Link node to document and page
  const insertRef = db.prepare(`
    INSERT INTO node_document_references (id, node_id, document_id, page_number)
    VALUES (?, ?, ?, ?)
  `);
  insertRef.run('ref-1', 'node-kinematic-eq', 'doc-contract', 4);
}
