import React, { useCallback, useEffect, useState } from 'react';
import { Bot, CheckCircle2, FileCode, HelpCircle, PlayCircle, Plus, Puzzle, RefreshCw, Shield, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Button, EmptyState, SurfaceCard, Input } from '../components/';
import type { AgentRecord, SkillMeta, SkillRegistryEntry } from '../lib/types';
import { AGENT_TEMPLATES, createDemoAgent } from '../../shared/agentCore';

export default function Skills() {
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [registry, setRegistry] = useState<SkillRegistryEntry[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [skillList, registryList, agentList] = await Promise.all([
        api.skills.list().catch(() => []),
        api.skills.registry().catch(() => []),
        api.agents.list().catch(() => []),
      ]);
      if (Array.isArray(skillList)) setSkills(skillList);
      if (Array.isArray(registryList)) setRegistry(registryList);
      if (Array.isArray(agentList)) setAgents(agentList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createTemplateAgent = async (templateId: string) => {
    const template = AGENT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    const created = await api.agents.create({
      name: template.name,
      description: template.description,
      type: template.type,
      status: 'enabled',
      skillsRefs: [],
      lastHealthStatus: template.type === 'demo' ? 'healthy' : 'unknown',
    });
    if ('error' in created) setMessage(`创建失败：${created.error}`);
    else {
      setMessage(`已创建 Agent：${created.name}`);
      await load();
    }
  };

  const createLocalDemoAgent = async () => {
    const demo = createDemoAgent();
    const created = await api.agents.create(demo);
    if ('error' in created) setMessage(`Demo Agent 创建失败：${created.error}`);
    else {
      setMessage('Demo Agent 已创建，可在项目详情中记录本地模拟执行和反馈。');
      await load();
    }
  };

  const filteredSkills = skills.filter((skill) => {
    const value = `${skill.name} ${skill.description} ${skill.filePath ?? skill.path ?? ''}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-5 animate-pulse">
        <div className="h-10 w-56 rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-44 rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-44 rounded-lg bg-[var(--surface-muted)]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">Agent 与 Skills 中心</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
            统一查看 Agent、模板、Skills registry、MCP 关联边界和中文帮助。Skills 本轮只做本地管理骨架，不自动执行外部代码。
          </p>
        </div>
        <Button onClick={load} icon={<RefreshCw className="h-4 w-4" />}>刷新</Button>
      </div>

      {message && <div data-testid="skills-action-message" className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">{message}</div>}

      <SurfaceCard className="p-6 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              <Bot className="h-5 w-5 text-blue-500" /> Agent 管理
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
              支持 list/get/create/update/softDelete/enable/disable/health，以及 execution/timeline/feedback 链路。
            </p>
          </div>
          <Button onClick={createLocalDemoAgent} icon={<PlayCircle className="h-4 w-4" />}>一键体验 Demo Agent</Button>
        </div>

        {agents.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{agent.name}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">{agent.description || '暂无描述。'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{agent.type}</Badge>
                      <Badge>{agent.status}</Badge>
                      <Badge>{agent.lastHealthStatus}</Badge>
                      {agent.providerRef && <Badge>{agent.model || agent.providerRef}</Badge>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                    onClick={() => void (agent.status === 'enabled' ? api.agents.disable(agent.id) : api.agents.enable(agent.id)).then(load)}
                    title={agent.status === 'enabled' ? '禁用 Agent' : '启用 Agent'}
                  >
                    {agent.status === 'enabled' ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-4 text-xs text-[var(--text-muted)] dark:text-[var(--text-primary)]0">
                  MCP allowlist: <span className="font-mono">{agent.toolsAllowlistRef || '未绑定'}</span> / Skills: {agent.skillsRefs.length ? agent.skillsRefs.join(', ') : '未绑定'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Bot} title="还没有 Agent" description="从模板创建一个 Agent，或先用 Demo Agent 体验本地执行、日志、时间线和反馈。" actionLabel="创建 Demo Agent" onAction={createLocalDemoAgent} />
        )}
      </SurfaceCard>

      <SurfaceCard className="p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
          <Star className="h-5 w-5 text-amber-500" /> Template Gallery
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AGENT_TEMPLATES.map((template) => (
            <button key={template.id} type="button" onClick={() => void createTemplateAgent(template.id)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-left hover:bg-[var(--surface-muted)]">
              <div className="font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{template.name}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">{template.description}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-blue-500"><Plus className="h-3 w-3" /> 从模板创建</div>
            </button>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
          <Puzzle className="h-5 w-5 text-purple-500" /> Skills registry
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {registry.map((skill) => (
            <div key={skill.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div>
                <div className="font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{skill.name}</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">{skill.description}</p>
              </div>
              <button type="button" onClick={() => void api.skills.toggleRegistry(skill.id, !skill.enabled).then(load)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm">
                {skill.enabled ? '启用' : '禁用'}
              </button>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
          <FileCode className="h-5 w-5 text-cyan-500" /> 本地 Skill 文件
        </h2>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索 skill 名称、描述或路径" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredSkills.map((skill) => (
            <div key={skill.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">{skill.name}</h3>
                {skill.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Shield className="h-4 w-4 text-amber-500" />}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)]">{skill.description || '暂无描述。'}</p>
              <code className="mt-3 block truncate rounded bg-black/10 px-2 py-1 font-mono text-xs dark:bg-[var(--surface-muted)]">{skill.filePath ?? skill.path ?? '未知路径'}</code>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
          <HelpCircle className="h-5 w-5 text-emerald-500" /> Help / Guide
        </h2>
        <div className="grid gap-3 text-sm text-[var(--text-secondary)] dark:text-[var(--text-muted)] md:grid-cols-2">
          <p><strong>Agent</strong> 是可配置的本地执行主体，绑定 Provider、模型、系统提示词、MCP allowlist 和 Skills。</p>
          <p><strong>Provider/API Key</strong> 通过 Settings 保存，密钥只进 Electron safeStorage envelope，界面和日志只显示脱敏结果。</p>
          <p><strong>MCP</strong> 先经过 allowlist 和 sandbox metadata 检查；未允许的 server/tool 会被拒绝并写入 audit/timeline。</p>
          <p><strong>Feedback</strong> 用来记录运行结果好坏、错误复盘和后续修复建议，可从执行记录生成 synthetic feedback。</p>
          <p><strong>Demo Agent</strong> 不需要 API Key，不调用真实外部工具，只用于体验 execution/logs/timeline/feedback 流程。</p>
          <p><strong>权限不足</strong> 时请查看当前角色。Admin 可管理用户和 audit；Owner/Editor 可写项目；Viewer 只能查看。</p>
        </div>
      </SurfaceCard>
    </div>
  );
}
