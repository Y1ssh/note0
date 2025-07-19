-- Note0 Database Schema for Supabase
-- This script creates all necessary tables, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create notes table with hierarchical support
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL DEFAULT 'Untitled Note',
    content TEXT DEFAULT '',
    summary TEXT,
    parent_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    word_count INTEGER NOT NULL DEFAULT 0,
    character_count INTEGER NOT NULL DEFAULT 0,
    estimated_read_time INTEGER NOT NULL DEFAULT 0,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_attachments table
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    storage_path TEXT NOT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'completed',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create export_jobs table for tracking export operations
CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    format VARCHAR(20) NOT NULL,
    note_ids UUID[] NOT NULL,
    options JSONB NOT NULL DEFAULT '{}',
    progress INTEGER NOT NULL DEFAULT 0,
    file_path TEXT,
    file_size BIGINT,
    download_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create search_history table for AI search improvements
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    search_type VARCHAR(20) NOT NULL DEFAULT 'text',
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_versions table for version history (future feature)
CREATE TABLE note_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance

-- Notes table indexes
CREATE INDEX idx_notes_parent_id ON notes(parent_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_title ON notes USING gin(title gin_trgm_ops);
CREATE INDEX idx_notes_content ON notes USING gin(content gin_trgm_ops);
CREATE INDEX idx_notes_tags ON notes USING gin(tags);
CREATE INDEX idx_notes_is_archived ON notes(is_archived);
CREATE INDEX idx_notes_is_favorite ON notes(is_favorite);
CREATE INDEX idx_notes_sync_status ON notes(sync_status);
CREATE INDEX idx_notes_position ON notes(position);

-- Composite indexes for common queries
CREATE INDEX idx_notes_parent_position ON notes(parent_id, position);
CREATE INDEX idx_notes_archived_updated ON notes(is_archived, updated_at DESC);
CREATE INDEX idx_notes_favorite_updated ON notes(is_favorite, updated_at DESC);

-- File attachments indexes
CREATE INDEX idx_file_attachments_note_id ON file_attachments(note_id);
CREATE INDEX idx_file_attachments_created_at ON file_attachments(created_at DESC);
CREATE INDEX idx_file_attachments_file_type ON file_attachments(file_type);
CREATE INDEX idx_file_attachments_upload_status ON file_attachments(upload_status);

-- Export jobs indexes
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at DESC);
CREATE INDEX idx_export_jobs_expires_at ON export_jobs(expires_at);

-- Search history indexes
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX idx_search_history_query ON search_history USING gin(query gin_trgm_ops);

-- Note versions indexes
CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_note_versions_created_at ON note_versions(created_at DESC);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_attachments_updated_at 
    BEFORE UPDATE ON file_attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate word count and reading time
CREATE OR REPLACE FUNCTION calculate_note_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate word count (simple space-based counting)
    NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
    
    -- Calculate character count
    NEW.character_count = length(NEW.content);
    
    -- Calculate estimated reading time (200 words per minute)
    NEW.estimated_read_time = GREATEST(1, CEIL(NEW.word_count / 200.0));
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_note_stats_trigger
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW 
    WHEN (NEW.content IS DISTINCT FROM OLD.content OR OLD.content IS NULL)
    EXECUTE FUNCTION calculate_note_stats();

-- Create function to prevent circular references in hierarchy
CREATE OR REPLACE FUNCTION prevent_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
    current_parent_id UUID;
    depth_counter INTEGER := 0;
    max_depth INTEGER := 10;
BEGIN
    -- If no parent, no risk of circular reference
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Can't be parent of itself
    IF NEW.id = NEW.parent_id THEN
        RAISE EXCEPTION 'A note cannot be its own parent';
    END IF;
    
    -- Check for circular reference by traversing up the hierarchy
    current_parent_id := NEW.parent_id;
    
    WHILE current_parent_id IS NOT NULL AND depth_counter < max_depth LOOP
        -- If we find our own ID in the parent chain, it's circular
        IF current_parent_id = NEW.id THEN
            RAISE EXCEPTION 'Circular reference detected in note hierarchy';
        END IF;
        
        -- Move up one level
        SELECT parent_id INTO current_parent_id 
        FROM notes 
        WHERE id = current_parent_id;
        
        depth_counter := depth_counter + 1;
    END LOOP;
    
    -- Check if we've exceeded maximum depth
    IF depth_counter >= max_depth THEN
        RAISE EXCEPTION 'Maximum hierarchy depth exceeded (limit: %)', max_depth;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_circular_reference_trigger
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW 
    WHEN (NEW.parent_id IS NOT NULL)
    EXECUTE FUNCTION prevent_circular_reference();

