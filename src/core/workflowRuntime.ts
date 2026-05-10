import type {
  Workflow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeTrace,
  WorkflowRunResult,
} from '../shared/workflowTypes.js';

function nowIso(): string {
  return new Date().toISOString();
}

function summarize(value: string | undefined, fallback: string): string {
  const text = (value || fallback).trim();
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function nextNode(edges: WorkflowEdge[], currentNodeId: string, condition?: string): string | undefined {
  const candidates = edges.filter((edge) => edge.source === currentNodeId);
  if (condition) {
    return candidates.find((edge) => edge.condition === condition)?.target ?? candidates[0]?.target;
  }
  return candidates[0]?.target;
}

function conditionPasses(expression: string | undefined, input: string): boolean {
  const expr = (expression || '').trim().toLowerCase();
  if (!expr) return true;
  if (expr.includes('contains:')) {
    const needle = expr.split('contains:')[1]?.trim() ?? '';
    return needle.length === 0 || input.toLowerCase().includes(needle);
  }
  if (expr.includes('not-empty')) return input.trim().length > 0;
  return !['false', 'no', 'reject', 'blocked'].includes(expr);
}

function traceFor(node: WorkflowNode, input: string): WorkflowNodeTrace {
  const startedAt = nowIso();
  return {
    id: `${node.id}-${Date.now()}`,
    nodeId: node.id,
    nodeTitle: node.title,
    nodeType: node.type,
    status: 'running',
    startedAt,
    inputSummary: summarize(input, 'No input'),
  };
}

function finishTrace(trace: WorkflowNodeTrace, patch: Partial<WorkflowNodeTrace>): WorkflowNodeTrace {
  const endedAt = nowIso();
  return {
    ...trace,
    ...patch,
    endedAt,
    durationMs: Math.max(1, new Date(endedAt).getTime() - new Date(trace.startedAt).getTime()),
  };
}

export function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  if (!workflow.nodes.some((node) => node.type === 'start')) errors.push('Workflow must include a Start node.');
  if (!workflow.nodes.some((node) => node.type === 'output')) errors.push('Workflow must include an Output node.');
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source)) errors.push(`Edge ${edge.id} has missing source node.`);
    if (!nodeIds.has(edge.target)) errors.push(`Edge ${edge.id} has missing target node.`);
  }
  return errors;
}

export function runWorkflow(workflow: Workflow, input = ''): WorkflowRunResult {
  const validationErrors = validateWorkflow(workflow);
  if (validationErrors.length > 0) {
    return {
      status: 'failed',
      summary: 'Workflow cannot run because its graph is incomplete.',
      output: '',
      error: validationErrors.join(' '),
      nextStep: 'Open the workflow editor and add the missing Start/Output nodes or repair broken edges.',
      nodeTrace: [],
    };
  }

  const nodes = new Map(workflow.nodes.map((node) => [node.id, node]));
  const trace: WorkflowNodeTrace[] = [];
  let cursor = workflow.nodes.find((node) => node.type === 'start')?.id;
  let currentInput = input || 'Beginner sample input';
  let output = '';
  const visited = new Set<string>();

  while (cursor) {
    if (visited.has(cursor)) {
      return {
        status: 'failed',
        summary: 'Workflow stopped because a loop was detected.',
        output,
        error: `Node ${cursor} was visited twice.`,
        nextStep: 'Remove the cycle or add an explicit loop controller in a future version.',
        nodeTrace: trace,
      };
    }
    visited.add(cursor);

    const node = nodes.get(cursor);
    if (!node) {
      return {
        status: 'failed',
        summary: 'Workflow stopped because an edge points to a missing node.',
        output,
        error: `Missing node: ${cursor}`,
        nextStep: 'Open the editor and delete or repair the broken edge.',
        nodeTrace: trace,
      };
    }

    const active = traceFor(node, currentInput);

    if (node.type === 'start') {
      currentInput = summarize(currentInput, 'Workflow started');
      trace.push(finishTrace(active, { status: 'success', outputSummary: 'Started workflow.' }));
      cursor = nextNode(workflow.edges, node.id);
      continue;
    }

    if (node.type === 'prompt') {
      currentInput = node.config.prompt || currentInput;
      trace.push(finishTrace(active, { status: 'success', outputSummary: summarize(currentInput, 'Prompt prepared.') }));
      cursor = nextNode(workflow.edges, node.id);
      continue;
    }

    if (node.type === 'llm') {
      if (!node.config.providerRef && !node.config.model) {
        trace.push(finishTrace(active, {
          status: 'failure',
          failureReason: 'LLM node has no provider or model configured.',
          nextStep: 'Go to Provider settings, add an API key, then choose a provider/model for this node.',
        }));
        return {
          status: 'failed',
          summary: 'LLM configuration is missing.',
          output,
          error: 'LLM node has no provider or model configured.',
          nextStep: 'Configure Provider/API Key and select a model before running again.',
          nodeTrace: trace,
        };
      }
      currentInput = `LLM draft (${node.config.model || 'configured model'}): ${summarize(currentInput, 'prompt')}`;
      trace.push(finishTrace(active, { status: 'success', outputSummary: currentInput }));
      cursor = nextNode(workflow.edges, node.id);
      continue;
    }

    if (node.type === 'tool') {
      const toolName = node.config.toolName || 'local.echo';
      currentInput = `Tool ${toolName} completed with local dry-run output.`;
      trace.push(finishTrace(active, { status: 'success', outputSummary: currentInput }));
      cursor = nextNode(workflow.edges, node.id);
      continue;
    }

    if (node.type === 'condition') {
      const passed = conditionPasses(node.config.conditionExpression, currentInput);
      trace.push(finishTrace(active, {
        status: 'success',
        outputSummary: passed ? 'Condition passed.' : 'Condition failed.',
      }));
      cursor = nextNode(workflow.edges, node.id, passed ? 'true' : 'false');
      continue;
    }

    if (node.type === 'human_approval') {
      const approved = !currentInput.toLowerCase().includes('reject');
      if (!approved) {
        trace.push(finishTrace(active, {
          status: 'blocked',
          outputSummary: 'Waiting for human approval.',
          nextStep: 'Review the generated content and rerun after approval.',
        }));
        return {
          status: 'blocked',
          summary: 'Workflow is waiting for human approval.',
          output,
          nextStep: 'Approve or revise the draft, then run the workflow again.',
          nodeTrace: trace,
        };
      }
      trace.push(finishTrace(active, { status: 'success', outputSummary: 'Approved by simulated local reviewer.' }));
      cursor = nextNode(workflow.edges, node.id, 'approved');
      continue;
    }

    if (node.type === 'output') {
      output = node.config.sampleOutput || currentInput;
      trace.push(finishTrace(active, { status: 'success', outputSummary: summarize(output, 'Output produced.') }));
      cursor = undefined;
    }
  }

  return {
    status: 'success',
    summary: `Workflow "${workflow.name}" completed with ${trace.length} trace events.`,
    output,
    nodeTrace: trace,
  };
}
