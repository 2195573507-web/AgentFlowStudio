import React, { useState, useCallback } from 'react';
import {
  GitBranch,
  GitCommit,
  FolderOpen,
  Copy,
  Check,
  Brain,
  Clock,
  User,
  Hash,
  FileCode,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Terminal,
  FolderGit2,
  ChevronRight,
  Sparkles,
  PackageCheck,
  TestTube2,
} from 'lucide-react';
import { api } from '../lib/api';
import { GlassCard, EmptyState, Button, Input, Badge } from '../components/';
import type { GitCommitEntry, ReleaseStatus, ReleaseTestStatus } from '../lib/types';
import { generateId, formatDate, formatRelativeDate, copyToClipboard, classNames, truncate } from '../lib/utils';

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_COMMITS: GitCommitEntry[] = [
  {
    hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    message: 'feat: add memory injection system with configurable modes',
    author: 'Developer',
    date: new Date(Date.now() - 1 * 3600e3).toISOString(),
    files: ['src/lib/memoryInjection.ts', 'src/components/MemoryConfig.tsx', 'src/types/index.ts'],
  },
  {
    hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    message: 'fix: resolve streaming response buffer overflow',
    author: 'Developer',
    date: new Date(Date.now() - 3 * 3600e3).toISOString(),
    files: ['src/main/ai/streaming.ts', 'src/main/ipc/handlers.ts'],
  },
  {
    hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    message: 'refactor: extract IPC handlers into separate modules',
    author: 'Developer',
    date: new Date(Date.now() - 8 * 3600e3).toISOString(),
    files: [
      'src/main/ipc/index.ts',
      'src/main/ipc/projects.ts',
      'src/main/ipc/tasks.ts',
      'src/main/ipc/prompts.ts',
      'src/main/ipc/memory.ts',
    ],
  },
  {
    hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
    message: 'feat: add TaskBoard component with drag-and-drop',
    author: 'Developer',
    date: new Date(Date.now() - 24 * 3600e3).toISOString(),
    files: ['src/renderer/components/TaskBoard.tsx', 'src/renderer/components/TaskCard.tsx'],
  },
  {
    hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
    message: 'chore: configure electron-builder for cross-platform builds',
    author: 'Developer',
    date: new Date(Date.now() - 48 * 3600e3).toISOString(),
    files: ['electron-builder.yml', 'package.json'],
  },
];

// ── Component ──────────────────────────────────────────────────────────────
const TEST_STATUS_CLASS: Record<ReleaseTestStatus, string> = {
  PASS: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25 dark:text-emerald-300',
  FAIL: 'bg-red-500/15 text-red-600 border-red-500/25 dark:text-red-300',
  BLOCKED: 'bg-amber-500/15 text-amber-600 border-amber-500/25 dark:text-amber-300',
  UNKNOWN: 'bg-slate-500/15 text-slate-600 border-slate-500/25 dark:text-slate-300',
};

