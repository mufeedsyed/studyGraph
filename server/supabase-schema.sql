-- StudyGraph Supabase Migration & RLS Policies
-- Enables complete multi-tenant, cloud-synced deployment with PostgreSQL and Row-Level Security

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own profile" 
  ON public.profiles FOR ALL USING (auth.uid() = id);

-- 2. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  artwork TEXT DEFAULT 'marble-1',
  accent TEXT DEFAULT '#22c55e',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own subjects" 
  ON public.subjects FOR ALL USING (auth.uid() = user_id);

-- 3. Units
CREATE TABLE IF NOT EXISTS public.units (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own units" 
  ON public.units FOR ALL USING (auth.uid() = user_id);

-- 4. Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT DEFAULT 'application/pdf',
  size_bytes BIGINT DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own documents" 
  ON public.documents FOR ALL USING (auth.uid() = user_id);

-- 5. Graphs
CREATE TABLE IF NOT EXISTS public.graphs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  layout_mode TEXT DEFAULT 'hierarchical',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.graphs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own graphs" 
  ON public.graphs FOR ALL USING (auth.uid() = user_id);

-- 6. Graph Nodes
CREATE TABLE IF NOT EXISTS public.graph_nodes (
  id TEXT PRIMARY KEY,
  graph_id TEXT REFERENCES public.graphs(id) ON DELETE CASCADE NOT NULL,
  parent_node_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC,
  height NUMERIC,
  status TEXT DEFAULT 'not_started',
  style_settings JSONB DEFAULT '{}'::jsonb,
  collapsed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own graph nodes" 
  ON public.graph_nodes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.graphs WHERE id = graph_nodes.graph_id AND user_id = auth.uid())
  );

-- 7. Graph Edges
CREATE TABLE IF NOT EXISTS public.graph_edges (
  id TEXT PRIMARY KEY,
  graph_id TEXT REFERENCES public.graphs(id) ON DELETE CASCADE NOT NULL,
  source_node_id TEXT REFERENCES public.graph_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id TEXT REFERENCES public.graph_nodes(id) ON DELETE CASCADE NOT NULL,
  edge_type TEXT DEFAULT 'smoothstep',
  style_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own graph edges" 
  ON public.graph_edges FOR ALL USING (
    EXISTS (SELECT 1 FROM public.graphs WHERE id = graph_edges.graph_id AND user_id = auth.uid())
  );

-- 8. Reading Progress
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  document_id TEXT REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL UNIQUE,
  last_page INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own reading progress" 
  ON public.reading_progress FOR ALL USING (auth.uid() = user_id);
