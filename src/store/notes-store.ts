import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Note, CreateNoteInput, UpdateNoteInput, NotesFilter, NoteTree, SyncStatus } from '@/types/note';
import { db, subscriptions } from '@/lib/supabase';
import { NoteStorage } from '@/lib/storage';
import { NOTE_CONFIG, STORAGE_KEYS } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface NotesState {
  // Core state
  notes: Note[];
  selectedNoteId: string | null;
  loading: boolean;
  error: string | null;
  
  // Search and filters
  searchQuery: string;
  searchResults: Note[];
  filters: NotesFilter;
  
  // Hierarchy state
  noteTree: NoteTree[];
  expandedNotes: Set<string>;
  
  // Sync and offline state
  syncStatus: SyncStatus;
  isOnline: boolean;
  lastSyncAt: string | null;
  offlineQueue: Array<{
    id: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: string;
  }>;
  
  // UI state
  sidebarCollapsed: boolean;
  viewMode: 'grid' | 'list' | 'tree';
  
  // Actions
  actions: {
    // Core CRUD operations
    fetchNotes: (filter?: NotesFilter) => Promise<void>;
    createNote: (input: CreateNoteInput) => Promise<Note | null>;
    updateNote: (input: UpdateNoteInput) => Promise<Note | null>;
    deleteNote: (id: string) => Promise<boolean>;
    duplicateNote: (id: string) => Promise<Note | null>;
    
    // Note selection and navigation
    selectNote: (id: string | null) => void;
    selectNextNote: () => void;
    selectPrevNote: () => void;
    
    // Search and filtering
    setSearchQuery: (query: string) => void;
    performSearch: (query: string) => Promise<void>;
    clearSearch: () => void;
    setFilters: (filters: Partial<NotesFilter>) => void;
    
    // Hierarchy operations
    moveNote: (noteId: string, newParentId: string | null, newPosition: number) => Promise<boolean>;
    reorderNotes: (parentId: string | null, noteIds: string[]) => Promise<boolean>;
    expandNote: (noteId: string) => void;
    collapseNote: (noteId: string) => void;
    toggleNoteExpansion: (noteId: string) => void;
    buildNoteTree: () => void;
    
    // Sync operations
    syncWithCloud: () => Promise<void>;
    forceSyncNote: (noteId: string) => Promise<void>;
    setSyncStatus: (status: SyncStatus) => void;
    setOnlineStatus: (isOnline: boolean) => void;
    
    // Offline operations
    addToOfflineQueue: (operation: any) => void;
    processOfflineQueue: () => Promise<void>;
    clearOfflineQueue: () => void;
    
    // Utility actions
    refreshNotes: () => Promise<void>;
    archiveNote: (id: string) => Promise<boolean>;
    unarchiveNote: (id: string) => Promise<boolean>;
    toggleFavorite: (id: string) => Promise<boolean>;
    addTag: (noteId: string, tag: string) => Promise<boolean>;
    removeTag: (noteId: string, tag: string) => Promise<boolean>;
    
    // UI actions
    setSidebarCollapsed: (collapsed: boolean) => void;
    setViewMode: (mode: 'grid' | 'list' | 'tree') => void;
    
    // Reset and cleanup
    reset: () => void;
    clearError: () => void;
  };
}

