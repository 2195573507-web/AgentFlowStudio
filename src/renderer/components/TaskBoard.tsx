import React, { useMemo } from 'react';
import { GripVertical, User } from 'lucide-react';
import type { Task, TaskStatus, Priority } from '../lib/types';
import { classNames } from '../lib/utils';
import Badge from './Badge';
import EmptyState from './EmptyState';

export interface TaskBoardProps {
  /** Array of tasks to display. */
  tasks: Task[];
  /** Backwards-compatible project id prop used by the detail page. */
  projectId?: string;
  /** Called when a task is moved to a new column. */
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  /** Additional className for the board container. */
  className?: string;
}

interface ColumnDef {
  status: TaskStatus;
  label: string;
  color: string;
  bgColor: string;
}

const columns: ColumnDef[] = [
  {
    status: 'todo',
    label: '待办',
    color: 'text-[var(--text-secondary)] dark:text-[var(--text-muted)]',
    bgColor: 'bg-slate-100/60 dark:bg-[var(--surface-muted)]',
  },
  {
    status: 'doing',
    label: '进行中',
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-100/60 dark:bg-sky-900/30',
  },
  {
    status: 'in_progress',
    label: '进行中',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100/60 dark:bg-blue-900/30',
  },
  {
    status: 'blocked',
    label: '受阻',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100/60 dark:bg-amber-900/30',
  },
  {
    status: 'done',
    label: '已完成',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100/60 dark:bg-emerald-900/30',
  },
];

const priorityVariant: Record<Priority, 'danger' | 'warning' | 'info' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const priorityLabels: Record<Priority, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

const TaskCard: React.FC<{
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}> = ({ task, onStatusChange }) => {
  const availableStatuses = columns
    .map((c) => c.status)
    .filter((s) => s !== task.status);

  return (
    <div
      className={classNames(
        'group relative',
        'bg-[var(--surface)] dark:bg-[var(--surface-muted)] ',
        'border border-[var(--border)] dark:border-[var(--border)]',
        'shadow-sm shadow-black/5 dark:shadow-black/20',
        'rounded-panel p-3',
        'transition-all duration-200 ease-out',
        'hover:shadow-md hover:shadow-black/10 dark:hover:shadow-black/30',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Drag handle */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab">
        <GripVertical className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)] leading-snug mb-2 pr-5">
        {task.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={priorityVariant[task.priority]} dot>
          {priorityLabels[task.priority] ?? task.priority}
        </Badge>
        {task.role && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            <User className="w-3 h-3" />
            {task.role}
          </span>
        )}
      </div>

      {/* Status switcher */}
      {onStatusChange && availableStatuses.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-[var(--border)]">
          <select
            value=""
            onChange={(e) => {
              const newStatus = e.target.value as TaskStatus;
              if (newStatus) onStatusChange(task.id, newStatus);
            }}
            className={classNames(
              'w-full text-xs rounded-lg px-2 py-1.5',
              'bg-[var(--surface-muted)] dark:bg-[var(--surface-muted)]',
              'border border-slate-200/60 dark:border-[var(--border)]',
              'text-[var(--text-muted)] dark:text-[var(--text-muted)]',
              'outline-none focus:ring-1 focus:ring-accent-400',
              'cursor-pointer',
            )}
          >
            <option value="">移动到...</option>
            {availableStatuses.map((s) => {
              const col = columns.find((c) => c.status === s)!;
              return (
                <option key={s} value={s}>
                  {col.label}
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
};

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onStatusChange,
  className,
}) => {
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      doing: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    tasks.forEach((task) => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    return groups;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="暂无任务"
        description="创建任务后会显示在看板中。"
        className="py-12"
      />
    );
  }

  return (
    <div
      className={classNames(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className,
      )}
    >
      {columns.map((col) => {
        const columnTasks = groupedTasks[col.status];
        return (
          <div key={col.status} className="flex flex-col min-h-[200px]">
            {/* Column header */}
            <div
              className={classNames(
                'flex items-center justify-between px-3 py-2 rounded-panel mb-3',
                col.bgColor,
              )}
            >
              <span
                className={classNames(
                  'text-xs font-semibold uppercase tracking-wider',
                  col.color,
                )}
              >
                {col.label}
              </span>
              <span
                className={classNames(
                  'text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full',
                  'bg-[var(--surface-muted)] dark:bg-black/20',
                  col.color,
                )}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Column cards */}
            <div className="flex flex-col gap-2.5 flex-1">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                />
              ))}
              {columnTasks.length === 0 && (
                <div
                  className={classNames(
                    'flex-1 flex items-center justify-center',
                    'rounded-panel border-2 border-dashed',
                    'border-slate-200/60 dark:border-[var(--border)]',
                    'min-h-[100px]',
                  )}
                >
                  <span className="text-xs text-slate-300 dark:text-[var(--text-secondary)]">
                    暂无任务
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;
