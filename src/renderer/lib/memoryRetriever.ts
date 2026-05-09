import type { Memory, MemoryType, MemoryInjectionMode } from '../../shared/types';

/**
 * Options controlling which memories are retrieved and how they are capped.
 */
export interface RetrieveOptions {
  /** Filter to a specific project. */
  projectId?: string;
  /** Filter to a specific provider scope. */
  providerScope?: string;
  /** Filter to specific memory types. */
  types?: MemoryType[];
  /** Injection mode determines filtering and sorting strategy. */
  injectionMode: MemoryInjectionMode;
  /** Maximum number of memories to return (default 10). */
  maxItems?: number;
  /** Maximum total character count across returned memories (default 3000). */
  maxChars?: number;
}

// ── Defaults ──

const DEFAULT_MAX_ITEMS = 10;
const DEFAULT_MAX_CHARS = 3000;

// ── Secret detection patterns ──
// We use simplified patterns here to avoid a circular dependency on
// secretRedaction.ts; these serve as a first-pass filter.

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/,
  /Bearer\s+[a-zA-Z0-9_.-]+/i,
  /authorization\s*[=:]\s*['"]?[^'"\s]+['"]?/i,
  /api_key\s*[=:]\s*['"]?[a-zA-Z0-9_.-]+['"]?/,
  /apiKey\s*[=:]\s*['"]?[a-zA-Z0-9_.-]+['"]?/,
  /password\s*[=:]\s*['"]?[^'"\s]+['"]?/i,
  /secret\s*[=:]\s*['"]?[^'"\s]+['"]?/i,
  /access_token\s*[=:]\s*['"]?[^'"\s]+['"]?/i,
  /refresh_token\s*[=:]\s*['"]?[^'"\s]+['"]?/i,
  /(?:^|[\s,{])token\s*[=:]\s*['"]?[^'"\s]+['"]?/i,
  /AIza[0-9A-Za-z_-]{35}/,
  /hf_[a-zA-Z0-9]{25,}/,
];

/**
 * Quick check: does the given text look like it contains a secret?
 */
function looksLikeSecret(text: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(text));
}

// ── Public API ──

/**
 * Retrieve and filter memories based on the injection mode and other options.
 *
 * The function does NOT mutate the input array.
 */
export function retrieveMemories(
  memories: Memory[],
  options: RetrieveOptions,
): Memory[] {
  const {
    projectId,
    providerScope,
    types,
    injectionMode,
    maxItems = DEFAULT_MAX_ITEMS,
    maxChars = DEFAULT_MAX_CHARS,
  } = options;

  // --- Step 0: If mode is 'off', return nothing ---
  if (injectionMode === 'off') {
    return [];
  }

  // --- Step 1: Filter ---
  let filtered = [...memories];

  if (projectId) {
    filtered = filtered.filter((m) => m.projectId === projectId);
  }

  if (providerScope) {
    filtered = filtered.filter(
      (m) =>
        m.providerScope === providerScope ||
        m.providerScope === '' ||
        m.providerScope === 'all' ||
        !m.providerScope,
    );
  }

  if (types && types.length > 0) {
    filtered = filtered.filter((m) => types!.includes(m.type));
  }

  // --- Step 2: Apply injection-mode-specific filtering ---
  switch (injectionMode) {
    case 'minimal':
      // Top N active memories by importance
      filtered = filtered
        .filter((m) => m.status === 'active')
        .sort((a, b) => b.importance - a.importance);
      break;

    case 'balanced':
      // Active memories, with relevant types prioritised
      filtered = filtered
        .filter((m) => m.status === 'active')
        .sort((a, b) => {
          // Priority types come first
          const priorityTypes: MemoryType[] = [
            'project_context',
            'decision',
            'user_preference',
          ];
          const aPriority = priorityTypes.includes(a.type) ? 0 : 1;
          const bPriority = priorityTypes.includes(b.type) ? 0 : 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
          // Within the same priority group, sort by importance
          return b.importance - a.importance;
        });
      break;

    case 'full':
      // All active + pending, sorted by importance
      filtered = filtered
        .filter((m) => m.status === 'active' || m.status === 'pending')
        .sort((a, b) => b.importance - a.importance);
      break;

    default:
      break;
  }

  // --- Step 3: Exclude memories that look like secrets ---
  filtered = filtered.filter(
    (m) => !looksLikeSecret(m.title) && !looksLikeSecret(m.content),
  );

  // --- Step 4: Apply maxItems cap ---
  if (filtered.length > maxItems) {
    filtered = filtered.slice(0, maxItems);
  }

  // --- Step 5: Apply maxChars cap ---
  let totalChars = 0;
  const capped: Memory[] = [];

  for (const mem of filtered) {
    const memChars = mem.title.length + mem.content.length;
    if (totalChars + memChars > maxChars && capped.length > 0) {
      // We already have at least one memory; stop adding to stay under the limit
      continue;
    }
    capped.push(mem);
    totalChars += memChars;
  }

  return capped;
}
