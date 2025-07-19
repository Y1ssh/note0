export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  parent_id?: string | null;
  position: number;
  is_archived: boolean;
  is_favorite: boolean;
  tags: string[];
  word_count: number;
  character_count: number;
  estimated_read_time: number; // in minutes
  last_sync_at?: string;
  sync_status: SyncStatus;
  version: number;
  metadata: NoteMetadata;
}

export interface NoteMetadata {
  created_by?: string;
  last_modified_by?: string;
  color?: string;
  icon?: string;
  cover_image?: string;
  template_id?: string;
  custom_properties?: Record<string, unknown>;
}

export interface NoteTree {
  id: string;
  title: string;
  parent_id?: string | null;
  position: number;
  is_archived: boolean;
  children: NoteTree[];
  depth: number;
  path: string[]; // Array of parent IDs leading to this note
}

export interface NoteHierarchy {
  id: string;
  children: string[];
  parent_id?: string | null;
  depth: number;
  position: number;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  parent_id?: string | null;
  position?: number;
  tags?: string[];
  metadata?: Partial<NoteMetadata>;
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  parent_id?: string | null;
  position?: number;
  is_archived?: boolean;
  is_favorite?: boolean;
  tags?: string[];
  metadata?: Partial<NoteMetadata>;
}

export interface MoveNoteInput {
  id: string;
  new_parent_id?: string | null;
  new_position: number;
}

export interface NoteSearchResult {
  note: Note;
  highlights: SearchHighlight[];
  relevance_score: number;
  match_type: 'title' | 'content' | 'tags' | 'ai_semantic';
}

export interface SearchHighlight {
  field: 'title' | 'content';
  text: string;
  start_index: number;
  end_index: number;
}

export interface NotesFilter {
  search_query?: string;
  tags?: string[];
  is_archived?: boolean;
  is_favorite?: boolean;
  parent_id?: string | null;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'position';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

export type NoteViewMode = 'grid' | 'list' | 'tree';

export type NoteExportFormat = 'markdown' | 'pdf' | 'json' | 'zip';

// For real-time collaboration (future feature)
export interface NoteOperation {
  id: string;
  note_id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  timestamp: string;
  user_id?: string;
}

// For version history (future feature)
export interface NoteVersion {
  id: string;
  note_id: string;
  content: string;
  title: string;
  version_number: number;
  created_at: string;
  created_by?: string;
  change_summary?: string;
} 