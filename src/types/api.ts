import type { Note, NoteSearchResult, NotesFilter } from './note';
import type { FileAttachment } from './file';

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  request_id?: string;
}

// API Error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field_errors?: FieldError[];
  stack_trace?: string; // Only in development
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

// Notes API
export interface NotesListResponse extends PaginatedResponse<Note> {
  filters_applied: NotesFilter;
}

export interface NoteResponse {
  note: Note;
  files?: FileAttachment[];
  children_count?: number;
  parent_note?: Pick<Note, 'id' | 'title'>;
}

export interface NotesSearchResponse {
  results: NoteSearchResult[];
  total_results: number;
  search_time_ms: number;
  query: string;
  filters?: NotesFilter;
  suggestions?: string[];
}

// AI API
export interface AiCompletionRequest {
  prompt: string;
  context?: string;
  max_tokens?: number;
  temperature?: number;
  note_id?: string;
}

export interface AiCompletionResponse {
  completion: string;
  tokens_used: number;
  model: string;
  confidence_score?: number;
  processing_time_ms: number;
}

export interface AiSearchRequest {
  query: string;
  note_ids?: string[];
  limit?: number;
  semantic_threshold?: number;
}

export interface AiSearchResponse {
  results: AiSearchResult[];
  total_results: number;
  processing_time_ms: number;
  query_embedding?: number[]; // For debugging
}

export interface AiSearchResult {
  note_id: string;
  note_title: string;
  note_content_snippet: string;
  relevance_score: number;
  match_snippets: string[];
  note: Note;
}

// File API
export interface FileUploadResponse {
  file: FileAttachment;
  upload_time_ms: number;
}

export interface FilesListResponse extends PaginatedResponse<FileAttachment> {
  total_size: number;
  storage_quota: {
    used: number;
    available: number;
    total: number;
  };
}

// Export API
export interface ExportRequest {
  note_ids: string[];
  format: 'markdown' | 'pdf' | 'json' | 'zip';
  include_children?: boolean;
  include_files?: boolean;
  export_options?: ExportOptions;
}

export interface ExportOptions {
  // PDF options
  page_size?: 'A4' | 'Letter' | 'Legal';
  margin?: number;
  include_toc?: boolean;
  
  // Markdown options
  include_frontmatter?: boolean;
  wrap_width?: number;
  
  // JSON options
  include_metadata?: boolean;
  pretty_print?: boolean;
}

export interface ExportResponse {
  export_id: string;
  download_url: string;
  file_name: string;
  file_size: number;
  format: string;
  expires_at: string;
  processing_time_ms: number;
}

export interface ExportStatus {
  export_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  download_url?: string;
  created_at: string;
  completed_at?: string;
}

// Sync API
export interface SyncRequest {
  notes: Note[];
  files?: FileAttachment[];
  last_sync_timestamp?: string;
  client_id: string;
}

export interface SyncResponse {
  updated_notes: Note[];
  deleted_note_ids: string[];
  updated_files: FileAttachment[];
  deleted_file_ids: string[];
  conflicts: SyncConflict[];
  server_timestamp: string;
}

export interface SyncConflict {
  type: 'note' | 'file';
  item_id: string;
  client_version: number;
  server_version: number;
  conflict_resolution: 'client_wins' | 'server_wins' | 'manual_required';
  client_data: Note | FileAttachment;
  server_data: Note | FileAttachment;
}

// WebSocket API (for real-time updates)
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  data: T;
  timestamp: string;
  sender_id?: string;
}

export type WebSocketMessageType = 
  | 'note_created'
  | 'note_updated' 
  | 'note_deleted'
  | 'file_uploaded'
  | 'file_deleted'
  | 'sync_status'
  | 'user_connected'
  | 'user_disconnected'
  | 'typing_start'
  | 'typing_stop';

export interface NoteUpdateMessage {
  note_id: string;
  updates: Partial<Note>;
  user_id?: string;
}

export interface TypingMessage {
  note_id: string;
  user_id: string;
  user_name: string;
}

// Health check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: ServiceStatus;
    storage: ServiceStatus;
    ai: ServiceStatus;
    redis?: ServiceStatus;
  };
  uptime: number;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms?: number;
  error_message?: string;
  last_check: string;
}

// Rate limiting
export interface RateLimitResponse {
  rate_limit_exceeded: boolean;
  limit: number;
  remaining: number;
  reset_time: string;
  retry_after?: number;
}

// Batch operations
export interface BatchRequest<T> {
  operations: BatchOperation<T>[];
  transaction?: boolean; // If true, all operations must succeed
}

export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  data: T;
  id?: string;
}

export interface BatchResponse<T> {
  results: BatchResult<T>[];
  success_count: number;
  error_count: number;
  total_count: number;
}

export interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  operation_index: number;
} 