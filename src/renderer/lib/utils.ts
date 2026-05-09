// ── ID generation ──

/**
 * Generate a unique identifier.
 * Uses crypto.randomUUID() when available, falls back to a manual v4-like
 * implementation in environments where the Web Crypto API is absent.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: manually construct a v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Date formatting ──

/**
 * Format an ISO-8601 date string into a human-readable localised format.
 * Example: "2025-03-15T10:30:00.000Z" -> "Mar 15, 2025, 6:30 PM"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Return a relative time string (e.g. "2 hours ago", "3 days ago") for the
 * given ISO-8601 date string.
 */
export function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const now = Date.now();
    const diffMs = now - date.getTime();

    // Future dates
    if (diffMs < 0) {
      const abs = Math.abs(diffMs);
      const sec = Math.floor(abs / 1000);
      if (sec < 60) return `${sec} 秒后`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min} 分钟后`;
      const hrs = Math.floor(min / 60);
      if (hrs < 24) return `${hrs} 小时后`;
      const days = Math.floor(hrs / 24);
      if (days < 30) return `${days} 天后`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} 个月后`;
      return `${Math.floor(months / 12)} 年后`;
    }

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return '刚刚';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;

    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} 周前`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} 个月前`;

    return `${Math.floor(months / 12)} 年前`;
  } catch {
    return dateStr;
  }
}

// ── String helpers ──

/**
 * Truncate a string to maxLen characters, appending an ellipsis if truncated.
 */
export function truncate(str: string | undefined | null, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  if (maxLen <= 3) return str.slice(0, maxLen);
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Capitalize the first character of a string.
 */
export function capitalize(str: string | undefined | null): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── CSS class name builder ──

/**
 * Conditionally join class names, filtering out falsy values.
 * Mimics the popular `classnames` / `clsx` utility.
 */
export function classNames(
  ...classes: (string | number | undefined | false | null)[]
): string {
  return classes.filter(Boolean).join(' ');
}

// ── Debounce ──

/**
 * Returns a debounced version of `fn` that delays invocation until `ms`
 * milliseconds have elapsed since the last call.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => unknown,
  ms: number,
): ((...args: Args) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Args): void => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

// ── Clipboard ──

/**
 * Copy text to the system clipboard.
 * Returns true on success, false on failure.
 */
export async function copyToClipboard(text?: string | null): Promise<boolean> {
  const safeText = text ?? '';
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(safeText);
      return true;
    }
    // Fallback for older environments
    const textarea = document.createElement('textarea');
    textarea.value = safeText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

// ── Misc helpers ──

/**
 * Sleep for the given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON, returning `null` on failure instead of throwing.
 */
export function safeJsonParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Deep-clone an object via JSON round-trip. Suitable for plain data objects.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Return a hash of the given string (simple djb2 algorithm). Not cryptographic.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
