import { 
  format, 
  formatDistance, 
  formatRelative, 
  isToday, 
  isYesterday, 
  isThisWeek, 
  isThisMonth, 
  isThisYear,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays
} from 'date-fns';

import { DATE_FORMATS } from './constants';

/**
 * Format a date using the app's standard display format
 */
export function formatDisplayDate(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return format(parsedDate, DATE_FORMATS.DISPLAY);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date with time using the app's standard format
 */
export function formatDisplayDateTime(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return format(parsedDate, DATE_FORMATS.DISPLAY_WITH_TIME);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date for use in file names (no special characters)
 */
export function formatFileNameDate(date: string | Date = new Date()): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return format(new Date(), DATE_FORMATS.FILE_NAME);
    }
    return format(parsedDate, DATE_FORMATS.FILE_NAME);
  } catch {
    return format(new Date(), DATE_FORMATS.FILE_NAME);
  }
}

/**
 * Format a date in ISO format for API calls
 */
export function formatISODate(date: string | Date = new Date()): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return new Date().toISOString();
    }
    return parsedDate.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }

    const now = new Date();
    
    // If it's today, show relative time
    if (isToday(parsedDate)) {
      const hoursAgo = differenceInHours(now, parsedDate);
      const minutesAgo = differenceInMinutes(now, parsedDate);
      
      if (minutesAgo < 1) {
        return 'Just now';
      } else if (minutesAgo < 60) {
        return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
      } else {
        return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
      }
    }
    
    // If it's yesterday
    if (isYesterday(parsedDate)) {
      return 'Yesterday';
    }
    
    // If it's this week, show day name
    if (isThisWeek(parsedDate)) {
      return format(parsedDate, 'EEEE'); // Monday, Tuesday, etc.
    }
    
    // If it's this month, show "MMM dd"
    if (isThisMonth(parsedDate)) {
      return format(parsedDate, 'MMM dd');
    }
    
    // If it's this year, show "MMM dd"
    if (isThisYear(parsedDate)) {
      return format(parsedDate, 'MMM dd');
    }
    
    // Otherwise show full date
    return format(parsedDate, DATE_FORMATS.DISPLAY);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date for human-readable relative time (e.g., "about 2 hours ago")
 */
export function formatDistanceDate(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return formatDistance(parsedDate, new Date(), { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Get a smart relative date that shows the most appropriate format
 */
export function getSmartRelativeDate(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }

    const now = new Date();
    const minutesAgo = differenceInMinutes(now, parsedDate);
    const hoursAgo = differenceInHours(now, parsedDate);
    const daysAgo = differenceInDays(now, parsedDate);

    // Less than 5 minutes ago
    if (minutesAgo < 5) {
      return 'Just now';
    }
    
    // Less than 1 hour ago
    if (minutesAgo < 60) {
      return `${minutesAgo}m ago`;
    }
    
    // Less than 24 hours ago
    if (hoursAgo < 24) {
      return `${hoursAgo}h ago`;
    }
    
    // Less than 7 days ago
    if (daysAgo < 7) {
      return `${daysAgo}d ago`;
    }
    
    // More than a week ago, show the actual date
    return formatDisplayDate(parsedDate);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Check if a date is recent (within the last 24 hours)
 */
export function isRecent(date: string | Date): boolean {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return false;
    }
    const hoursAgo = differenceInHours(new Date(), parsedDate);
    return hoursAgo <= 24;
  } catch {
    return false;
  }
}

/**
 * Check if a date is older than a specified number of days
 */
export function isOlderThan(date: string | Date, days: number): boolean {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return false;
    }
    const daysAgo = differenceInDays(new Date(), parsedDate);
    return daysAgo > days;
  } catch {
    return false;
  }
}

/**
 * Get date range for common filters
 */
export function getDateRange(range: 'today' | 'yesterday' | 'this-week' | 'this-month' | 'last-7-days' | 'last-30-days'): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  
  switch (range) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
      
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      };
      
    case 'this-week':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };
      
    case 'this-month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
      
    case 'last-7-days':
      return {
        start: startOfDay(subDays(now, 7)),
        end: endOfDay(now),
      };
      
    case 'last-30-days':
      return {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now),
      };
      
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
  }
}

/**
 * Parse a date string safely
 */
export function safeParseDateISO(dateString: string): Date | null {
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Get time ago text with smart formatting
 */
export function getTimeAgo(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);
    
    if (seconds < 60) {
      return 'just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d`;
    }
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return `${weeks}w`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months}mo`;
    }
    
    const years = Math.floor(days / 365);
    return `${years}y`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  try {
    const parsed1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const parsed2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    
    if (!isValid(parsed1) || !isValid(parsed2)) {
      return false;
    }
    
    return format(parsed1, 'yyyy-MM-dd') === format(parsed2, 'yyyy-MM-dd');
  } catch {
    return false;
  }
}

/**
 * Get reading time estimate based on word count
 */
export function getReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  if (wordCount <= 0) {
    return 0;
  }
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 0) {
    return 'Less than 1 min read';
  }
  if (minutes === 1) {
    return '1 min read';
  }
  if (minutes < 60) {
    return `${minutes} min read`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} read`;
  }
  
  return `${hours}h ${remainingMinutes}m read`;
} 