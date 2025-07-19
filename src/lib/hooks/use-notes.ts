import { useCallback, useEffect } from 'react';
import { useNotesStore, useNotesActions, useNotes, useSelectedNote, useNotesLoading, useNotesError } from '@/store/notes-store';
import type { Note, CreateNoteInput, UpdateNoteInput, NotesFilter } from '@/types/note';
import { subscriptions } from '@/lib/supabase';

interface UseNotesReturn {
  // State
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  createNote: (input: CreateNoteInput) => Promise<Note | null>;
  updateNote: (input: UpdateNoteInput) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  duplicateNote: (id: string) => Promise<Note | null>;
  selectNote: (id: string | null) => void;
  refreshNotes: () => Promise<void>;
  
  // Utility functions
  getNoteById: (id: string) => Note | undefined;
  getNoteChildren: (parentId: string) => Note[];
  getNoteParent: (noteId: string) => Note | undefined;
  isNoteModified: (note: Note) => boolean;
  canDeleteNote: (noteId: string) => boolean;
}

export function useNotesWithActions(filter?: NotesFilter): UseNotesReturn {
  const notes = useNotes();
  const selectedNote = useSelectedNote();
  const loading = useNotesLoading();
  const error = useNotesError();
  const actions = useNotesActions();

  // Fetch notes on mount or filter change
  useEffect(() => {
    actions.fetchNotes(filter);
  }, [filter?.search_query, filter?.tags, filter?.is_archived, filter?.is_favorite, filter?.parent_id]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = subscriptions.subscribeToNotes((payload) => {
      console.log('Real-time note update:', payload);
      
      // Handle real-time updates
      switch (payload.eventType) {
        case 'INSERT':
          // Note created by another session
          actions.refreshNotes();
          break;
        case 'UPDATE':
          // Note updated by another session
          actions.refreshNotes();
          break;
        case 'DELETE':
          // Note deleted by another session
          actions.refreshNotes();
          break;
      }
    });

    return () => {
      subscriptions.unsubscribe(channel);
    };
  }, [actions]);

  // Utility functions
  const getNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  }, [notes]);

  const getNoteChildren = useCallback((parentId: string): Note[] => {
    return notes
      .filter(note => note.parent_id === parentId)
      .sort((a, b) => a.position - b.position);
  }, [notes]);

  const getNoteParent = useCallback((noteId: string): Note | undefined => {
    const note = getNoteById(noteId);
    return note?.parent_id ? getNoteById(note.parent_id) : undefined;
  }, [getNoteById]);

  const isNoteModified = useCallback((note: Note): boolean => {
    return note.sync_status === 'pending' || note.sync_status === 'syncing';
  }, []);

  const canDeleteNote = useCallback((noteId: string): boolean => {
    const children = getNoteChildren(noteId);
    return children.length === 0; // Can only delete notes without children
  }, [getNoteChildren]);

  return {
    // State
    notes,
    selectedNote,
    loading,
    error,
    
    // Actions
    createNote: actions.createNote,
    updateNote: actions.updateNote,
    deleteNote: actions.deleteNote,
    duplicateNote: actions.duplicateNote,
    selectNote: actions.selectNote,
    refreshNotes: actions.refreshNotes,
    
    // Utility functions
    getNoteById,
    getNoteChildren,
    getNoteParent,
    isNoteModified,
    canDeleteNote,
  };
}

// Specialized hooks for specific use cases

export function useNote(noteId: string | null) {
  const notes = useNotes();
  const actions = useNotesActions();
  
  const note = noteId ? notes.find(n => n.id === noteId) : null;
  
  const updateCurrentNote = useCallback(async (updates: Partial<UpdateNoteInput>) => {
    if (!noteId) return null;
    return actions.updateNote({ id: noteId, ...updates });
  }, [noteId, actions]);

  const deleteCurrentNote = useCallback(async () => {
    if (!noteId) return false;
    return actions.deleteNote(noteId);
  }, [noteId, actions]);

  const duplicateCurrentNote = useCallback(async () => {
    if (!noteId) return null;
    return actions.duplicateNote(noteId);
  }, [noteId, actions]);

  return {
    note,
    updateNote: updateCurrentNote,
    deleteNote: deleteCurrentNote,
    duplicateNote: duplicateCurrentNote,
    exists: !!note,
    loading: false, // Individual note loading could be added later
  };
}

