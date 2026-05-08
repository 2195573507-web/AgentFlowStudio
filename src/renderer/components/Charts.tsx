import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { classNames } from '../lib/utils';
import type { TaskStatus, MemoryType } from '../lib/types';

// Register ECharts components once
echarts.use([
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
]);

// ── Shared chart wrapper hook ──

function useChart<T extends echarts.EChartsType>() {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const instance = echarts.init(chartRef.current, undefined, {
      renderer: 'canvas',
    });
    instanceRef.current = instance;

    const handleResize = () => instance.resize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      instance.dispose();
      instanceRef.current = null;
    };
  }, []);

  const setOption = (option: echarts.EChartsCoreOption, notMerge = true) => {
    instanceRef.current?.setOption(option, notMerge);
  };

  return { chartRef, instanceRef, setOption };
}

// ── Color palette ──

const CHART_COLORS = [
  '#6366f1', // accent/indigo
  '#22c55e', // emerald
  '#f59e0b', // amber
  '#3b82f6', // sky
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
];

// ── Shared theme for tooltip and legend ──

const sharedTheme = {
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(148,163,184,0.3)',
    borderWidth: 1,
    textStyle: { color: '#334155', fontSize: 12 },
    extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);',
  },
  legend: {
    textStyle: { color: '#64748b', fontSize: 11 },
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 16,
    borderRadius: 4,
  },
};

// ═══════════════════════════════════════════════════════════════
// TaskStatusChart – Pie chart showing task distribution by status
// ═══════════════════════════════════════════════════════════════

export interface TaskStatusData {
  status: TaskStatus;
  count: number;
}

export interface TaskStatusChartProps {
  data: TaskStatusData[] | Record<string, number>;
  className?: string;
}

const statusColors: Record<TaskStatus, string> = {
  todo: '#64748b',
  doing: '#3b82f6',
  in_progress: '#3b82f6',
  blocked: '#f59e0b',
  done: '#22c55e',
};

const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
};

export const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ data, className }) => {
  const { chartRef, setOption } = useChart();

  useEffect(() => {
    if (!chartRef.current) return;

    const dataRows: TaskStatusData[] = Array.isArray(data)
      ? data
      : (Object.entries(data) as Array<[TaskStatus, number]>).map(([status, count]) => ({
          status,
          count,
        }));

    const seriesData = dataRows.map((d) => ({
      name: statusLabels[d.status] || d.status,
      value: d.count,
      itemStyle: { color: statusColors[d.status] || CHART_COLORS[0] },
    }));

    setOption({
      ...sharedTheme,
      series: [
        {
          type: 'pie',
          radius: ['55%', '82%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          padAngle: 2,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'transparent',
            borderWidth: 3,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontWeight: 'bold',
              fontSize: 13,
            },
            scaleSize: 8,
          },
          data: seriesData.length > 0 ? seriesData : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e2e8f0' } }],
        },
      ],
    });
  }, [data, chartRef, setOption]);

  return (
    <div
      ref={chartRef}
      className={classNames('w-full h-64', className)}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// MemoryTypeChart – Bar chart showing memory count by type
// ═══════════════════════════════════════════════════════════════

export interface MemoryTypeData {
  type: MemoryType;
  count: number;
}

export interface MemoryTypeChartProps {
  data: MemoryTypeData[] | Record<string, number>;
  className?: string;
}

const memoryTypeLabels: Record<MemoryType, string> = {
  user_preference: '用户偏好',
  project_context: '项目上下文',
  decision: '决策',
  issue_fix: '问题修复',
  api_provider: 'API 配置',
  prompt_pattern: 'Prompt 模式',
  environment: '环境',
  pattern: '模式',
  insight: '洞察',
  knowledge: '知识',
  code_snippet: '代码片段',
  security: '安全',
  git_summary: 'Git 摘要',
  log_analysis: '日志分析',
  safety_check: '安全检查',
};

export const MemoryTypeChart: React.FC<MemoryTypeChartProps> = ({ data, className }) => {
  const { chartRef, setOption } = useChart();

  useEffect(() => {
    if (!chartRef.current) return;

    const dataRows: MemoryTypeData[] = Array.isArray(data)
      ? data
      : (Object.entries(data) as Array<[MemoryType, number]>).map(([type, count]) => ({
          type,
          count,
        }));

    const categories = dataRows.map((d) => memoryTypeLabels[d.type] || d.type);
    const values = dataRows.map((d) => d.count);

    setOption({
      ...sharedTheme,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories.length > 0 ? categories : ['暂无数据'],
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          rotate: categories.length > 4 ? 25 : 0,
        },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: values.length > 0 ? values : [0],
          barWidth: '50%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: '#818cf8' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: '#4f46e5',
            },
          },
        },
      ],
    });
  }, [data, chartRef, setOption]);

  return (
    <div
      ref={chartRef}
      className={classNames('w-full h-64', className)}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// ActivityTimeline – Line chart for activity over time
// ═══════════════════════════════════════════════════════════════

export interface ActivityDataPoint {
  date: string;
  tasks: number;
  prompts: number;
  memories: number;
}

export interface ActivityTimelineProps {
  data: ActivityDataPoint[];
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ data, className }) => {
  const { chartRef, setOption } = useChart();

  useEffect(() => {
    if (!chartRef.current) return;

    const dates = data.map((d) => d.date);
    const hasData = data.length > 0;

    const makeSeries = (name: string, key: keyof ActivityDataPoint, color: string) => ({
      name,
      type: 'line' as const,
      data: hasData ? data.map((d) => d[key] as number) : [0],
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { width: 2, color },
      itemStyle: { color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '20' },
          { offset: 1, color: color + '02' },
        ]),
      },
    });

    setOption({
      ...sharedTheme,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '12%',
        containLabel: true,
      },
      legend: {
        ...sharedTheme.legend,
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: hasData ? dates : ['暂无数据'],
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (value: string) => {
            if (!hasData) return value;
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        makeSeries('任务', 'tasks', CHART_COLORS[0]),
        makeSeries('Prompt', 'prompts', CHART_COLORS[3]),
        makeSeries('记忆', 'memories', CHART_COLORS[5]),
      ],
    });
  }, [data, chartRef, setOption]);

  return (
    <div
      ref={chartRef}
      className={classNames('w-full h-64', className)}
    />
  );
};
