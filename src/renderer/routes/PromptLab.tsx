import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wand2,
  Search,
  Star,
  Copy,
  Check,
  Download,
  Save,
  Trash2,
  Sparkles,
  Brain,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Clock,
  FileText,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  PROMPT_TEMPLATES,
  fillTemplate,
  getTemplateByName,
  getTemplateVariableKey,
} from '../lib/templates';
import { generateSharedMemoryContext, injectMemoryIntoPrompt } from '../lib/memoryInjection';
import { exportMarkdown } from '../lib/exporters';
import { GlassCard, EmptyState, Button, Input, Textarea, Badge, PromptPreview, Modal } from '../components/';
import type {
  Memory, SavedPrompt, MemoryInjectionMode, PromptTemplate,
} from '../lib/types';
import { generateId, formatRelativeDate, copyToClipboard, classNames, truncate } from '../lib/utils';

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_SAVED_PROMPTS: SavedPrompt[] = [
  {
    id: 'sp1', name: 'System Architect', templateId: 'system-architect',
    variables: { project_name: 'AI Chat', tech_stack: 'Electron, React' },
    content: 'You are a senior system architect. Design the architecture for AI Chat using Electron, React...',
    starred: true, createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
  {
    id: 'sp2', name: 'Bug Fixer v2', templateId: 'bug-fixer',
    variables: { error_log: 'TypeError: cannot read property...' },
    content: 'Analyze the following error and provide a fix...',
    starred: false, createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function PromptLab() {
  // Templates
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');

  // Variables
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Generation
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Memory injection
  const [injectionMode, setInjectionMode] = useState<MemoryInjectionMode>('off');
  const [memoryContext, setMemoryContext] = useState<string>('');
  const [memories, setMemories] = useState<Memory[]>([]);

  // Saved prompts
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedSearch, setSavedSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  // ── Init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load templates
        setTemplates(PROMPT_TEMPLATES || []);
        if (PROMPT_TEMPLATES && PROMPT_TEMPLATES.length > 0) {
          setSelectedTemplate(PROMPT_TEMPLATES[0]);
        }

        // Load saved prompts
        if (api && typeof api.prompts?.list === 'function') {
          const data = await api.prompts.list();
          setSavedPrompts(Array.isArray(data) ? data : []);
        } else {
          setApiAvailable(false);
          setSavedPrompts(DEMO_SAVED_PROMPTS);
        }
        if (api && typeof api.memory?.list === 'function') {
          const memoryData = await api.memory.list();
          setMemories(Array.isArray(memoryData) ? memoryData : []);
        }
      } catch (err: any) {
        console.error('PromptLab init error:', err);
        setApiAvailable(false);
        setSavedPrompts(DEMO_SAVED_PROMPTS);
        setTemplates(PROMPT_TEMPLATES || []);
        if (PROMPT_TEMPLATES && PROMPT_TEMPLATES.length > 0) {
          setSelectedTemplate(PROMPT_TEMPLATES[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Reset variables when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const defaults: Record<string, string> = {};
      selectedTemplate.variables.forEach((v) => {
        defaults[getTemplateVariableKey(v)] = '';
      });
      setVariableValues(defaults);
      setGeneratedContent(null);
    }
  }, [selectedTemplate]);

  // ── Filtered templates ────────────────────────────────────────────────
  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return templates;
    const q = templateSearch.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [templates, templateSearch]);

  // ── Generate prompt ───────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    try {
      let basePrompt = fillTemplate(selectedTemplate, variableValues);

      if (injectionMode !== 'off') {
        try {
          let ctx = memoryContext;
          if (!ctx) {
            ctx = generateSharedMemoryContext(memories, injectionMode);
          }
          if (ctx) {
            basePrompt = injectMemoryIntoPrompt(basePrompt, ctx, injectionMode);
          } else if (ctx) {
            basePrompt = `<!-- Shared Memory Context -->\n${ctx}\n\n<!-- Prompt -->\n${basePrompt}`;
          }
        } catch (err) {
          console.error('Memory injection failed:', err);
        }
      }

      setGeneratedContent(basePrompt);
    } catch (err: any) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  };

  // ── Save prompt ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedTemplate || !generatedContent || !saveName.trim()) return;
    setSaving(true);
    try {
      const saved: SavedPrompt = {
        id: generateId(),
        name: saveName.trim(),
        templateId: selectedTemplate.id ?? selectedTemplate.name,
        variables: { ...variableValues },
        content: generatedContent,
        starred: false,
        createdAt: new Date().toISOString(),
      };

      if (api && typeof api.prompts?.create === 'function') {
        await api.prompts.create(saved);
      }
      setSavedPrompts((prev) => [saved, ...prev]);
      setShowSaveModal(false);
      setSaveName('');
    } catch (err: any) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!generatedContent || !selectedTemplate) return;
    const md = exportMarkdown(generatedContent, selectedTemplate.name);
    if (api && typeof api.export?.exportMarkdown === 'function') {
      await api.export.exportMarkdown(md, `${selectedTemplate.name}.md`);
    } else {
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${selectedTemplate.name}.md`; a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ── Toggle star ───────────────────────────────────────────────────────
  const toggleStar = async (prompt: SavedPrompt) => {
    const updated = { ...prompt, starred: !prompt.starred };
    if (api && typeof api.prompts?.update === 'function') {
      try { await api.prompts.update(updated); } catch {}
    }
    setSavedPrompts((prev) => prev.map((p) => (p.id === prompt.id ? updated : p)));
  };

  // ── Delete saved ──────────────────────────────────────────────────────
  const deleteSaved = async (id: string) => {
    if (api && typeof api.prompts?.delete === 'function') {
      try { await api.prompts.delete(id); } catch {}
    }
    setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Load saved prompt into editor ─────────────────────────────────────
  const loadSaved = (prompt: SavedPrompt) => {
    const tmpl = prompt.templateId ? getTemplateByName(prompt.templateId) : undefined;
    if (tmpl) {
      setSelectedTemplate(tmpl);
      setVariableValues(prompt.variables || {});
    }
    setGeneratedContent(prompt.content);
  };

  // ── Filtered saved prompts ────────────────────────────────────────────
  const filteredSaved = useMemo(() => {
    if (!savedSearch) return savedPrompts;
    const q = savedSearch.toLowerCase();
    return savedPrompts.filter(
      (p) => (p.name ?? p.title ?? '').toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
    );
  }, [savedPrompts, savedSearch]);

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-4 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-white/5" />
        <div className="flex gap-4 h-[70vh]">
          <div className="w-[30%] rounded-2xl bg-white/5 border border-white/10" />
          <div className="flex-1 rounded-2xl bg-white/5 border border-white/10" />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && templates.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <GlassCard className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">加载模板失败</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} icon={<RefreshCw className="w-4 h-4" />}>
            重试
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ── Empty templates ───────────────────────────────────────────────────
  if (templates.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EmptyState
          icon={Wand2}
          title="暂无 Prompt 模板"
          description="模板库为空，请检查模板配置"
          actionLabel="刷新"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Prompt Lab</h1>
          <p className="text-zinc-400 text-sm mt-1">模板化 Prompt 生成与管理</p>
        </div>
      </div>

      {/* Main two-panel layout */}
      <div className="flex gap-4 lg:h-[calc(100vh-16rem)] min-h-[600px]">
        {/* ── Left panel: Template list ────────────────────────────────── */}
        <div className="w-[30%] min-w-[240px] flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="搜索模板..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-xs
                         placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <GlassCard className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={classNames(
                    'w-full text-left p-3 rounded-xl transition-all text-sm',
                    selectedTemplate?.id === t.id
                      ? 'bg-blue-500/10 border border-blue-500/20 text-zinc-200'
                      : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-300'
                  )}
                >
                  <div className="font-medium text-xs">{t.name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                    {t.description}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge className="text-[10px] bg-white/5 text-zinc-500 border-white/10">
                      {t.variables.length} 变量
                    </Badge>
                    {t.category && (
                      <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {t.category}
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500">没有匹配的模板</div>
            )}
          </GlassCard>
        </div>

        {/* ── Right panel: Editor ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <GlassCard className="p-5 flex-1 overflow-y-auto">
            {selectedTemplate ? (
              <div className="space-y-5">
                {/* Template header */}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-200">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Variables */}
                {selectedTemplate.variables.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      模板变量
                    </h4>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map((v) => {
                        const key = getTemplateVariableKey(v);
                        return (
                          <div key={key}>
                            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                              {v.label || key}
                              {v.required && <span className="text-red-400 ml-0.5">*</span>}
                            </label>
                            {v.type === 'textarea' || (v.label && v.label.length > 30) ? (
                              <Textarea
                                value={variableValues[key] || ''}
                                onChange={(e) =>
                                  setVariableValues((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                placeholder={v.placeholder || `输入 ${v.label || key}...`}
                                rows={3}
                              />
                            ) : (
                              <Input
                                value={variableValues[key] || ''}
                                onChange={(e) =>
                                  setVariableValues((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                placeholder={v.placeholder || `输入 ${v.label || key}...`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Memory injection toggle */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 select-none">
                      <Brain className="w-3.5 h-3.5 text-pink-400" />
                      注入共享记忆 / Inject Shared Memory
                    </label>
                    <select
                      value={injectionMode}
                      onChange={(e) => setInjectionMode(e.target.value as MemoryInjectionMode)}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300
                                 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    >
                      <option value="off">不注入 / Off</option>
                      <option value="minimal">最小 / Minimal</option>
                      <option value="balanced">平衡 / Balanced</option>
                      <option value="full">完整 / Full</option>
                    </select>
                  </div>
                  {injectionMode !== 'off' && (
                    <Textarea
                      value={memoryContext}
                      onChange={(e) => setMemoryContext(e.target.value)}
                      placeholder={
                        memories.length === 0
                          ? '暂无共享记忆。可手动输入上下文，或先到共享记忆中心新增记忆。'
                          : '可选：手动输入共享记忆上下文。留空将自动从记忆库获取。'
                      }
                      rows={2}
                    />
                  )}
                </div>

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  icon={<Sparkles className="w-4 h-4" />}
                  fullWidth
                >
                  生成 Prompt
                </Button>

                {/* Generated prompt */}
                {generatedContent && (
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        生成的 Prompt
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            copyToClipboard(generatedContent);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="复制"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={handleExport}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="导出 Markdown"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSaveName('');
                            setShowSaveModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="保存"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <PromptPreview content={generatedContent} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                从左侧选择一个模板开始
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* ── Saved prompts section ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Save className="w-4 h-4 text-purple-400" />
            已保存的 Prompts
            <Badge className="bg-white/5 text-zinc-400 border-white/10">
              {savedPrompts.length}
            </Badge>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              value={savedSearch}
              onChange={(e) => setSavedSearch(e.target.value)}
              placeholder="搜索已保存..."
              className="w-56 pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 text-xs
                         placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {filteredSaved.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSaved.map((p) => (
              <GlassCard
                key={p.id}
                className="p-4 cursor-pointer hover:scale-[1.01] transition-transform group"
                onClick={() => loadSaved(p)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-zinc-200 truncate">{p.name ?? p.title ?? 'Untitled prompt'}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {truncate(p.content, 60)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(p); }}
                      className={`p-1 rounded transition-colors ${
                        p.starred ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" fill={p.starred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSaved(p.id); }}
                      className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-white/5 text-zinc-500 border-white/10">
                    {p.templateId ?? p.templateName ?? 'custom'}
                  </Badge>
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeDate(p.createdAt)}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8">
            <EmptyState
              icon={Save}
              title="暂无已保存的 Prompt"
              description={savedSearch ? '没有匹配的 Prompt' : '生成并保存你的第一个 Prompt'}
            />
          </GlassCard>
        )}
      </div>

      {/* ── Save Modal ────────────────────────────────────────────────────── */}
      <Modal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="保存 Prompt"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">名称</label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="给这个 Prompt 起个名字"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            模板: {selectedTemplate?.name} | 变量: {selectedTemplate?.variables.length} 个
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => setShowSaveModal(false)}>取消</Button>
          <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
}
