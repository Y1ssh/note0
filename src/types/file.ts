export interface FileAttachment {
  id: string;
  note_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  file_url: string;
  thumbnail_url?: string;
  storage_path: string;
  upload_status: UploadStatus;
  created_at: string;
  updated_at: string;
  metadata: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number; // for video/audio files
  alt_text?: string;
  caption?: string;
  uploaded_by?: string;
  original_name: string;
  checksum?: string;
  compression_quality?: number;
  custom_properties?: Record<string, unknown>;
}

export interface FileUpload {
  file: File;
  id: string;
  note_id: string;
  progress: number;
  status: UploadStatus;
  error_message?: string;
  preview_url?: string;
  uploaded_file?: FileAttachment;
}

export interface UploadProgress {
  file_id: string;
  progress: number;
  bytes_uploaded: number;
  total_bytes: number;
  upload_speed?: number; // bytes per second
  estimated_time_remaining?: number; // seconds
}

export interface FilePreview {
  id: string;
  file_name: string;
  file_type: FileType;
  file_size: number;
  preview_url?: string;
  thumbnail_url?: string;
  can_preview: boolean;
  preview_component?: 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'code';
}

export interface FileValidation {
  is_valid: boolean;
  error_message?: string;
  warnings?: string[];
  file_info: {
    name: string;
    size: number;
    type: string;
    last_modified: number;
  };
}

export interface FileGallery {
  files: FileAttachment[];
  total_count: number;
  total_size: number;
  filter: FileFilter;
  sort: FileSort;
}

export interface FileFilter {
  file_types?: FileType[];
  size_min?: number;
  size_max?: number;
  uploaded_after?: string;
  uploaded_before?: string;
  search_query?: string;
}

export interface FileSort {
  field: 'file_name' | 'file_size' | 'created_at' | 'file_type';
  order: 'asc' | 'desc';
}

export interface FileOperation {
  type: 'upload' | 'delete' | 'rename' | 'move';
  file_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  error_message?: string;
}

export interface StorageQuota {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  percentage_used: number;
  files_count: number;
  max_file_size: number;
  allowed_file_types: string[];
}

export type UploadStatus = 
  | 'pending' 
  | 'uploading' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type FileType = 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'spreadsheet' 
  | 'presentation' 
  | 'pdf' 
  | 'text' 
  | 'code' 
  | 'archive' 
  | 'other';

export type ImageFormat = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'svg' | 'ico';

export type VideoFormat = 'mp4' | 'webm' | 'ogg' | 'avi' | 'mov' | 'wmv';

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac' | 'm4a' | 'flac';

export type DocumentFormat = 'doc' | 'docx' | 'txt' | 'rtf' | 'odt';

export type CodeFormat = 'js' | 'ts' | 'jsx' | 'tsx' | 'css' | 'html' | 'json' | 'md' | 'py' | 'java' | 'cpp' | 'c' | 'go' | 'rs' | 'php';

// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_NOTE = 50;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];

// Helper functions types
export interface FileUtils {
  getFileType: (mimeType: string) => FileType;
  formatFileSize: (bytes: number) => string;
  isImageFile: (mimeType: string) => boolean;
  isVideoFile: (mimeType: string) => boolean;
  isAudioFile: (mimeType: string) => boolean;
  generateThumbnail: (file: File) => Promise<string>;
  validateFile: (file: File) => FileValidation;
} 