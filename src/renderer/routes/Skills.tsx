import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  FileCode,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Code2,
  Package,
  Clock,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import { GlassCard, EmptyState, Button, Badge, Input } from '../components/';
import type { SkillMeta } from '../lib/types';
import { classNames, formatRelativeDate } from '../lib/utils';

// ── Demo data (used when api is unavailable) ───────────────────────────────
const DEMO_SKILLS: SkillMeta[] = [
  {
    name: 'react-component-builder',
    description: 'Builds React components with TypeScript, Tailwind CSS, and proper accessibility patterns.',
    filePath: '.agents/skills/react-component-builder.md',
    valid: true,
    missingFields: [],
    lastModified: new Date(Date.now() - 3 * 864e5).toISOString(),
  },
  {
    name: 'api-integration',
    description: 'Creates API integration layers with type-safe clients, error handling, and retry logic.',
    filePath: '.agents/skills/api-integration.md',
    valid: true,
    missingFields: [],
    lastModified: new Date(Date.now() - 7 * 864e5).toISOString(),
  },
  {
    name: 'database-migration',
    description: 'Generates database migration scripts with rollback support.',
    filePath: '.agents/skills/database-migration.md',
    valid: false,
    missingFields: ['version', 'dependencies'],
    lastModified: new Date(Date.now() - 14 * 864e5).toISOString(),
  },
  {
    name: 'testing-strategy',
    description: '',
    filePath: '.agents/skills/testing-strategy.md',
    valid: false,
    missingFields: ['description', 'category'],
    lastModified: new Date(Date.now() - 21 * 864e5).toISOString(),
  },
  {
    name: 'security-audit',
    description: 'Performs security audits on codebases, checking for common vulnerabilities and OWASP Top 10 risks.',
    filePath: '.agents/skills/security-audit.md',
    valid: true,
    missingFields: [],
    lastModified: new Date(Date.now() - 5 * 864e5).toISOString(),
  },
  {
    name: 'documentation-generator',
    description: 'Generates comprehensive API and code documentation from JSDoc/TSDoc comments.',
    filePath: '.agents/skills/documentation-generator.md',
    valid: true,
    missingFields: [],
    lastModified: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Skills() {
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [apiAvailable, setApiAvailable] = useState(true);

  // ── Fetch skills ──────────────────────────────────────────────────────
  const fetchSkills = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (api && typeof api.skills?.list === 'function') {
        const data = await api.skills.list();
        if (Array.isArray(data) && data.length > 0) {
          setSkills(data);
        } else {
          setSkills(DEMO_SKILLS);
          setApiAvailable(false);
        }
      } else {
        setApiAvailable(false);
        await new Promise((r) => setTimeout(r, 600));
        setSkills(DEMO_SKILLS);
      }
    } catch (err: any) {
      console.error('Skills fetch error:', err);
      setError(err?.message || '无法扫描 skills 目录');
      setSkills(DEMO_SKILLS);
      setApiAvailable(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  // ── Filtered skills ───────────────────────────────────────────────────
  const filteredSkills = React.useMemo(() => {
    if (!search) return skills;
    const q = search.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.filePath ?? s.path ?? '').toLowerCase().includes(q)
    );
  }, [skills, search]);

  // ── Skill counts ──────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const valid = skills.filter((s) => s.valid).length;
    const invalid = skills.filter((s) => !s.valid).length;
    return { total: skills.length, valid, invalid };
  }, [skills]);

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-white/5" />
        <div className="flex gap-3">
          <div className="h-10 w-64 rounded-xl bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error && skills.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">无法扫描 Skills 目录</h2>
          <p className="text-zinc-400 mb-4 max-w-md mx-auto">{error}</p>
          <Button onClick={() => fetchSkills(true)} icon={<RefreshCw className="w-4 h-4" />}>
            重试
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (skills.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <GlassCard className="p-12">
          <EmptyState
            icon={FolderOpen}
            title="未找到 Skills"
            description="在项目根目录创建 .agents/skills/ 目录并添加技能定义文件（.md 格式）"
            actionLabel="刷新扫描"
            onAction={() => fetchSkills(true)}
          />
        </GlassCard>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Skills</h1>
          <p className="text-zinc-400 text-sm mt-1">
            .agents/skills 目录中的 AI 技能定义
          </p>
        </div>
        <Button
          onClick={() => fetchSkills(true)}
          loading={refreshing}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          刷新
        </Button>
      </div>

      {/* Stats bar */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-zinc-300">{stats.total} 个技能</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-zinc-300">{stats.valid} 有效</span>
          </div>
          {stats.invalid > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-zinc-300">{stats.invalid} 无效</span>
            </div>
          )}
          {!apiAvailable && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 ml-auto">
              演示数据
            </Badge>
          )}
        </div>
      </GlassCard>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索技能名称或描述..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm
                     placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Skills grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <GlassCard key={skill.name} className="p-5 flex flex-col">
              {/* Icon + Name + Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={classNames(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      skill.valid
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20'
                    )}
                  >
                    <Code2
                      className={classNames(
                        'w-4 h-4',
                        skill.valid ? 'text-emerald-400' : 'text-amber-400'
                      )}
                    />
                  </div>
                  <h3 className="font-semibold text-zinc-200 text-sm truncate">{skill.name}</h3>
                </div>
                <Badge
                  className={
                    skill.valid
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }
                >
                  {skill.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed flex-1">
                {skill.description || (
                  <span className="text-zinc-600 italic">No description provided</span>
                )}
              </p>

              {/* File path */}
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-2">
                <FileCode className="w-3 h-3 flex-shrink-0" />
                <code className="truncate font-mono">{skill.filePath ?? skill.path ?? 'Unknown path'}</code>
              </div>

              {/* Missing fields warning */}
              {skill.missingFields && skill.missingFields.length > 0 && (
                <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <Info className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-300">
                    Missing: {skill.missingFields.join(', ')}
                  </div>
                </div>
              )}

              {/* Last modified */}
              <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-600">
                <Clock className="w-3 h-3" />
                {formatRelativeDate(skill.lastModified)}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-8">
          <EmptyState
            icon={Search}
            title="没有匹配的技能"
            description={search ? '尝试更改搜索词' : 'Skills 目录中无可显示的技能'}
            actionLabel="清除搜索"
            onAction={() => setSearch('')}
          />
        </GlassCard>
      )}

      {/* Info card about skills */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" /> 关于 Skills
        </h3>
        <div className="text-xs text-zinc-500 space-y-2">
          <p>Skills 是存储在 <code className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">.agents/skills/</code> 目录下的 Markdown 文件，定义了 AI Agent 可执行的专业技能。</p>
          <p>每个 Skill 必须包含 YAML frontmatter 元数据：</p>
          <pre className="p-3 rounded-lg bg-zinc-900/30 text-zinc-400 font-mono text-[11px] overflow-x-auto">
{`---
name: skill-name
description: What this skill does
category: development
version: 1.0.0
dependencies: []
---`}
          </pre>
          <p>Skill 内容应包含：触发场景、执行步骤、检查清单、完成标准。</p>
        </div>
      </GlassCard>
    </div>
  );
}
