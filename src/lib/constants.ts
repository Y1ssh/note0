// App Information
export const APP_NAME = 'Note0';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Modern hierarchical note-taking application';

// API Configuration
export const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';
export const API_TIMEOUT = 30000; // 30 seconds

// File Upload Limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_NOTE = 50;
export const MAX_TOTAL_STORAGE = 100 * 1024 * 1024; // 100MB

// Supported File Types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
] as const;

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_VIDEO_TYPES,
  ...SUPPORTED_AUDIO_TYPES,
  ...SUPPORTED_DOCUMENT_TYPES,
] as const;

// Editor Configuration
export const EDITOR_CONFIG = {
  AUTO_SAVE_DELAY: 2000, // 2 seconds
  WORD_WRAP: true,
  LINE_NUMBERS: false,
  SYNTAX_HIGHLIGHTING: true,
  DARK_THEME: true,
  FONT_SIZE: 14,
  FONT_FAMILY: 'JetBrains Mono, Monaco, Consolas, monospace',
  TAB_SIZE: 2,
  INSERT_SPACES: true,
} as const;

// AI Configuration
export const AI_CONFIG = {
  COMPLETION_TRIGGER: '++',
  MAX_COMPLETION_LENGTH: 500,
  COMPLETION_TIMEOUT: 15000, // 15 seconds
  MAX_CONTEXT_LENGTH: 2000,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 150,
  SEARCH_LIMIT: 10,
  SEMANTIC_THRESHOLD: 0.7,
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 300, // milliseconds
  HIGHLIGHT_CLASS: 'search-highlight',
  MAX_SNIPPET_LENGTH: 200,
} as const;

// Note Configuration
export const NOTE_CONFIG = {
  DEFAULT_TITLE: 'Untitled Note',
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 1000000, // 1MB of text
  MAX_HIERARCHY_DEPTH: 10,
  DEFAULT_POSITION: 0,
  AUTO_SAVE_DELAY: 2000,
  VERSION_RETENTION_DAYS: 30,
} as const;

// Export Configuration
export const EXPORT_CONFIG = {
  MAX_EXPORT_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_NOTES_PER_EXPORT: 1000,
  EXPORT_TIMEOUT: 300000, // 5 minutes
  DOWNLOAD_EXPIRY_HOURS: 24,
  SUPPORTED_FORMATS: ['markdown', 'pdf', 'json', 'zip'] as const,
} as const;

// UI Configuration
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_MIN_WIDTH: 200,
  SIDEBAR_MAX_WIDTH: 400,
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
} as const;

// Sync Configuration
export const SYNC_CONFIG = {
  SYNC_INTERVAL: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  OFFLINE_RETRY_DELAY: 5000, // 5 seconds
  CONFLICT_RESOLUTION: 'last_write_wins' as const,
  BATCH_SIZE: 50,
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT_THEME: 'system' as const,
  THEMES: ['light', 'dark', 'system'] as const,
  STORAGE_KEY: 'note0-theme',
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_NOTE: 'cmd+n',
  SAVE_NOTE: 'cmd+s',
  SEARCH: 'cmd+k',
  TOGGLE_SIDEBAR: 'cmd+\\',
  TOGGLE_PREVIEW: 'cmd+shift+p',
  FOCUS_EDITOR: 'cmd+e',
  EXPORT: 'cmd+shift+e',
  DELETE_NOTE: 'cmd+delete',
  DUPLICATE_NOTE: 'cmd+d',
  ARCHIVE_NOTE: 'cmd+shift+a',
  TOGGLE_FAVORITE: 'cmd+shift+f',
} as const;

// URL Patterns
export const URL_PATTERNS = {
  NOTE: '/note/[id]',
  SEARCH: '/search',
  SETTINGS: '/settings',
  EXPORT: '/export',
  API_NOTES: '/api/notes',
  API_FILES: '/api/files',
  API_EXPORT: '/api/export',
  API_AI_COMPLETION: '/api/ai/completion',
  API_AI_SEARCH: '/api/ai/search',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  FILE_TOO_LARGE: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
  UNSUPPORTED_FILE_TYPE: 'This file type is not supported.',
  NOTE_NOT_FOUND: 'Note not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  EXPORT_FAILED: 'Export failed. Please try again.',
  AI_SERVICE_UNAVAILABLE: 'AI service is currently unavailable.',
  SYNC_FAILED: 'Sync failed. Your changes are saved locally.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  NOTE_CREATED: 'Note created successfully.',
  NOTE_UPDATED: 'Note updated successfully.',
  NOTE_DELETED: 'Note deleted successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  EXPORT_STARTED: 'Export started. You will be notified when ready.',
  SYNC_COMPLETED: 'Sync completed successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  NOTES: 'note0-notes',
  FILES: 'note0-files',
  SETTINGS: 'note0-settings',
  THEME: 'note0-theme',
  SIDEBAR_WIDTH: 'note0-sidebar-width',
  EDITOR_PREFERENCES: 'note0-editor-preferences',
  LAST_SYNC: 'note0-last-sync',
  OFFLINE_QUEUE: 'note0-offline-queue',
  AI_PREFERENCES: 'note0-ai-preferences',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  AI_COMPLETION: true, // Can be configured via environment variables in production
  FILE_UPLOADS: true, // Can be configured via environment variables in production
  COLLABORATIVE_EDITING: false, // Future feature
  VERSION_HISTORY: false, // Future feature
  PLUGINS: false, // Future feature
  ADVANCED_SEARCH: true,
  EXPORT_TEMPLATES: false, // Future feature
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  AI_REQUESTS_PER_MINUTE: 10,
  FILE_UPLOADS_PER_HOUR: 50,
  EXPORT_REQUESTS_PER_HOUR: 5,
  SEARCH_REQUESTS_PER_MINUTE: 30,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy at h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  FILE_NAME: 'yyyy-MM-dd_HH-mm-ss',
  RELATIVE_SHORT: 'relative-short', // Custom format for relative dates
} as const;

// Validation Rules
export const VALIDATION = {
  NOTE_TITLE_MIN_LENGTH: 1,
  NOTE_TITLE_MAX_LENGTH: 200,
  TAG_MIN_LENGTH: 1,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS_PER_NOTE: 20,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_REGEX: /^https?:\/\/.+/,
} as const;

// Performance Monitoring
export const PERFORMANCE = {
  SLOW_QUERY_THRESHOLD: 1000, // milliseconds
  LARGE_FILE_THRESHOLD: 1024 * 1024, // 1MB
  MEMORY_WARNING_THRESHOLD: 100 * 1024 * 1024, // 100MB
  RENDER_TIME_WARNING: 100, // milliseconds
} as const; 