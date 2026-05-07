// ── Secret detection patterns ──

interface SecretPattern {
  /** Human-readable name for this pattern. */
  name: string;
  /** Regex that matches the secret. Use capturing groups to isolate the
   *  key-name part vs the secret-value part for redaction. */
  pattern: RegExp;
}

const PATTERNS: SecretPattern[] = [
  // OpenAI / Claude-style API keys: sk-... (at least 20 alphanumeric chars)
  {
    name: 'OpenAI/Claude API Key',
    pattern: /sk-[a-zA-Z0-9_\-]{20,}/g,
  },

  // Bearer tokens
  {
    name: 'Bearer Token',
    pattern: /Bearer\s+([a-zA-Z0-9_\-\.]+)/g,
  },

  // api_key = "value" or api_key: "value"
  {
    name: 'API Key Assignment',
    pattern: /api_key\s*[=:]\s*['"]?([a-zA-Z0-9_\-\.]{8,})['"]?/gi,
  },

  // password = "value" or password: "value"
  {
    name: 'Password Assignment',
    pattern: /password\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  },

  // secret = "value" or secret: "value"
  {
    name: 'Secret Assignment',
    pattern: /secret\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  },

  // access_token = "value" or access_token: "value"
  {
    name: 'Access Token',
    pattern: /access_token\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  },

  // refresh_token = "value" or refresh_token: "value"
  {
    name: 'Refresh Token',
    pattern: /refresh_token\s*[=:]\s*['"]?([^'"\s]{3,})['"]?/gi,
  },

  // Google API keys: AIza... (35 chars)
  {
    name: 'Google API Key',
    pattern: /AIza[0-9A-Za-z\-_]{35}/g,
  },

  // HuggingFace tokens: hf_... (at least 25 alphanumeric chars)
  {
    name: 'HuggingFace Token',
    pattern: /hf_[a-zA-Z0-9]{25,}/g,
  },

  // Generic key=value with "key" or "token" in the key name
  {
    name: 'Generic Key/Token',
    pattern: /(?:private_key|client_secret|secret_key|auth_token)\s*[=:]\s*['"]?([^'"\s]{4,})['"]?/gi,
  },

  // Connection strings (database passwords)
  {
    name: 'Database Connection String',
    pattern: /(?:mongodb|mysql|postgres|postgresql|sqlite|redis):\/\/[^:]+:([^@\s]+)@/gi,
  },
];

// ── Public API ──

/**
 * Check whether the given text contains any detectable secret patterns.
 */
export function containsSecret(text: string): boolean {
  if (!text) return false;
  return PATTERNS.some((p) => {
    // Reset regex state (global flag tracks lastIndex)
    p.pattern.lastIndex = 0;
    return p.pattern.test(text);
  });
}

/**
 * Redact all detectable secrets in the text, replacing the secret value
 * portion with `[REDACTED]` while preserving key names.
 *
 * This is safe for display and export. The original text is not modified.
 */
export function redactSecrets(text: string): string {
  if (!text) return text;

  let result = text;

  for (const { pattern } of PATTERNS) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;

    result = result.replace(pattern, (match, ...args: unknown[]) => {
      // The first capture group (args[0]) is the secret value itself
      const secretValue = args[0] as string | undefined;

      // If there's a captured group, replace it with [REDACTED]
      if (typeof secretValue === 'string' && secretValue.length > 0) {
        // Reconstruct the match with the secret value redacted
        // Find where the captured group starts in the original match
        const groupStart = match.indexOf(secretValue);

        if (groupStart >= 0) {
          return (
            match.slice(0, groupStart) +
            '[REDACTED]' +
            match.slice(groupStart + secretValue.length)
          );
        }
      }

      // No captured group; replace the whole match key
      // For patterns like sk-xxx, the entire match is the secret
      return '[REDACTED]';
    });
  }

  return result;
}

/**
 * Return a report of what types of secrets were found in the text.
 */
export function detectSecretTypes(text: string): string[] {
  if (!text) return [];

  const found: string[] = [];

  for (const { name, pattern } of PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      found.push(name);
    }
  }

  return found;
}

/**
 * Sanitize an object for safe logging — recursively redacts secrets in all
 * string values.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result = Array.isArray(obj) ? ([] as unknown[]) : ({} as Record<string, unknown>);

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = redactSecrets(value);
    } else if (typeof value === 'object' && value !== null) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
      );
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result as T;
}
