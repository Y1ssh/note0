import { createClient } from '@supabase/supabase-js';
import type { Note, CreateNoteInput, UpdateNoteInput, NotesFilter } from '@/types/note';
import type { FileAttachment } from '@/types/file';

// Define database schema types
export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          summary?: string;
          parent_id?: string | null;
          position: number;
          is_archived: boolean;
          is_favorite: boolean;
          tags: string[];
          word_count: number;
          character_count: number;
          estimated_read_time: number;
          sync_status: string;
          version: number;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
          last_sync_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          content?: string;
          summary?: string;
          parent_id?: string | null;
          position?: number;
          is_archived?: boolean;
          is_favorite?: boolean;
          tags?: string[];
          word_count?: number;
          character_count?: number;
          estimated_read_time?: number;
          sync_status?: string;
          version?: number;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          last_sync_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          summary?: string;
          parent_id?: string | null;
          position?: number;
          is_archived?: boolean;
          is_favorite?: boolean;
          tags?: string[];
          word_count?: number;
          character_count?: number;
          estimated_read_time?: number;
          sync_status?: string;
          version?: number;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          last_sync_at?: string;
        };
      };
      file_attachments: {
        Row: {
          id: string;
          note_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          mime_type: string;
          file_url: string;
          thumbnail_url?: string;
          storage_path: string;
          upload_status: string;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          mime_type: string;
          file_url: string;
          thumbnail_url?: string;
          storage_path: string;
          upload_status?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          mime_type?: string;
          file_url?: string;
          thumbnail_url?: string;
          storage_path?: string;
          upload_status?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      export_jobs: {
        Row: {
          id: string;
          status: string;
          format: string;
          note_ids: string[];
          options: Record<string, any>;
          progress: number;
          file_path?: string;
          file_size?: number;
          download_url?: string;
          expires_at?: string;
          error_message?: string;
          created_at: string;
          started_at?: string;
          completed_at?: string;
        };
        Insert: {
          id?: string;
          status?: string;
          format: string;
          note_ids: string[];
          options?: Record<string, any>;
          progress?: number;
          file_path?: string;
          file_size?: number;
          download_url?: string;
          expires_at?: string;
          error_message?: string;
          created_at?: string;
          started_at?: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          format?: string;
          note_ids?: string[];
          options?: Record<string, any>;
          progress?: number;
          file_path?: string;
          file_size?: number;
          download_url?: string;
          expires_at?: string;
          error_message?: string;
          created_at?: string;
          started_at?: string;
          completed_at?: string;
        };
      };
    };
    Views: {
      notes_with_stats: {
        Row: {
          id: string;
          title: string;
          content: string;
          summary?: string;
          parent_id?: string | null;
          position: number;
          is_archived: boolean;
          is_favorite: boolean;
          tags: string[];
          word_count: number;
          character_count: number;
          estimated_read_time: number;
          sync_status: string;
          version: number;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
          last_sync_at: string;
          children_count: number;
          files_count: number;
          depth: number;
        };
      };
    };
    Functions: {
      search_notes: {
        Args: {
          search_query: string;
          include_archived?: boolean;
          limit_results?: number;
        };
        Returns: {
          id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
          rank: number;
        }[];
      };
      get_note_children: {
        Args: {
          note_id: string;
          max_depth?: number;
        };
        Returns: {
          id: string;
          title: string;
          depth: number;
        }[];
      };
    };
  };
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database helper functions
export const db = {
  // Notes operations
  notes: {
    // Get all notes with optional filtering
    async getAll(filter: NotesFilter = {}): Promise<Note[]> {
      let query = supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filter.search_query) {
        query = query.or(`title.ilike.%${filter.search_query}%,content.ilike.%${filter.search_query}%`);
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags);
      }

      if (filter.is_archived !== undefined) {
        query = query.eq('is_archived', filter.is_archived);
      }

      if (filter.is_favorite !== undefined) {
        query = query.eq('is_favorite', filter.is_favorite);
      }

      if (filter.parent_id !== undefined) {
        query = query.eq('parent_id', filter.parent_id);
      }

      if (filter.created_after) {
        query = query.gte('created_at', filter.created_after);
      }

      if (filter.created_before) {
        query = query.lte('created_at', filter.created_before);
      }

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }

      return data as Note[];
    },

    // Get a single note by ID
    async getById(id: string): Promise<Note | null> {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch note: ${error.message}`);
      }

      return data as Note;
    },

    // Get notes with stats (children count, etc.)
    async getWithStats(filter: NotesFilter = {}): Promise<Note[]> {
      let query = supabase
        .from('notes_with_stats')
        .select('*')
        .order('updated_at', { ascending: false });

      // Apply same filters as getAll
      if (filter.is_archived !== undefined) {
        query = query.eq('is_archived', filter.is_archived);
      }

      if (filter.parent_id !== undefined) {
        query = query.eq('parent_id', filter.parent_id);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notes with stats: ${error.message}`);
      }

      return data as Note[];
    },

    // Create a new note
    async create(input: CreateNoteInput): Promise<Note> {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: input.title,
          content: input.content || '',
          parent_id: input.parent_id,
          position: input.position || 0,
          tags: input.tags || [],
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create note: ${error.message}`);
      }

      return data as Note;
    },

    // Update an existing note
    async update(input: UpdateNoteInput): Promise<Note> {
      const updateData: any = {};
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.parent_id !== undefined) updateData.parent_id = input.parent_id;
      if (input.position !== undefined) updateData.position = input.position;
      if (input.is_archived !== undefined) updateData.is_archived = input.is_archived;
      if (input.is_favorite !== undefined) updateData.is_favorite = input.is_favorite;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update note: ${error.message}`);
      }

      return data as Note;
    },

    // Delete a note
    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete note: ${error.message}`);
      }
    },

    // Search notes using the database function
    async search(query: string, includeArchived = false, limit = 50) {
      const { data, error } = await supabase.rpc('search_notes', {
        search_query: query,
        include_archived: includeArchived,
        limit_results: limit,
      });

      if (error) {
        throw new Error(`Failed to search notes: ${error.message}`);
      }

      return data;
    },

    // Get note children
    async getChildren(noteId: string, maxDepth = 10) {
      const { data, error } = await supabase.rpc('get_note_children', {
        note_id: noteId,
        max_depth: maxDepth,
      });

      if (error) {
        throw new Error(`Failed to get note children: ${error.message}`);
      }

      return data;
    },

    // Get root notes (notes without parents)
    async getRoots(): Promise<Note[]> {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .is('parent_id', null)
        .eq('is_archived', false)
        .order('position', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch root notes: ${error.message}`);
      }

      return data as Note[];
    },
  },

  // File attachments operations
  files: {
    // Get files for a note
    async getByNoteId(noteId: string): Promise<FileAttachment[]> {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch files: ${error.message}`);
      }

      return data as FileAttachment[];
    },

    // Create file attachment record
    async create(fileData: Omit<FileAttachment, 'id' | 'created_at' | 'updated_at'>): Promise<FileAttachment> {
      const { data, error } = await supabase
        .from('file_attachments')
        .insert(fileData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create file record: ${error.message}`);
      }

      return data as FileAttachment;
    },

    // Delete file attachment
    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    },
  },

  // Storage operations
  storage: {
    // Upload file to storage
    async uploadFile(file: File, path: string): Promise<string> {
      const { data, error } = await supabase.storage
        .from('note-files')
        .upload(path, file);

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('note-files')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    },

    // Delete file from storage
    async deleteFile(path: string): Promise<void> {
      const { error } = await supabase.storage
        .from('note-files')
        .remove([path]);

      if (error) {
        throw new Error(`Failed to delete file from storage: ${error.message}`);
      }
    },

    // Get storage usage
    async getUsage(): Promise<{ size: number; files: number }> {
      try {
        const { data, error } = await supabase.storage
          .from('note-files')
          .list();

        if (error) {
          throw error;
        }

        const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
        
        return {
          size: totalSize,
          files: data.length,
        };
      } catch (error) {
        console.warn('Failed to get storage usage:', error);
        return { size: 0, files: 0 };
      }
    },
  },
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to note changes
  subscribeToNotes(callback: (payload: any) => void) {
    return supabase
      .channel('notes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notes' }, 
        callback
      )
      .subscribe();
  },

  // Subscribe to file changes
  subscribeToFiles(callback: (payload: any) => void) {
    return supabase
      .channel('files-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'file_attachments' }, 
        callback
      )
      .subscribe();
  },

  // Subscribe to specific note changes
  subscribeToNote(noteId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`note-${noteId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notes',
          filter: `id=eq.${noteId}`
        }, 
        callback
      )
      .subscribe();
  },

  // Unsubscribe from a channel
  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  },
};

// Utility functions
export const utils = {
  // Check if Supabase is connected
  async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  },

  // Get database version and health
  async getHealth() {
    try {
      const { data, error } = await supabase
        .rpc('version');
      
      return {
        connected: !error,
        version: data || 'unknown',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        connected: false,
        version: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }
  },
};

export default supabase; 