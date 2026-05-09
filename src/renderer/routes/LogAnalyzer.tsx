import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Copy,
  Check,
  Brain,
  Clock,
  Trash2,
  Sparkles,
  Bug,
  Lightbulb,
  ListChecks,
  Terminal,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Wand2,
} from 'lucide-react';
import { api } from '../lib/api';
import { analyzeLog } from '../lib/logAnalyzer';
import { GlassCard, EmptyState, Button, Textarea, Badge } from '../components/';
import type { LogAnalysisResult, Memory, MemoryType } from '../lib/types';
import { generateId, formatRelativeDate, copyToClipboard, classNames } from '../lib/utils';

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_HISTORY: LogAnalysisResult[] = [
  {
    id: 'h1',
    errorType: 'TypeError',
    summary: 'Cannot read properties of undefined (reading "map")',
    possibleCauses: [
      'API 返回了 undefined 而非数组',
      '组件在数据加载前渲染',
      'props 未正确传递',
    ],
    fixSteps: [
      '添加可选链操作符 (?.): data?.map(...)',
      '添加初始默认值: useState([])',
      '在渲染前检查数据是否已加载',
    ],
    suggestedCommands: [
      'npm run dev -- --inspect',
      'npx tsc --noEmit  # 检查类型错误',
    ],
    fixPrompt: 'Fix the TypeError in the React component where data.map is called before the data is loaded. Add null checks and default empty array values.',
    analyzedAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    rawLog: 'TypeError: Cannot read properties of undefined (reading \'map\')\n    at ProjectList (ProjectList.tsx:42:1)',
  },
  {
    id: 'h2',
    errorType: 'ModuleNotFoundError',
    summary: 'Module not found: Error: Can\'t resolve \'../components/Button\'',
    possibleCauses: [
      '文件路径拼写错误',
      '组件文件被移动或删除',
      'index.ts 未正确导出',
    ],
    fixSteps: [
      '检查文件 ../components/Button.tsx 是否存在',
      '检查大小写: 导入路径大小写是否与文件系统一致',
      '检查 index.ts 中的导出语句',
    ],
    suggestedCommands: [
      'ls src/components/Button*',
      'find src -name "Button.*"',
    ],
    fixPrompt: 'Fix the module resolution error for ../components/Button. Check the file path, ensure the component file exists, and verify the export statement.',
    analyzedAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    rawLog: 'ERROR in ./src/renderer/routes/Projects.tsx\nModule not found: Error: Can\'t resolve \'../components/Button\'',
  },
];

const MAX_LOG_INPUT_CHARS = 200_000;