-- Create function to get note hierarchy path
CREATE OR REPLACE FUNCTION get_note_path(note_id UUID)
RETURNS UUID[] AS $$
DECLARE
    path UUID[] := '{}';
    current_id UUID := note_id;
    current_parent_id UUID;
    depth_counter INTEGER := 0;
    max_depth INTEGER := 10;
BEGIN
    WHILE current_id IS NOT NULL AND depth_counter < max_depth LOOP
        path := array_prepend(current_id, path);
        
        SELECT parent_id INTO current_parent_id 
        FROM notes 
        WHERE id = current_id;
        
        current_id := current_parent_id;
        depth_counter := depth_counter + 1;
    END LOOP;
    
    RETURN path;
END;
$$ language 'plpgsql';

-- Create function to get note children recursively
CREATE OR REPLACE FUNCTION get_note_children(note_id UUID, max_depth INTEGER DEFAULT 10)
RETURNS TABLE(id UUID, title VARCHAR, depth INTEGER) AS $$
WITH RECURSIVE note_tree AS (
    -- Base case: direct children
    SELECT n.id, n.title, n.parent_id, 1 as depth
    FROM notes n
    WHERE n.parent_id = note_id
    AND NOT n.is_archived
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT n.id, n.title, n.parent_id, nt.depth + 1
    FROM notes n
    INNER JOIN note_tree nt ON n.parent_id = nt.id
    WHERE nt.depth < max_depth
    AND NOT n.is_archived
)
SELECT note_tree.id, note_tree.title, note_tree.depth
FROM note_tree
ORDER BY note_tree.depth, note_tree.title;
$$ language 'sql';

-- Create function for full-text search with ranking
CREATE OR REPLACE FUNCTION search_notes(
    search_query TEXT,
    include_archived BOOLEAN DEFAULT false,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
        (
            similarity(n.title, search_query) * 2.0 +
            similarity(n.content, search_query)
        ) as rank
    FROM notes n
    WHERE 
        (include_archived = true OR n.is_archived = false)
        AND (
            n.title ILIKE '%' || search_query || '%' 
            OR n.content ILIKE '%' || search_query || '%'
            OR search_query = ANY(n.tags)
        )
    ORDER BY rank DESC, n.updated_at DESC
    LIMIT limit_results;
END;
$$ language 'plpgsql';

-- Row Level Security (RLS) Policies
-- For now, we'll allow all operations since this is a single-user app
-- In a multi-user scenario, you would add user authentication and proper policies

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (single-user app)
CREATE POLICY "Allow all operations for authenticated users" ON notes
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON file_attachments
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON export_jobs
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON search_history
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON note_versions
    FOR ALL USING (true);

-- Create views for common queries

-- View for notes with their children count
CREATE VIEW notes_with_stats AS
SELECT 
    n.*,
    (SELECT COUNT(*) FROM notes c WHERE c.parent_id = n.id AND NOT c.is_archived) as children_count,
    (SELECT COUNT(*) FROM file_attachments f WHERE f.note_id = n.id) as files_count,
    CASE 
        WHEN n.parent_id IS NULL THEN 0
        ELSE (SELECT array_length(get_note_path(n.id), 1) - 1)
    END as depth
FROM notes n;

-- View for recent notes (last 30 days)
CREATE VIEW recent_notes AS
SELECT * FROM notes 
WHERE updated_at >= NOW() - INTERVAL '30 days'
AND NOT is_archived
ORDER BY updated_at DESC;

-- View for favorite notes
CREATE VIEW favorite_notes AS
SELECT * FROM notes 
WHERE is_favorite = true
AND NOT is_archived
ORDER BY updated_at DESC;

-- Create some sample data (optional)
INSERT INTO notes (id, title, content, tags) VALUES
    (uuid_generate_v4(), 'Welcome to Note0', 'This is your first note! You can edit this content and start organizing your thoughts.', ARRAY['welcome', 'first']),
    (uuid_generate_v4(), 'Project Ideas', 'List of project ideas to work on...', ARRAY['projects', 'ideas']),
    (uuid_generate_v4(), 'Meeting Notes', 'Notes from today''s team meeting...', ARRAY['meetings', 'work']);

-- Add a child note to demonstrate hierarchy
WITH parent_note AS (
    SELECT id FROM notes WHERE title = 'Project Ideas' LIMIT 1
)
INSERT INTO notes (title, content, parent_id, tags)
SELECT 'Web Application Project', 'Details about the web app project...', parent_note.id, ARRAY['projects', 'web']
FROM parent_note;

COMMIT; 