export default function GitTimeline() {
  const [repoPath, setRepoPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [commits, setCommits] = useState<GitCommitEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    branch: string;
    totalCommits: number;
    recentActivity: string;
  } | null>(null);
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [memoryGenerated, setMemoryGenerated] = useState(false);
  const [generatingMemory, setGeneratingMemory] = useState(false);

  // ── Browse path ────────────────────────────────────────────────────────
  const handleBrowse = async () => {
    try {
      if (api && typeof api.dialog?.open === 'function') {
        const result = await api.dialog.open({ properties: ['openDirectory'] });
        if (result && !result.canceled && result.filePaths?.length > 0) {
          setRepoPath(result.filePaths[0]);
        }
      } else {
        // Fallback for browser mode
        const path = prompt('请输入 Git 仓库路径:');
        if (path) setRepoPath(path);
      }
    } catch {}
  };

  // ── Read git log ──────────────────────────────────────────────────────
  const handleReadGitLog = useCallback(async () => {
    if (!repoPath.trim()) {
      setError('请先输入或选择 Git 仓库路径');
      return;
    }

    setLoading(true);
    setError(null);
    setCommits([]);
    setSummary(null);
    setReleaseStatus(null);
    setMemoryGenerated(false);

    try {
      if (api && typeof api.git?.readLog === 'function') {
        const [result, status] = await Promise.all([
          api.git.readLog(repoPath, { maxCount: 50 }),
          api.release.status(repoPath),
        ]);
        if (result.error) {
          setError(result.error);
          return;
        }
        setCommits(result.commits || []);
        setReleaseStatus(status);
        setSummary({
          branch: status.branch || result.branch || 'unknown',
          totalCommits: result.totalCommits || status.recentCommits.length || 0,
          recentActivity: status.gitStatus || result.recentActivity || '',
        });
      } else {
        // Demo mode: simulate git log
        await new Promise((r) => setTimeout(r, 1000));
        setCommits(DEMO_COMMITS);
        setReleaseStatus({
          version: 'demo',
          branch: 'main',
          gitStatus: 'Clean working tree.',
          recentCommits: DEMO_COMMITS.slice(0, 5),
          updateSummary: ['工作流模板、新手路径、执行追踪和安全提示已进入本轮优化计划。'],
          testResults: [
            { command: 'npm.cmd run smoke', status: 'PASS', details: 'Demo status' },
          ],
          progressSummary: ['继续补齐真实仓库测试状态。'],
          checkedAt: new Date().toISOString(),
        });
        setSummary({
          branch: 'main',
          totalCommits: 128,
          recentActivity: '过去 7 天: 15 次提交，5 个活跃文件',
        });
      }
    } catch (err: any) {
      setError(err?.message || '读取 Git 日志失败。请确认路径是有效的 Git 仓库。');
    } finally {
      setLoading(false);
    }
  }, [repoPath]);

  // ── Generate memory ───────────────────────────────────────────────────
  const handleGenerateMemory = async () => {
    if (commits.length === 0) return;
    setGeneratingMemory(true);
    try {
      const memoryContent = `## Git 摘要: ${repoPath}\n\n` +
        `分支: ${summary?.branch || 'unknown'}\n` +
        `总提交数: ${summary?.totalCommits || commits.length}\n\n` +
        `### 最近提交\n` +
        commits.slice(0, 10).map((c) =>
          `- [${c.hash.slice(0, 7)}] ${c.message} (${c.author}, ${formatDate(c.date)})`
        ).join('\n');

      if (api && typeof api.memory?.create === 'function') {
        await api.memory.create({
          type: 'git_summary',
          title: `Git 摘要: ${repoPath.split('/').pop() || repoPath.split('\\').pop()}`,
          content: memoryContent,
          tags: ['git', 'auto-generated', 'summary'],
          importance: 3,
          status: 'active',
          lastUsedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any);
      }
      setMemoryGenerated(true);
      setTimeout(() => setMemoryGenerated(false), 3000);
    } catch {} finally {
      setGeneratingMemory(false);
    }
  };

  // ── Copy hash ─────────────────────────────────────────────────────────
  const handleCopyHash = async (hash: string) => {
    await copyToClipboard(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // ── File extension color ──────────────────────────────────────────────
  const fileColor = (filename: string) => {
    if (filename.endsWith('.tsx')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (filename.endsWith('.ts')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (filename.endsWith('.css') || filename.endsWith('.scss')) return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    if (filename.endsWith('.json') || filename.endsWith('.yml') || filename.endsWith('.yaml'))
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (filename.endsWith('.md')) return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  // ── Compute timeline positioning ──────────────────────────────────────
  const hasData = commits.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Git 时间线</h1>
        <p className="text-zinc-400 text-sm mt-1">可视化 Git 提交历史，生成开发摘要记忆</p>
      </div>

      {/* Path input */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FolderGit2 className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-zinc-300">仓库路径</h2>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="/path/to/your/git/repo"
              onKeyDown={(e) => e.key === 'Enter' && handleReadGitLog()}
            />
          </div>
          <Button variant="ghost" onClick={handleBrowse} icon={<FolderOpen className="w-4 h-4" />}>
            浏览
          </Button>
          <Button
            onClick={handleReadGitLog}
            loading={loading}
            disabled={!repoPath.trim()}
            icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
          >
            读取 Git 日志
          </Button>
        </div>
      </GlassCard>

      {/* Loading */}
      {loading && (
        <GlassCard className="p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">正在读取 Git 日志...</p>
          <p className="text-xs text-zinc-600 mt-1">{repoPath}</p>
        </GlassCard>
      )}

      {/* Error */}
      {error && !loading && (
        <GlassCard className="p-8 text-center border-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-200 mb-2">读取失败</h3>
          <p className="text-sm text-zinc-400 mb-4 max-w-md mx-auto">{error}</p>
          <div className="text-xs text-zinc-500 space-y-1">
            <p>建议检查：</p>
            <ul className="list-disc list-inside text-zinc-600">
              <li>路径是否为有效的 Git 仓库</li>
              <li>是否已安装 Git 命令行工具</li>
              <li>文件夹权限是否正确</li>
            </ul>
          </div>
          <div className="mt-4">
            <Button variant="ghost" onClick={handleReadGitLog} icon={<RefreshCw className="w-4 h-4" />}>
              重试
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Empty repo */}
      {!loading && !error && hasData && commits.length === 0 && (
        <GlassCard className="p-12">
          <EmptyState
            icon={GitCommit}
            title="仓库无提交记录"
            description="该仓库尚未有任何 Git 提交"
          />
        </GlassCard>
      )}

      {/* Summary */}
      {summary && hasData && (
        <GlassCard className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{summary.totalCommits}</div>
              <div className="text-[11px] text-zinc-500 mt-1">总提交数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{summary.branch}</div>
              <div className="text-[11px] text-zinc-500 mt-1">当前分支</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{commits.length}</div>
              <div className="text-[11px] text-zinc-500 mt-1">已加载</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {new Set(commits.flatMap((c) => c.files)).size}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">涉及文件</div>
            </div>
          </div>
          {summary.recentActivity && (
            <p className="text-xs text-zinc-500 mt-4 text-center">{summary.recentActivity}</p>
          )}
        </GlassCard>
      )}

      {releaseStatus && hasData && (
        <GlassCard className="p-5 space-y-4" data-testid="release-status-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">GitHub 版本记录</h2>
                <Badge variant="info">v{releaseStatus.version}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                当前分支 {releaseStatus.branch} · HEAD {releaseStatus.recentCommits[0]?.hash.slice(0, 7) || 'unknown'} · {releaseStatus.gitStatus}
              </p>
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-300">
                测试状态来自 handoff/TEST_REPORT.md 报告快照，请以本轮实际命令退出码为准。
              </p>
            </div>
            <Button
              onClick={handleGenerateMemory}
              loading={generatingMemory}
              disabled={memoryGenerated}
              icon={memoryGenerated ? <Check className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            >
              {memoryGenerated ? '记忆已生成' : '生成 Git 总结记忆'}
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-accent-500" />
                本轮更新摘要
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-zinc-300">
                {releaseStatus.updateSummary.slice(0, 4).map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`} className="flex gap-2">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <TestTube2 className="h-3.5 w-3.5 text-blue-400" />
                最新测试状态
              </div>
              <div className="space-y-1.5">
                {(releaseStatus.testResults.length ? releaseStatus.testResults : [
                  { command: '等待测试记录', status: 'UNKNOWN' as const, details: 'handoff/TEST_REPORT.md 暂无可解析记录' },
                ]).slice(0, 4).map((test, testIndex) => (
                  <div key={`${test.command}-${test.status}-${testIndex}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-slate-600 dark:text-zinc-300">{test.command}</span>
                    <Badge className={TEST_STATUS_CLASS[test.status]}>{test.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Generate memory button */}
      {hasData && !releaseStatus && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerateMemory}
            loading={generatingMemory}
            disabled={memoryGenerated}
            icon={memoryGenerated ? <Check className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
          >
            {memoryGenerated ? '记忆已生成' : '生成 Git 总结记忆'}
          </Button>
        </div>
      )}

      {/* Commit timeline */}
      {hasData && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/30 via-blue-500/20 to-transparent" />

          <div className="space-y-4 ml-10">
            {commits.map((commit, index) => (
              <div key={commit.hash} className="relative">
                {/* Timeline dot */}
                <div
                  className={classNames(
                    'absolute -left-[34px] top-4 w-3.5 h-3.5 rounded-full border-2',
                    index === 0
                      ? 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/20'
                      : 'bg-zinc-800 border-zinc-600'
                  )}
                />

                <GlassCard className="p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Commit hash */}
                      <div className="flex items-center gap-2 mb-2">
                        <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                        <code className="text-xs text-orange-400 font-mono cursor-pointer hover:underline"
                              onClick={() => handleCopyHash(commit.hash)}>
                          {commit.hash.slice(0, 7)}
                        </code>
                        <button
                          onClick={() => handleCopyHash(commit.hash)}
                          className="p-0.5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          {copiedHash === commit.hash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        {index === 0 && (
                          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]">
                            HEAD
                          </Badge>
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-sm text-zinc-200 font-medium mb-2">{commit.message}</p>

                      {/* Author + date */}
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {commit.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatRelativeDate(commit.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(commit.date)}
                        </span>
                      </div>

                      {/* Changed files */}
                      {commit.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {commit.files.map((file, fileIndex) => (
                            <Badge key={`${commit.hash}-${file}-${fileIndex}`} className={`text-[10px] ${fileColor(file)}`}>
                              <FileCode className="w-3 h-3 mr-0.5" />
                              {file}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !error && !hasData && (
        <GlassCard className="p-12">
          <EmptyState
            icon={FolderGit2}
            title="选择 Git 仓库"
            description="输入或浏览选择本地 Git 仓库路径，点击「读取 Git 日志」查看提交时间线"
            actionLabel="选择文件夹"
            onAction={handleBrowse}
          />
        </GlassCard>
      )}
    </div>
  );
}
