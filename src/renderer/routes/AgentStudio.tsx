import React from 'react';
import { Bot, Pause, PlayCircle, RefreshCw, RotateCcw, Square, UserCheck } from 'lucide-react';
import { Badge, Button, EmptyState, SurfaceCard } from '../components';
import { api } from '../lib/api';
import type { AgentExecutionRecord, AgentRecord } from '../lib/types';
import { createDemoAgent } from '../../shared/agentCore';

export default function AgentStudio() {
  const [agents, setAgents] = React.useState<AgentRecord[]>([]);
  const [executions, setExecutions] = React.useState<AgentExecutionRecord[]>([]);
  const [selected, setSelected] = React.useState('');
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    const agentResult = await api.agents.list().catch(() => []);
    const list = Array.isArray(agentResult) ? agentResult : [];
    setAgents(list);
    const selectedId = selected || list[0]?.id || '';
    setSelected(selectedId);
    if (selectedId) {
      const executionResult = await api.agents.executions(selectedId).catch(() => []);
      setExecutions(Array.isArray(executionResult) ? executionResult : []);
    }
  }, [selected]);

  React.useEffect(() => { void load(); }, [load]);

  const createDemo = async () => {
    const created = await api.agents.create(createDemoAgent());
    setMessage('error' in created ? created.error : `Created ${created.name}`);
    await load();
  };

  const controlExecution = async (executionId: string, action: string) => {
    const result = await api.agents.controlExecution(executionId, action);
    setMessage('error' in result ? result.error : `Execution ${action}: ${result.status}`);
    await load();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <section className="surface-card p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Agent Studio</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Delegated actors with human owner, provider/model, skills, memory scope, audit policy, execution records, and feedback loops.</p></div><div className="flex gap-2"><Button variant="secondary" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button><Button onClick={createDemo} icon={<PlayCircle className="h-4 w-4" />}>Create Demo</Button></div></div></section>
      {message && <div className="rounded-tool border border-accent-500/30 bg-accent-500/10 p-3 text-sm text-[var(--accent)]">{message}</div>}
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-2">
          {agents.map((agent) => <button key={agent.id} onClick={() => setSelected(agent.id)} className={`w-full rounded-tool border p-3 text-left ${selected === agent.id ? 'border-accent-500 bg-accent-500/10' : 'border-[var(--border)] bg-[var(--surface)]'}`}><div className="font-semibold">{agent.name}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{agent.description}</div><div className="mt-2 flex gap-1"><Badge>{agent.status}</Badge><Badge>{agent.lastHealthStatus}</Badge></div></button>)}
          {agents.length === 0 && <SurfaceCard className="p-6"><EmptyState icon={Bot} title="No agents" description="Create a demo agent to inspect ownership, permissions, and execution records." actionLabel="Create Demo" onAction={createDemo} /></SurfaceCard>}
        </div>
        <SurfaceCard className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold"><UserCheck className="h-4 w-4" /> Execution timeline</h2>
          <div className="mt-4 space-y-2">
            {executions.map((execution) => (
              <div key={execution.id} className="rounded-tool border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{execution.status}</Badge>
                  <span className="font-semibold">{execution.inputSummary}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{execution.outputSummary || execution.errorSummary}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => void controlExecution(execution.id, 'pause')} icon={<Pause className="h-3.5 w-3.5" />}>Pause</Button>
                  <Button size="sm" variant="ghost" onClick={() => void controlExecution(execution.id, 'cancel')} icon={<Square className="h-3.5 w-3.5" />}>Cancel</Button>
                  <Button size="sm" variant="ghost" onClick={() => void controlExecution(execution.id, 'retry')} icon={<RotateCcw className="h-3.5 w-3.5" />}>Retry Safe Node</Button>
                  <Button size="sm" variant="secondary" onClick={() => void controlExecution(execution.id, 'resume')}>Resume</Button>
                </div>
                {execution.customData && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Owner/provider/model/context/token attribution is stored in the execution record.
                  </p>
                )}
              </div>
            ))}
            {executions.length === 0 && <EmptyState icon={Bot} title="No executions" description="Workflow and agent runs will appear here with selected provider, tools, context sources, token usage, and failure reason." />}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
