# Agent C - Shared Memory Injection

Repair or complete Shared Memory injection for Prompt Lab and project detail flows.

Focus files:

- `static-app\app.js`
- `src\renderer\lib\memoryStore.ts`
- `src\renderer\lib\memoryRetriever.ts`
- `src\renderer\lib\memoryInjection.ts`
- `src\renderer\routes\PromptLab.tsx`
- `src\renderer\routes\ProjectDetail.tsx`
- `src\renderer\routes\SharedMemoryHub.tsx`

Must confirm or implement:

- Shared Memory Hub can add, search, archive, and generate recovery prompt.
- Prompt Lab has Inject Shared Memory with off/minimal/balanced/full modes.
- Injected prompt includes `[Shared Memory Context]` sections in Chinese or English.
- Empty memories show a friendly message.
- Generated prompt can be copied.
