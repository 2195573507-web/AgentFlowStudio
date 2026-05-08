import React, { useState, useCallback } from 'react';
import {
  Copy,
  Check,
  Save,
  Brain,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import GlassCard from './GlassCard';
import { classNames, copyToClipboard } from '../lib/utils';
import type { MemoryInjectionMode } from '../lib/types';

export interface PromptPreviewProps {
  /** The generated prompt content to display. */
  content: string;
  /** Optional title for the prompt block. */
  title?: string;
  /** Injection mode indicator. */
  injectionMode?: MemoryInjectionMode;
  /** Whether shared memory was injected into this prompt. */
  memoryInjected?: boolean;
  /** Number of memory items that were injected. */
  memoryItemCount?: number;
  /** Called when the user clicks the save button. */
  onSave?: () => void;
  /** Whether the save operation is in progress. */
  saving?: boolean;
  /** Whether the prompt was successfully saved. */
  saved?: boolean;
  /** Additional className for the wrapper. */
  className?: string;
}

const injectionLabels: Record<MemoryInjectionMode, { label: string; variant: 'default' | 'info' | 'warning' }> = {
  off: { label: '不注入记忆', variant: 'default' },
  minimal: { label: '最小上下文', variant: 'info' },
  balanced: { label: '平衡上下文', variant: 'info' },
  full: { label: '完整上下文', variant: 'warning' },
};

const PromptPreview: React.FC<PromptPreviewProps> = ({
  content,
  title,
  injectionMode,
  memoryInjected = false,
  memoryItemCount = 0,
  onSave,
  saving = false,
  saved = false,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const maxPreviewLength = 600;

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  const displayContent =
    !expanded && content.length > maxPreviewLength
      ? content.slice(0, maxPreviewLength) + '\n\n… (truncated)'
      : content;

  const shouldTruncate = content.length > maxPreviewLength;

  return (
    <GlassCard className={classNames('flex flex-col', className)} padding="none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60 dark:border-slate-700/40">
        <div className="flex items-center gap-3 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
              {title}
            </h4>
          )}
          {injectionMode && injectionMode !== 'off' && (
            <Badge variant={injectionLabels[injectionMode].variant} dot>
              {injectionLabels[injectionMode].label}
            </Badge>
          )}
          {memoryInjected && (
            <Badge
              variant="info"
              icon={<Brain className="w-3 h-3" />}
            >
              {memoryItemCount > 0
                ? `${memoryItemCount} 条记忆`
                : '记忆'}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopy}
          >
            {copied ? '已复制' : '复制'}
          </Button>

          {onSave && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Save className="w-3.5 h-3.5" />}
              onClick={onSave}
              loading={saving}
              disabled={saved}
            >
              {saved ? '已保存' : '保存'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <pre
          className={classNames(
            'px-5 py-4 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words',
            'text-slate-700 dark:text-slate-300',
            'overflow-auto max-h-[400px]',
            !expanded && shouldTruncate && 'max-h-[250px] overflow-hidden',
          )}
        >
          {displayContent}
        </pre>

        {/* Fade gradient when truncated */}
        {!expanded && shouldTruncate && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand/collapse */}
      {shouldTruncate && (
        <div className="px-5 py-2 border-t border-slate-200/60 dark:border-slate-700/40">
          <button
            onClick={() => setExpanded(!expanded)}
            className={classNames(
              'flex items-center gap-1.5 text-xs font-medium',
              'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              'transition-colors duration-150',
            )}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                展开
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer metadata */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-t border-slate-200/60 dark:border-slate-700/40">
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          {content.length.toLocaleString()} 个字符
        </span>
        {memoryInjected && (
          <span className="inline-flex items-center gap-1 text-xs text-sky-500 dark:text-sky-400">
            <Brain className="w-3 h-3" />
            已注入共享记忆
          </span>
        )}
        {injectionMode && injectionMode !== 'off' && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <Share2 className="w-3 h-3" />
            {injectionLabels[injectionMode].label}
          </span>
        )}
      </div>
    </GlassCard>
  );
};

export default PromptPreview;
