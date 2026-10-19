# StudyGraph — Master Product Documentation

> **"The Student Owns the Knowledge Structure."**  
> StudyGraph is a desktop-first academic workspace for students to organize PDFs, construct manual concept graphs, and track learning mastery without AI generation.

---

## 1. Visual Systems Implemented

1. **3D Dotted Surface Hero** (`src/components/hero/DottedSurface.tsx`)
   - Real-time Canvas 3D undulating perspective wave of crisp white points.
   - Dual sinusoidal traveling wave mathematics creating ocean-like depth.
   - Respects `prefers-reduced-motion` and automatically pauses off-screen using `IntersectionObserver`.

2. **Glossy Folder Library & Stacked Fan-Out** (`src/components/folder/GlassFolderCard.tsx`, `MarbleArt.tsx`)
   - Authentic folder silhouette with top-left tab, layered sheets, and frosted glass front surface.
   - 6 procedural SVG marble patterns (Violet swirl, Terracotta & Teal, Ice slate, Emerald obsidian, Cyber titanium).
   - Interactive fan-out animation fanning out stacked documents with direct PDF reader triggers.
   - Floating black `+` button for direct uploads and pill `ooo` button for folder operations.

3. **SophistAI Academic Concept Graph Workspace** (`src/components/graph/`)
   - **Left Panel**: Collapsible syllabus navigation tree with nested topics and status checkmarks.
   - **Center Canvas**: React Flow graph with subtle dotted grid background, rectangular dark charcoal nodes, emerald green completed nodes with checkmarks, crisp white outline for selected node, bezier curves, and Dagre hierarchical auto-layout.
   - **Right Panel**: Topic inspector with LaTeX equation rendering via KaTeX ($v = u + at$, $s = ut + \frac{1}{2}at^2$), markdown notes editor, and linked PDF document page references.

4. **Full-Screen Academic PDF Reader** (`src/components/reader/PdfReaderModal.tsx`)
   - Real PDF rendering with PDF.js and byte-range request streaming from backend.
   - Zoom in/out, fit-to-width, fit-to-page, page navigation, and native browser Fullscreen API with Escape key support.
   - Direct jump from graph nodes to specific pages (e.g., page 4 of Kinematics Handbook).
   - Reading progress persistence (`reading_progress` table) restoring last-read page.

5. **Local & Cloud Persistence Engine** (`server/db.js`, `server/index.js`, `server/supabase-schema.sql`)
   - SQLite database using `better-sqlite3` with foreign keys, WAL mode, and atomic graph sync transactions.
   - Multi-part PDF file uploads with multer to local `./uploads` directory.
   - Full Supabase PostgreSQL schema with Row-Level Security (RLS) included in `server/supabase-schema.sql`.

---

## 2. Quickstart & Local Execution

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run both the Express API and Vite web dev server simultaneously
npm run dev
```

- **Web Application**: [http://localhost:5173/](http://localhost:5173/)
- **API Server**: [http://localhost:3001/](http://localhost:3001/)

---

## 3. Project Structure

```
studygraph/
├── uploads/                     # Stored real PDF documents
├── server/
│   ├── db.js                   # SQLite database initialization & academic seed data
│   ├── index.js                # Express API with byte-range streaming & graph sync
│   ├── generate-samples.js     # Multi-page sample PDF generator
│   └── supabase-schema.sql     # Supabase DDL migration script with RLS
├── src/
│   ├── api/
│   │   └── client.ts           # REST API client
│   ├── components/
│   │   ├── hero/
│   │   │   └── DottedSurface.tsx      # 3D perspective dotted wave canvas
│   │   ├── folder/
│   │   │   ├── GlassFolderCard.tsx    # Glossy folder card with fan-out animation
│   │   │   ├── FolderLibrary.tsx      # Subject library grid & modals
│   │   │   └── MarbleArt.tsx          # 6 procedural SVG marble patterns
│   │   ├── graph/
│   │   │   ├── GraphWorkspace.tsx     # SophistAI 3-panel workspace
│   │   │   ├── SyllabusTree.tsx       # Collapsible syllabus navigation tree
│   │   │   ├── ConceptGraphCanvas.tsx # React Flow canvas with dotted grid & Dagre
│   │   │   ├── TopicNode.tsx          # Rectangular charcoal / green completed node
│   │   │   └── TopicDetailsPanel.tsx  # Topic inspector with KaTeX math rendering
│   │   ├── reader/
│   │   │   └── PdfReaderModal.tsx     # Full-screen PDF.js reader with page jump
│   │   └── upload/
│   │       └── PdfUploadModal.tsx     # Drag & drop PDF upload modal
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Main application with continuous scroll & workspace
│   ├── main.tsx
│   └── index.css               # Tailwind CSS & dark theme tokens
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```