// ── Component ──────────────────────────────────────────────────────────────
export default function LogAnalyzer() {
  const [logInput, setLogInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<LogAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LogAnalysisResult[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [createMemory, setCreateMemory] = useState(false);
  const [memoryCreated, setMemoryCreated] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ── Load history ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingHistory(true);
      try {
        if (api && typeof api.memory?.list === 'function') {
          const mems = await api.memory.list();
          const logMems = (Array.isArray(mems) ? mems : [])
            .filter((m: any) => m.type === 'log_analysis')
            .map((m: any) => m.metadata?.analysisResult)
            .filter(Boolean) as LogAnalysisResult[];
          if (logMems.length > 0) {
            setHistory(logMems);
          } else {
            setHistory(DEMO_HISTORY);
          }
        } else {
          setHistory(DEMO_HISTORY);
        }
      } catch {
        setHistory(DEMO_HISTORY);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, []);

  // ── Analyze ────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!logInput.trim()) return;
    if (logInput.length > MAX_LOG_INPUT_CHARS) {
      setError('日志超过 200KB，请先截取关键错误片段再分析，避免卡住界面。');
      return;
    }
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setMemoryCreated(false);

    try {
      // Simulate analysis delay for UX
      await new Promise((r) => setTimeout(r, 800));

      const analysis = analyzeLog(logInput);
      if (analysis) {
        setResult(analysis);
        setHistory((prev) => [analysis, ...prev].slice(0, 50));
      } else {
        setResult({
          id: generateId(),
          errorType: 'Unknown',
          summary: '未能识别明确的错误模式',
          possibleCauses: ['日志格式不标准', '错误信息不完整', '非常见错误类型'],
          fixSteps: ['检查完整的堆栈跟踪', '查看相关服务的完整日志', '在开发环境重现该问题'],
          suggestedCommands: ['tail -f /var/log/app.log', 'journalctl -xe'],
          fixPrompt: 'I encountered an error but the log output is unclear. Here is the log:\n' + logInput,
          analyzedAt: new Date().toISOString(),
          rawLog: logInput,
        });
        setHistory((prev) => [result!, ...prev].slice(0, 50));
      }
    } catch (err: any) {
      setError(err?.message || '分析失败');
    } finally {
      setAnalyzing(false);
    }
  }, [logInput]);

  // ── Create memory from analysis ───────────────────────────────────────
  const handleCreateMemory = async () => {
    if (!result) return;
    try {
      const memory: any = {
        type: 'log_analysis' as MemoryType,
        title: `Log Analysis: ${result.errorType}`,
        content: `Error: ${result.summary ?? result.errorType}\n\nCauses:\n${result.possibleCauses.map((c) => `- ${c}`).join('\n')}\n\nFix:\n${result.fixSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        tags: ['log-analysis', result.errorType.toLowerCase(), 'auto-generated'],
        importance: 3,
        status: 'active',
        metadata: { analysisResult: result },
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (api && typeof api.memory?.create === 'function') {
        await api.memory.create(memory);
      }
      setMemoryCreated(true);
      setTimeout(() => setMemoryCreated(false), 3000);
    } catch {}
  };

  // ── Toggle history expansion ──────────────────────────────────────────
  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Copy helper ───────────────────────────────────────────────────────
  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Clear history ─────────────────────────────────────────────────────
  const clearHistory = () => setHistory([]);

  // ── Error type color ──────────────────────────────────────────────────
  const errorTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('type')) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (t.includes('syntax')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (t.includes('module') || t.includes('import')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (t.includes('network') || t.includes('fetch')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">日志分析器</h1>
        <p className="text-zinc-400 text-sm mt-1">粘贴错误日志，自动诊断原因并提供修复方案</p>
      </div>

      {/* Input section */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-300">粘贴日志</h2>
        </div>
        <Textarea
          value={logInput}
          onChange={(e) => setLogInput(e.target.value)}
          placeholder="在此粘贴错误日志、堆栈跟踪或异常信息...&#10;&#10;例如:&#10;TypeError: Cannot read properties of undefined (reading 'map')&#10;    at ProjectList (ProjectList.tsx:42:1)"
          rows={8}
          disabled={analyzing}
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={handleAnalyze}
            loading={analyzing}
            disabled={!logInput.trim()}
            icon={analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          >
            分析日志
          </Button>
          {logInput && (
            <button
              onClick={() => { setLogInput(''); setResult(null); setError(null); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              清空
            </button>
          )}
        </div>
      </GlassCard>

      {/* Error message */}
      {error && (
        <GlassCard className="p-4 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </GlassCard>
      )}

      {/* Analyzing state */}
      {analyzing && (
        <GlassCard className="p-12 text-center">
          <div className="inline-flex items-center gap-3 text-zinc-400">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-sm">正在分析日志...</span>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            识别错误模式、提取堆栈信息、生成修复方案
          </p>
        </GlassCard>
      )}

      {/* Results */}
      {result && !analyzing && (
        <GlassCard className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bug className="w-5 h-5 text-red-400" />
                <Badge className={errorTypeColor(result.errorType)}>
                  {result.errorType}
                </Badge>
              </div>
              <p className="text-sm text-zinc-300 font-medium">{result.summary ?? result.errorType}</p>
            </div>
            <span className="text-[11px] text-zinc-600 flex-shrink-0">
              {formatRelativeDate(result.analyzedAt)}
            </span>
          </div>

          {/* Possible causes */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              可能原因
            </h4>
            <ul className="space-y-1.5">
              {result.possibleCauses.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {cause}
                </li>
              ))}
            </ul>
          </div>

          {/* Fix steps */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
              修复步骤
            </h4>
            <ol className="space-y-1.5">
              {result.fixSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Suggested commands */}
          {result.suggestedCommands.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                建议命令
              </h4>
              <div className="space-y-2">
                {result.suggestedCommands.map((cmd, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-900/50 text-xs text-zinc-300 font-mono border border-white/5">
                      $ {cmd}
                    </code>
                    <button
                      onClick={() => handleCopy(cmd, `cmd-${i}`)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {copiedKey === `cmd-${i}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fix prompt */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              Fix Prompt
            </h4>
            <div className="relative">
              <pre className="px-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                {result.fixPrompt}
              </pre>
              <button
                onClick={() => handleCopy(result.fixPrompt, 'fix-prompt')}
                className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copiedKey === 'fix-prompt' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Create memory */}
          <div className="border-t border-white/10 pt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createMemory}
                onChange={(e) => setCreateMemory(e.target.checked)}
                className="rounded bg-white/10 border-white/20 text-pink-500 focus:ring-pink-500/50"
              />
              <Brain className="w-4 h-4 text-pink-400" />
              生成 issue_fix 记忆
            </label>
            {createMemory && (
              <Button
                size="sm"
                onClick={handleCreateMemory}
                disabled={memoryCreated}
                icon={memoryCreated ? <Check className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
              >
                {memoryCreated ? '记忆已创建' : '创建记忆'}
              </Button>
            )}
          </div>

          {/* Raw log */}
          <details className="border-t border-white/10 pt-4">
            <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors">
              查看原始日志
            </summary>
            <pre className="mt-2 px-3 py-2 rounded-lg bg-zinc-900/30 text-[11px] text-zinc-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
              {result.rawLog}
            </pre>
          </details>
        </GlassCard>
      )}

      {/* Empty state (when no analysis yet and not analyzing) */}
      {!result && !analyzing && !error && (
        <GlassCard className="p-12">
          <EmptyState
            icon={FileText}
            title="准备分析日志"
            description="在上方粘贴错误日志，然后点击「分析日志」按钮获取诊断结果和修复方案"
          />
        </GlassCard>
      )}

      {/* History section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            分析历史
            <Badge className="bg-white/5 text-zinc-400 border-white/10">
              {history.length}
            </Badge>
          </h2>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> 清空历史
            </button>
          )}
        </div>

        {loadingHistory ? (
          <div className="animate-pulse space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-2">
            {history.map((h, index) => {
              const historyId = h.id ?? `history-${index}`;
              return (
                <GlassCard key={historyId} className="p-4">
                  <button
                    onClick={() => toggleHistory(historyId)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className={errorTypeColor(h.errorType)}>
                        {h.errorType}
                      </Badge>
                      <span className="text-sm text-zinc-300 truncate">{h.summary ?? h.errorType}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-[11px] text-zinc-600">
                        {formatRelativeDate(h.analyzedAt)}
                      </span>
                      {expandedHistory.has(historyId) ? (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {expandedHistory.has(historyId) && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-sm text-zinc-400">
                      <p><strong className="text-zinc-300">Causes:</strong> {h.possibleCauses.join('; ')}</p>
                      <p><strong className="text-zinc-300">Fix:</strong> {h.fixSteps.join(' | ')}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogInput(h.rawLog ?? '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        重新分析此日志
                      </button>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard className="p-8">
            <EmptyState
              icon={Clock}
              title="暂无分析历史"
              description="分析日志后，历史记录将显示在这里"
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}
