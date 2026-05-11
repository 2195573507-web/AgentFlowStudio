# Competitor Mainline Rebuild Study

Research date: 2026-05-10.

## Summary

AgentFlowStudio should not become a generic Flowise/Langflow/n8n clone. The useful mainline from the best tools is: templates, typed workflow nodes, provider profiles, execution history, trace, human approval, safety guardrails, admin controls, and clear beginner onboarding.

## Flowise / AgentFlow V2

- Mainline user flow: create an AgentFlow, start from Start, configure state/input/memory, add LLM/Agent/Tool/Condition/Human Input/Output nodes, run and inspect each node.
- Architecture idea: explicit node graph with shared state and traceable execution.
- Absorb: visible workflow nodes, condition logic, human-in-the-loop, run/debug timeline.
- Do not copy: a broad low-code chatbot builder or arbitrary code execution.
- Must land now: first-class workflow nodes and run trace.
- Later: visual canvas, loops, MCP tool nodes, evaluations.
- Impact: AgentFlowStudio becomes a project workflow executor, not a feature directory.

## Dify

- Mainline user flow: choose app type, configure model/tools/knowledge, debug, publish.
- Architecture idea: app type plus workflow engine plus provider/tool/knowledge resources.
- Absorb: template-first creation, provider configuration, debug/preview, tool boundaries.
- Do not copy: cloud SaaS publishing and generic chatbot focus.
- Must land now: provider setup as a visible step before runs.
- Later: workflow as local MCP/API capability.
- Impact: every workflow run should be debuggable and reusable.

## Langflow

- Mainline user flow: create project/flow, pick template or blank flow, configure components, test in playground, export/share.
- Architecture idea: serializable flows with component nodes and typed edges.
- Absorb: flow templates, save/version, import/export direction.
- Do not copy: complex port/component system for beginners.
- Must land now: workflow versions and JSON-friendly models.
- Later: canvas editor and workflow import/export.
- Impact: workflows must be durable assets, not transient UI state.

## n8n

- Mainline user flow: trigger to action workflow, configure credentials, test manually, review executions, debug failures.
- Architecture idea: credentials are separate from workflows; executions are first-class.
- Absorb: execution records, failed-run diagnostics, credential separation.
- Do not copy: broad SaaS automation marketplace.
- Must land now: every workflow run writes Run and RunEvent.
- Later: replay, retry, scheduled checks.
- Impact: trace and history are part of the product contract.

## Coze / Coze Studio

- Mainline user flow: configure model service, create Agent/App/Workflow, bind prompt/RAG/plugin/knowledge, debug, publish.
- Architecture idea: resources are centralized and reused across agent apps.
- Absorb: project resources, prompt resources, plugin/provider settings.
- Do not copy: microservice architecture or full bot platform.
- Must land now: project/workflow/provider/audit as linked resources.
- Later: plugin resource system and MCP publishing.
- Impact: AgentFlowStudio should feel like a local resource console.

## FastGPT

- Mainline user flow: create knowledge base, create application from template, bind knowledge, preview, use workflow for complex cases.
- Architecture idea: knowledge/context quality drives workflow quality.
- Absorb: context packs, memory integration, node logs, debug mode.
- Do not copy: RAG-only product shape.
- Must land now: run failures explain missing provider/context and next fix.
- Later: retrieval, context budget, citations.
- Impact: Shared Memory must support the workflow, not sit aside.

## Open WebUI

- Mainline user flow: configure providers/models, create model presets, attach prompt/knowledge/tools/permissions.
- Architecture idea: base models become role-specific presets.
- Absorb: provider/model profile thinking and admin controls.
- Do not copy: generic chat UI or arbitrary Python function execution.
- Must land now: provider profile page stays separate from workflow nodes; workflows reference providers.
- Later: planner/reviewer/tester role presets.
- Impact: managing execution environment is part of onboarding.

## OpenAI Agents SDK / Agent Builder

- Mainline user flow: build from template or canvas, preview with traces, publish/version, use SDK for agents/tools/handoffs/guardrails.
- Architecture idea: typed agents, tools, handoffs, state, guardrails, tracing, evals.
- Absorb: typed nodes, handoff model, guardrails, trace.
- Do not copy: hosted deployment path or ChatKit focus.
- Must land now: Start/Prompt/LLM/Tool/Condition/Human Approval/Output nodes.
- Later: evals and SDK/code export.
- Impact: AgentFlowStudio workflows should be observable and testable.

## cc switch-like Config Switchers

- Mainline user flow: add providers, map models/tools, switch configuration per tool/project, keep backups and logs.
- Architecture idea: low-cognitive-load provider/profile switching.
- Absorb: provider profiles, masked secrets, project default provider.
- Do not copy: only a switcher; workflow is still the core.
- Must land now: Provider/API key setup stays a dashboard action and secrets are held by main.
- Later: model role mapping and external CLI config sync.
- Impact: the first useful workflow run depends on a clear provider setup path.

## New Mainline Influence

First launch -> login/admin initialization -> dashboard -> create project -> choose template or blank workflow -> configure Provider/API key -> edit nodes -> run workflow -> inspect Timeline/Trace -> fix errors -> save version -> export/share -> admin users/audit/diagnostics.

Sources include official docs for Flowise, Dify, Langflow, n8n, Coze Studio GitHub/Wiki, FastGPT docs, Open WebUI docs, OpenAI Agents SDK/Agent Builder docs, and cc switch public docs.