export const useNotesStore = create<NotesState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        notes: [],
        selectedNoteId: null,
        loading: false,
        error: null,
        searchQuery: '',
        searchResults: [],
        filters: {},
        noteTree: [],
        expandedNotes: new Set(),
        syncStatus: 'synced',
        isOnline: true,
        lastSyncAt: null,
        offlineQueue: [],
        sidebarCollapsed: false,
        viewMode: 'grid',

        actions: {
          // Fetch notes from database or localStorage
          fetchNotes: async (filter = {}) => {
            set((state) => {
              state.loading = true;
              state.error = null;
            });

            try {
              let notes: Note[];
              
              if (get().isOnline) {
                // Fetch from Supabase
                notes = await db.notes.getAll(filter);
                // Save to localStorage as backup
                NoteStorage.setNotes(notes);
              } else {
                // Fetch from localStorage when offline
                notes = NoteStorage.getNotes();
              }

              set((state) => {
                state.notes = notes;
                state.loading = false;
                state.lastSyncAt = new Date().toISOString();
              });

              // Build tree structure
              get().actions.buildNoteTree();
            } catch (error) {
              console.error('Failed to fetch notes:', error);
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to fetch notes';
                state.loading = false;
              });
              
              // Fallback to localStorage
              const localNotes = NoteStorage.getNotes();
              set((state) => {
                state.notes = localNotes;
              });
            }
          },

          // Create a new note
          createNote: async (input) => {
            set((state) => {
              state.loading = true;
              state.error = null;
            });

            try {
              let newNote: Note;

              if (get().isOnline) {
                // Create in Supabase
                newNote = await db.notes.create(input);
              } else {
                // Create locally and add to queue
                newNote = {
                  id: generateId(),
                  title: input.title,
                  content: input.content || '',
                  summary: '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_sync_at: new Date().toISOString(),
                  parent_id: input.parent_id || null,
                  position: input.position || 0,
                  is_archived: false,
                  is_favorite: false,
                  tags: input.tags || [],
                  word_count: 0,
                  character_count: input.content?.length || 0,
                  estimated_read_time: 1,
                  sync_status: 'pending',
                  version: 1,
                  metadata: input.metadata || {},
                } as Note;

                // Add to offline queue
                get().actions.addToOfflineQueue({
                  id: generateId(),
                  operation: 'create',
                  data: input,
                  timestamp: new Date().toISOString(),
                });
              }

              set((state) => {
                state.notes.push(newNote);
                state.selectedNoteId = newNote.id;
                state.loading = false;
              });

              // Update localStorage
              const updatedNotes = get().notes;
              NoteStorage.setNotes(updatedNotes);

              // Rebuild tree
              get().actions.buildNoteTree();

              return newNote;
            } catch (error) {
              console.error('Failed to create note:', error);
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create note';
                state.loading = false;
              });
              return null;
            }
          },

          // Update an existing note
          updateNote: async (input) => {
            try {
              let updatedNote: Note;

              if (get().isOnline) {
                // Update in Supabase
                updatedNote = await db.notes.update(input);
              } else {
                // Update locally and add to queue
                const existingNote = get().notes.find(n => n.id === input.id);
                if (!existingNote) {
                  throw new Error('Note not found');
                }

                updatedNote = {
                  ...existingNote,
                  ...input,
                  updated_at: new Date().toISOString(),
                  sync_status: 'pending',
                };

                // Add to offline queue
                get().actions.addToOfflineQueue({
                  id: generateId(),
                  operation: 'update',
                  data: input,
                  timestamp: new Date().toISOString(),
                });
              }

              set((state) => {
                const index = state.notes.findIndex(n => n.id === input.id);
                if (index !== -1) {
                  state.notes[index] = updatedNote;
                }
              });

              // Update localStorage
              const updatedNotes = get().notes;
              NoteStorage.setNotes(updatedNotes);

              return updatedNote;
            } catch (error) {
              console.error('Failed to update note:', error);
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to update note';
              });
              return null;
            }
          },

          // Delete a note
          deleteNote: async (id) => {
            try {
              if (get().isOnline) {
                // Delete from Supabase
                await db.notes.delete(id);
              } else {
                // Add to offline queue
                get().actions.addToOfflineQueue({
                  id: generateId(),
                  operation: 'delete',
                  data: { id },
                  timestamp: new Date().toISOString(),
                });
              }

              set((state) => {
                state.notes = state.notes.filter(n => n.id !== id);
                if (state.selectedNoteId === id) {
                  state.selectedNoteId = null;
                }
              });

              // Update localStorage
              const updatedNotes = get().notes;
              NoteStorage.setNotes(updatedNotes);

              // Rebuild tree
              get().actions.buildNoteTree();

              return true;
            } catch (error) {
              console.error('Failed to delete note:', error);
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete note';
              });
              return false;
            }
          },

          // Duplicate a note
          duplicateNote: async (id) => {
            const originalNote = get().notes.find(n => n.id === id);
            if (!originalNote) {
              return null;
            }

            const duplicateInput: CreateNoteInput = {
              title: `${originalNote.title} (Copy)`,
              content: originalNote.content,
              parent_id: originalNote.parent_id,
              tags: [...originalNote.tags],
              metadata: { ...originalNote.metadata },
            };

            return get().actions.createNote(duplicateInput);
          },

          // Select a note
          selectNote: (id) => {
            set((state) => {
              state.selectedNoteId = id;
            });
          },

          // Navigate to next note
          selectNextNote: () => {
            const { notes, selectedNoteId } = get();
            if (notes.length === 0) return;

            const currentIndex = selectedNoteId 
              ? notes.findIndex(n => n.id === selectedNoteId)
              : -1;
            
            const nextIndex = currentIndex < notes.length - 1 ? currentIndex + 1 : 0;
            get().actions.selectNote(notes[nextIndex].id);
          },

          // Navigate to previous note
          selectPrevNote: () => {
            const { notes, selectedNoteId } = get();
            if (notes.length === 0) return;

            const currentIndex = selectedNoteId 
              ? notes.findIndex(n => n.id === selectedNoteId)
              : -1;
            
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : notes.length - 1;
            get().actions.selectNote(notes[prevIndex].id);
          },

          // Set search query
          setSearchQuery: (query) => {
            set((state) => {
              state.searchQuery = query;
            });
          },

          // Perform search
          performSearch: async (query) => {
            if (!query.trim()) {
              get().actions.clearSearch();
              return;
            }

            set((state) => {
              state.loading = true;
              state.searchQuery = query;
            });

            try {
              let results: Note[];

              if (get().isOnline) {
                // Use Supabase search function
                const searchData = await db.notes.search(query);
                // Convert search results to Note objects
                results = get().notes.filter(note => 
                  searchData.some(result => result.id === note.id)
                );
              } else {
                // Local search
                results = get().notes.filter(note =>
                  note.title.toLowerCase().includes(query.toLowerCase()) ||
                  note.content.toLowerCase().includes(query.toLowerCase()) ||
                  note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
                );
              }

              set((state) => {
                state.searchResults = results;
                state.loading = false;
              });
            } catch (error) {
              console.error('Search failed:', error);
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Search failed';
                state.loading = false;
              });
            }
          },

          // Clear search
          clearSearch: () => {
            set((state) => {
              state.searchQuery = '';
              state.searchResults = [];
            });
          },

          // Set filters
          setFilters: (filters) => {
            set((state) => {
              state.filters = { ...state.filters, ...filters };
            });
          },

          // Move note in hierarchy
          moveNote: async (noteId, newParentId, newPosition) => {
            try {
              const updateInput: UpdateNoteInput = {
                id: noteId,
                parent_id: newParentId,
                position: newPosition,
              };

              await get().actions.updateNote(updateInput);
              get().actions.buildNoteTree();
              return true;
            } catch (error) {
              console.error('Failed to move note:', error);
              return false;
            }
          },

          // Reorder notes
          reorderNotes: async (parentId, noteIds) => {
            try {
              const promises = noteIds.map((noteId, index) =>
                get().actions.updateNote({
                  id: noteId,
                  parent_id: parentId,
                  position: index,
                })
              );

              await Promise.all(promises);
              get().actions.buildNoteTree();
              return true;
            } catch (error) {
              console.error('Failed to reorder notes:', error);
              return false;
            }
          },

          // Expand note
          expandNote: (noteId) => {
            set((state) => {
              state.expandedNotes.add(noteId);
            });
          },

          // Collapse note
          collapseNote: (noteId) => {
            set((state) => {
              state.expandedNotes.delete(noteId);
            });
          },

          // Toggle note expansion
          toggleNoteExpansion: (noteId) => {
            const { expandedNotes } = get();
            if (expandedNotes.has(noteId)) {
              get().actions.collapseNote(noteId);
            } else {
              get().actions.expandNote(noteId);
            }
          },

          // Build hierarchical tree structure
          buildNoteTree: () => {
            const { notes } = get();
            const noteMap = new Map(notes.map(note => [note.id, note]));
            const tree: NoteTree[] = [];

            // Helper function to build tree recursively
            const buildTreeNode = (note: Note, depth = 0): NoteTree => {
              const children = notes
                .filter(n => n.parent_id === note.id)
                .sort((a, b) => a.position - b.position)
                .map(child => buildTreeNode(child, depth + 1));

              return {
                id: note.id,
                title: note.title,
                parent_id: note.parent_id,
                position: note.position,
                is_archived: note.is_archived,
                children,
                depth,
                path: [], // Will be calculated separately if needed
              };
            };

            // Build tree from root nodes (nodes without parents)
            const rootNotes = notes
              .filter(note => !note.parent_id)
              .sort((a, b) => a.position - b.position);

            rootNotes.forEach(note => {
              tree.push(buildTreeNode(note));
            });

            set((state) => {
              state.noteTree = tree;
            });
          },

          // Sync with cloud
          syncWithCloud: async () => {
            if (!get().isOnline) {
              return;
            }

            set((state) => {
              state.syncStatus = 'syncing';
            });

            try {
              // Process offline queue first
              await get().actions.processOfflineQueue();

              // Fetch latest notes
              await get().actions.fetchNotes();

              set((state) => {
                state.syncStatus = 'synced';
                state.lastSyncAt = new Date().toISOString();
              });

              // Update localStorage with last sync time
              NoteStorage.setLastSync(get().lastSyncAt!);
            } catch (error) {
              console.error('Sync failed:', error);
              set((state) => {
                state.syncStatus = 'error';
                state.error = error instanceof Error ? error.message : 'Sync failed';
              });
            }
          },

          // Force sync a specific note
          forceSyncNote: async (noteId) => {
            // Implementation for forcing sync of a specific note
            // This could be useful for resolving conflicts
          },

          // Set sync status
          setSyncStatus: (status) => {
            set((state) => {
              state.syncStatus = status;
            });
          },

          // Set online status
          setOnlineStatus: (isOnline) => {
            set((state) => {
              state.isOnline = isOnline;
              if (isOnline && state.offlineQueue.length > 0) {
                // Trigger sync when coming back online
                get().actions.syncWithCloud();
              }
            });
          },

          // Add operation to offline queue
          addToOfflineQueue: (operation) => {
            set((state) => {
              state.offlineQueue.push(operation);
            });
            
            // Save to localStorage
            NoteStorage.setOfflineQueue(get().offlineQueue);
          },

          // Process offline queue
          processOfflineQueue: async () => {
            const { offlineQueue } = get();
            if (offlineQueue.length === 0) return;

            for (const operation of offlineQueue) {
              try {
                switch (operation.operation) {
                  case 'create':
                    await db.notes.create(operation.data);
                    break;
                  case 'update':
                    await db.notes.update(operation.data);
                    break;
                  case 'delete':
                    await db.notes.delete(operation.data.id);
                    break;
                }
              } catch (error) {
                console.error('Failed to process offline operation:', error);
                // Keep failed operations in queue for retry
                continue;
              }
            }

            // Clear processed operations
            get().actions.clearOfflineQueue();
          },

          // Clear offline queue
          clearOfflineQueue: () => {
            set((state) => {
              state.offlineQueue = [];
            });
            NoteStorage.setOfflineQueue([]);
          },

          // Refresh notes
          refreshNotes: async () => {
            await get().actions.fetchNotes();
          },

          // Archive note
          archiveNote: async (id) => {
            return !!(await get().actions.updateNote({
              id,
              is_archived: true,
            }));
          },

          // Unarchive note
          unarchiveNote: async (id) => {
            return !!(await get().actions.updateNote({
              id,
              is_archived: false,
            }));
          },

          // Toggle favorite
          toggleFavorite: async (id) => {
            const note = get().notes.find(n => n.id === id);
            if (!note) return false;

            return !!(await get().actions.updateNote({
              id,
              is_favorite: !note.is_favorite,
            }));
          },

          // Add tag
          addTag: async (noteId, tag) => {
            const note = get().notes.find(n => n.id === noteId);
            if (!note || note.tags.includes(tag)) return false;

            return !!(await get().actions.updateNote({
              id: noteId,
              tags: [...note.tags, tag],
            }));
          },

          // Remove tag
          removeTag: async (noteId, tag) => {
            const note = get().notes.find(n => n.id === noteId);
            if (!note) return false;

            return !!(await get().actions.updateNote({
              id: noteId,
              tags: note.tags.filter(t => t !== tag),
            }));
          },

          // Set sidebar collapsed
          setSidebarCollapsed: (collapsed) => {
            set((state) => {
              state.sidebarCollapsed = collapsed;
            });
          },

          // Set view mode
          setViewMode: (mode) => {
            set((state) => {
              state.viewMode = mode;
            });
          },

          // Reset store
          reset: () => {
            set((state) => {
              state.notes = [];
              state.selectedNoteId = null;
              state.loading = false;
              state.error = null;
              state.searchQuery = '';
              state.searchResults = [];
              state.filters = {};
              state.noteTree = [];
              state.expandedNotes = new Set();
              state.syncStatus = 'synced';
              state.offlineQueue = [];
              state.sidebarCollapsed = false;
              state.viewMode = 'grid';
            });
          },

          // Clear error
          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },
        },
      })),
      {
        name: STORAGE_KEYS.NOTES,
        partialize: (state) => ({
          // Only persist UI preferences and offline queue
          sidebarCollapsed: state.sidebarCollapsed,
          viewMode: state.viewMode,
          expandedNotes: Array.from(state.expandedNotes),
          offlineQueue: state.offlineQueue,
          lastSyncAt: state.lastSyncAt,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert expandedNotes array back to Set
            state.expandedNotes = new Set(state.expandedNotes as any);
          }
        },
      }
    ),
    {
      name: 'notes-store',
    }
  )
);

// Selector hooks for easier access to specific parts of the state
export const useNotes = () => useNotesStore((state) => state.notes);
export const useSelectedNote = () => {
  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const notes = useNotesStore((state) => state.notes);
  return selectedNoteId ? notes.find(n => n.id === selectedNoteId) || null : null;
};
export const useNotesLoading = () => useNotesStore((state) => state.loading);
export const useNotesError = () => useNotesStore((state) => state.error);
export const useSearchResults = () => useNotesStore((state) => state.searchResults);
export const useNoteTree = () => useNotesStore((state) => state.noteTree);
export const useSyncStatus = () => useNotesStore((state) => state.syncStatus);
export const useNotesActions = () => useNotesStore((state) => state.actions); 