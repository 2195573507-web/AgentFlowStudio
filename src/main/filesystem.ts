import * as fs from 'fs/promises';
import * as path from 'path';
import type { SkillMeta } from '../shared/types.js';

// ---------------------------------------------------------------------------
// Basic file-system helpers
// ---------------------------------------------------------------------------

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err: unknown) {
    throw new Error(
      `Failed to create directory "${dirPath}": ${(err as Error).message}`,
    );
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    throw new Error(
      `Failed to read file "${filePath}": ${(err as Error).message}`,
    );
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (err: unknown) {
    throw new Error(
      `Failed to write file "${filePath}": ${(err as Error).message}`,
    );
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listDir(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath);
    return entries;
  } catch (err: unknown) {
    throw new Error(
      `Failed to list directory "${dirPath}": ${(err as Error).message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Skills parser (.agents/skills)
// ---------------------------------------------------------------------------

/**
 * Parse a minimal YAML-like frontmatter block delimited by --- from the
 * top of a SKILL.md file.  We only extract `name` and `description`.
 */
function parseSkillFrontmatter(markdown: string): { name?: string; description?: string } {
  const lines = markdown.split(/\r?\n/);
  if (lines.length === 0) return {};

  // First line must be ---
  if (lines[0].trim() !== '---') return {};

  const endIdx = lines.slice(1).findIndex((l) => l.trim() === '---');
  if (endIdx === -1) return {};

  const fmLines = lines.slice(1, endIdx + 1);
  const result: { name?: string; description?: string } = {};

  for (const line of fmLines) {
    const match = line.match(/^(\w[\w\s]*?)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    if (key === 'name') result.name = value;
    if (key === 'description') result.description = value;
  }

  return result;
}

export async function readSkillsFromDir(skillsDir: string): Promise<SkillMeta[]> {
  const results: SkillMeta[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(skillsDir);
  } catch {
    // Directory does not exist or is unreadable – return empty
    return [];
  }

  for (const entry of entries) {
    const entryPath = path.join(skillsDir, entry);
    try {
      const stat = await fs.stat(entryPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    const skillMdPath = path.join(entryPath, 'SKILL.md');
    try {
      const content = await fs.readFile(skillMdPath, 'utf-8');
      const fm = parseSkillFrontmatter(content);
      const missingFields: string[] = [];
      if (!fm.name) missingFields.push('name');
      if (!fm.description) missingFields.push('description');

      results.push({
        name: fm.name ?? entry,
        description: fm.description ?? '',
        path: skillMdPath,
        valid: missingFields.length === 0,
        missingFields,
      });
    } catch {
      // SKILL.md not found or unreadable – include entry as invalid
      results.push({
        name: entry,
        description: '',
        path: skillMdPath,
        valid: false,
        missingFields: ['SKILL.md missing or unreadable'],
      });
    }
  }

  return results;
}
