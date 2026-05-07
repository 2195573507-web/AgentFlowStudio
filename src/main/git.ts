import simpleGit, { SimpleGit, LogResult, StatusResult } from 'simple-git';
import type { GitCommitEntry } from '../shared/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a plain array of { hash, message, author, date, files } from a log
 * result produced by simple-git.
 */
function normaliseLog(log: LogResult): GitCommitEntry[] {
  return log.all.map((entry) => ({
    hash: entry.hash,
    message: entry.message,
    author: entry.author_name,
    date: entry.date,
    files: [], // simple-git log does not include changed files per commit by default
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getGitLog(repoPath: string): Promise<GitCommitEntry[]> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return [];
    const log: LogResult = await git.log({ maxCount: 200 });
    return normaliseLog(log);
  } catch {
    return [];
  }
}

export async function getGitStatus(repoPath: string): Promise<string> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return 'Not a git repository.';
    const status: StatusResult = await git.status();
    const lines: string[] = [];
    if (status.modified.length) lines.push(`Modified: ${status.modified.join(', ')}`);
    if (status.created.length) lines.push(`Created: ${status.created.join(', ')}`);
    if (status.deleted.length) lines.push(`Deleted: ${status.deleted.join(', ')}`);
    if (status.staged.length) lines.push(`Staged: ${status.staged.join(', ')}`);
    if (status.renamed.length) lines.push(`Renamed: ${status.renamed.map((r) => `${r.from}->${r.to}`).join(', ')}`);
    if (status.not_added.length) lines.push(`Untracked: ${status.not_added.join(', ')}`);
    if (!lines.length) return 'Clean working tree.';
    return lines.join('\n');
  } catch {
    return 'Unable to read git status.';
  }
}

export interface GitSummary {
  branch: string;
  commitCount: number;
  recentCommits: GitCommitEntry[];
}

export async function getGitSummary(repoPath: string): Promise<GitSummary> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return { branch: '', commitCount: 0, recentCommits: [] };
    }
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    const log: LogResult = await git.log({ maxCount: 10 });
    return {
      branch: branch.trim(),
      commitCount: log.total,
      recentCommits: normaliseLog(log),
    };
  } catch {
    return { branch: '', commitCount: 0, recentCommits: [] };
  }
}