export function useNoteHierarchy(rootNoteId?: string) {
  const notes = useNotes();
  const noteTree = useNotesStore(state => state.noteTree);
  const expandedNotes = useNotesStore(state => state.expandedNotes);
  const actions = useNotesActions();

  const getRootNotes = useCallback(() => {
    return notes.filter(note => !note.parent_id).sort((a, b) => a.position - b.position);
  }, [notes]);

  const getNotePath = useCallback((noteId: string): Note[] => {
    const path: Note[] = [];
    let currentNote = notes.find(n => n.id === noteId);
    
    while (currentNote) {
      path.unshift(currentNote);
      currentNote = currentNote.parent_id 
        ? notes.find(n => n.id === currentNote!.parent_id) 
        : undefined;
    }
    
    return path;
  }, [notes]);

  const getDescendants = useCallback((noteId: string): Note[] => {
    const descendants: Note[] = [];
    const children = notes.filter(n => n.parent_id === noteId);
    
    for (const child of children) {
      descendants.push(child);
      descendants.push(...getDescendants(child.id));
    }
    
    return descendants;
  }, [notes]);

  const canMoveNote = useCallback((noteId: string, targetParentId: string | null): boolean => {
    // Can't move note to itself
    if (noteId === targetParentId) return false;
    
    // Can't move note to one of its descendants
    const descendants = getDescendants(noteId);
    return !descendants.some(d => d.id === targetParentId);
  }, [getDescendants]);

  return {
    rootNotes: rootNoteId ? notes.filter(n => n.id === rootNoteId) : getRootNotes(),
    noteTree,
    expandedNotes,
    expandNote: actions.expandNote,
    collapseNote: actions.collapseNote,
    toggleExpansion: actions.toggleNoteExpansion,
    moveNote: actions.moveNote,
    reorderNotes: actions.reorderNotes,
    getRootNotes,
    getNotePath,
    getDescendants,
    canMoveNote,
  };
}

export function useNoteSearch() {
  const searchQuery = useNotesStore(state => state.searchQuery);
  const searchResults = useNotesStore(state => state.searchResults);
  const loading = useNotesLoading();
  const actions = useNotesActions();

  const search = useCallback((query: string) => {
    actions.setSearchQuery(query);
    if (query.trim()) {
      actions.performSearch(query);
    } else {
      actions.clearSearch();
    }
  }, [actions]);

  const clearSearch = useCallback(() => {
    actions.clearSearch();
  }, [actions]);

  return {
    query: searchQuery,
    results: searchResults,
    loading,
    search,
    clearSearch,
    hasResults: searchResults.length > 0,
    hasQuery: searchQuery.trim().length > 0,
  };
}

export function useNoteTags() {
  const notes = useNotes();
  const actions = useNotesActions();

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  const getTagUsage = useCallback((): Record<string, number> => {
    const tagUsage: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagUsage[tag] = (tagUsage[tag] || 0) + 1;
      });
    });
    return tagUsage;
  }, [notes]);

  const getNotesByTag = useCallback((tag: string): Note[] => {
    return notes.filter(note => note.tags.includes(tag));
  }, [notes]);

  return {
    allTags: getAllTags(),
    tagUsage: getTagUsage(),
    addTag: actions.addTag,
    removeTag: actions.removeTag,
    getNotesByTag,
  };
}

export function useNoteFavorites() {
  const notes = useNotes();
  const actions = useNotesActions();

  const favoriteNotes = notes.filter(note => note.is_favorite && !note.is_archived);

  return {
    favoriteNotes,
    toggleFavorite: actions.toggleFavorite,
    hasFavorites: favoriteNotes.length > 0,
  };
}

export function useRecentNotes(limit = 10) {
  const notes = useNotes();

  const recentNotes = notes
    .filter(note => !note.is_archived)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);

  return { recentNotes };
} 