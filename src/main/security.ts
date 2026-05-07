import * as path from 'path';

// ---------------------------------------------------------------------------
// Path traversal prevention
// ---------------------------------------------------------------------------

/**
 * Sanitize a user-supplied file path to prevent directory traversal attacks.
 *
 * - Resolves the path relative to the current working directory.
 * - Strips null bytes.
 * - Normalises away `..` segments.
 * - Ensures the result stays within `process.cwd()` (or the provided root).
 */
export function sanitizeFilePath(input: string, root?: string): string {
  // Remove null bytes – they can truncate strings in C-level APIs
  let clean = input.replace(/\0/g, '');

  // Resolve to an absolute path
  const base = root ?? process.cwd();
  const resolved = path.resolve(base, clean);

  // Ensure it does not escape the root
  const normalisedRoot = path.resolve(base) + path.sep;
  if (!resolved.startsWith(normalisedRoot) && resolved !== path.resolve(base)) {
    // Fall back to safe path: return root + basename only
    return path.join(base, path.basename(clean));
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// Secrets redaction
// ---------------------------------------------------------------------------

/**
 * Redact common secret patterns from a string so they are safe to display,
 * log, or store.
 *
 * Patterns covered:
 *  - OpenAI-style keys: sk-...
 *  - Bearer tokens: Bearer <token>
 *  - api_key= queries
 *  - password= / password: / "password": patterns
 *  - secret= / secret: / "secret": patterns
 *  - access_token= / access_token: patterns
 *  - refresh_token= / refresh_token: patterns
 */
export function redactSecrets(text: string): string {
  let result = text;

  // sk-... (OpenAI / Anthropic style API keys)
  result = result.replace(/\bsk-[a-zA-Z0-9_-]{10,}\b/g, 'sk-***REDACTED***');

  // Bearer <token>
  result = result.replace(/\bBearer\s+[a-zA-Z0-9._\-+=/]{8,}\b/gi, 'Bearer ***REDACTED***');

  // api_key=... (URL query or config)
  result = result.replace(/(api[_-]?key\s*[=:]\s*)([^\s&,;)}"']+)/gi, '$1***REDACTED***');

  // password=... / password:... / "password":"..."
  result = result.replace(
    /(["']?password["']?\s*[=:]\s*)([^\s,;)}"']+)/gi,
    '$1***REDACTED***',
  );

  // secret=... / "secret":"..."
  result = result.replace(
    /(["']?secret["']?\s*[=:]\s*)([^\s,;)}"']+)/gi,
    '$1***REDACTED***',
  );

  // access_token=... / access_token:...
  result = result.replace(
    /(access[_-]?token\s*[=:]\s*)([^\s&,;)}"']+)/gi,
    '$1***REDACTED***',
  );

  // refresh_token=... / refresh_token:...
  result = result.replace(
    /(refresh[_-]?token\s*[=:]\s*)([^\s&,;)}"']+)/gi,
    '$1***REDACTED***',
  );

  // apiKey="..." or apiKey: "..."
  result = result.replace(
    /(["']?api[_]?[Kk]ey["']?\s*[=:]\s*)([^\s,;)}"']+)/g,
    '$1***REDACTED***',
  );

  return result;
}

// ---------------------------------------------------------------------------
// Command safety validation
// ---------------------------------------------------------------------------

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /rm\s+(-rf?\s+)?\/\b/i, reason: 'Removes files from root filesystem' },
  { pattern: /rm\s+(-rf?\s+)?~(\/|\s|$)/i, reason: 'Removes files from home directory' },
  { pattern: /sudo\b/i, reason: 'Elevates privileges' },
  { pattern: />\s*\/dev\/sd[a-z]\d?/i, reason: 'Writes directly to raw disk device' },
  { pattern: /mkfs\./i, reason: 'Formats a filesystem' },
  { pattern: /dd\s+if=/i, reason: 'Low-level disk copying' },
  { pattern: /\bchmod\s+777\b/i, reason: 'Sets world-writable permissions' },
  { pattern: /fork\s*bomb|:\s*\(\s*\)\s*\{/i, reason: 'Fork bomb pattern detected' },
  { pattern: /curl[\s\S]*\|[\s\S]*(ba)?sh\b/i, reason: 'Piped shell execution from remote URL' },
  { pattern: /wget[\s\S]*-O-[\s\S]*\|[\s\S]*(ba)?sh\b/i, reason: 'Piped shell execution from remote URL' },
  { pattern: /del\s+\/f\s+\/s\s+\/q\s+C:\\/i, reason: 'Force-deletes files from C: drive root (Windows)' },
  { pattern: /rd\s+\/s\s+\/q\s+[A-Z]:\\/i, reason: 'Recursively removes a drive root (Windows)' },
];

export interface CommandValidationResult {
  safe: boolean;
  reason?: string;
}

/**
 * Perform a basic safety check on a shell command.
 *
 * This is a **heuristic** only – it is not a full sandbox.  Production
 * environments should run untrusted commands inside a container/VM.
 */
export function validateCommand(command: string): CommandValidationResult {
  if (!command || command.trim().length === 0) {
    return { safe: true };
  }

  for (const rule of DANGEROUS_PATTERNS) {
    if (rule.pattern.test(command)) {
      return { safe: false, reason: rule.reason };
    }
  }

  return { safe: true };
}
