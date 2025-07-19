import type { Note } from './note';
import type { FileAttachment } from './file';

export interface ExportJob {
  id: string;
  status: ExportStatus;
  format: ExportFormat;
  note_ids: string[];
  options: ExportJobOptions;
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  file_path?: string;
  file_size?: number;
  download_url?: string;
  expires_at?: string;
}

export interface ExportJobOptions {
  include_children: boolean;
  include_files: boolean;
  include_archived: boolean;
  compression: boolean;
  format_options: FormatSpecificOptions;
}

export interface FormatSpecificOptions {
  // PDF options
  pdf?: PdfExportOptions;
  
  // Markdown options
  markdown?: MarkdownExportOptions;
  
  // JSON options  
  json?: JsonExportOptions;
  
  // ZIP options
  zip?: ZipExportOptions;
}

export interface PdfExportOptions {
  page_size: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  font_family: string;
  font_size: number;
  line_height: number;
  include_toc: boolean;
  include_page_numbers: boolean;
  include_header: boolean;
  include_footer: boolean;
  header_text?: string;
  footer_text?: string;
  watermark?: string;
  background_color?: string;
  text_color?: string;
  include_images: boolean;
  image_quality: 'low' | 'medium' | 'high';
  compress_images: boolean;
}

export interface MarkdownExportOptions {
  include_frontmatter: boolean;
  frontmatter_format: 'yaml' | 'toml' | 'json';
  wrap_width: number;
  preserve_line_breaks: boolean;
  include_metadata: boolean;
  file_structure: 'single' | 'hierarchy' | 'flat';
  naming_convention: 'title' | 'id' | 'slug';
  include_internal_links: boolean;
  convert_images_to: 'embed' | 'reference' | 'copy';
  code_block_style: 'fenced' | 'indented';
  emphasis_style: 'asterisk' | 'underscore';
  heading_style: 'atx' | 'setext';
}

export interface JsonExportOptions {
  include_metadata: boolean;
  include_timestamps: boolean;
  include_hierarchy: boolean;
  include_file_attachments: boolean;
  pretty_print: boolean;
  indent_size: number;
  format_version: string;
  schema_url?: string;
}

export interface ZipExportOptions {
  folder_structure: 'flat' | 'hierarchy';
  include_index_file: boolean;
  index_format: 'html' | 'markdown' | 'json';
  compression_level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  include_metadata_files: boolean;
  separate_files_folder: boolean;
}

export interface ExportPreview {
  id: string;
  format: ExportFormat;
  estimated_size: number;
  estimated_duration: number; // in seconds
  note_count: number;
  file_count: number;
  total_content_size: number;
  warnings: ExportWarning[];
  can_proceed: boolean;
}

export interface ExportWarning {
  type: 'size_limit' | 'unsupported_format' | 'missing_files' | 'permission_issue';
  message: string;
  affected_items: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface ExportProgress {
  export_id: string;
  status: ExportStatus;
  progress: number;
  current_step: ExportStep;
  steps_completed: number;
  total_steps: number;
  notes_processed: number;
  files_processed: number;
  estimated_time_remaining?: number; // in seconds
  processing_speed?: number; // items per second
}

export interface ExportResult {
  export_id: string;
  success: boolean;
  file_path?: string;
  file_size?: number;
  download_url?: string;
  expires_at?: string;
  processing_time_ms: number;
  notes_exported: number;
  files_exported: number;
  warnings: ExportWarning[];
  error_message?: string;
}

export interface ExportHistory {
  exports: ExportHistoryItem[];
  total_count: number;
  total_size: number;
}

export interface ExportHistoryItem {
  id: string;
  format: ExportFormat;
  created_at: string;
  completed_at?: string;
  status: ExportStatus;
  file_size?: number;
  note_count: number;
  file_count: number;
  download_url?: string;
  expires_at?: string;
  can_redownload: boolean;
}

export interface PrintOptions {
  pages: 'all' | 'current' | 'selection' | 'range';
  page_range?: string; // e.g., "1-5,8,11-13"
  copies: number;
  color: boolean;
  duplex: 'none' | 'long-edge' | 'short-edge';
  collate: boolean;
  paper_size: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: 'minimum' | 'default' | 'custom';
  custom_margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scale: number; // percentage
  headers_footers: boolean;
  background_graphics: boolean;
}

export type ExportFormat = 'markdown' | 'pdf' | 'json' | 'zip' | 'html' | 'docx' | 'txt';

export type ExportStatus = 
  | 'pending' 
  | 'preparing' 
  | 'processing' 
  | 'finalizing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'expired';

export type ExportStep = 
  | 'validating' 
  | 'collecting_notes' 
  | 'collecting_files' 
  | 'processing_content' 
  | 'generating_output' 
  | 'compressing' 
  | 'finalizing';

// Export utility types
export interface ExportUtils {
  estimateExportSize: (noteIds: string[], format: ExportFormat, options: ExportJobOptions) => Promise<number>;
  validateExportRequest: (noteIds: string[], format: ExportFormat) => ExportWarning[];
  generateFilename: (notes: Note[], format: ExportFormat) => string;
  getSupportedFormats: () => ExportFormat[];
  getDefaultOptions: (format: ExportFormat) => FormatSpecificOptions;
}

// Template system for exports
export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  options: ExportJobOptions;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export interface ExportTemplateInput {
  name: string;
  description?: string;
  format: ExportFormat;
  options: ExportJobOptions;
}

// Bulk export operations
export interface BulkExportRequest {
  exports: Array<{
    note_ids: string[];
    format: ExportFormat;
    options: ExportJobOptions;
  }>;
  delivery_method: 'download' | 'email' | 'cloud_storage';
  delivery_options?: DeliveryOptions;
}

export interface DeliveryOptions {
  email?: {
    recipient: string;
    subject?: string;
    message?: string;
  };
  cloud_storage?: {
    provider: 'google_drive' | 'dropbox' | 'onedrive';
    folder_path?: string;
  };
}

export interface BulkExportResponse {
  batch_id: string;
  exports: ExportJob[];
  total_exports: number;
  estimated_completion_time: string;
} 