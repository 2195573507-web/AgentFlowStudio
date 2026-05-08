# Agent D - Secret Redaction

Repair recursive redaction so API keys and tokens do not enter memory, exports, handoff, or Prompt injection.

Focus files:

- `static-app\app.js`
- `src\renderer\lib\secretRedaction.ts`
- `src\renderer\lib\memoryStore.ts`
- `src\renderer\lib\memoryInjection.ts`
- `src\main\ipc.ts`
- `src\main\storage.ts`

Must confirm or implement:

- Redaction handles strings, arrays, objects, nested values, and circular references.
- Redaction protects `sk-`, Bearer tokens, api_key/API_KEY, password, secret, access_token, refresh_token, authorization, and token.
- Output placeholder is `[REDACTED]`.
- Memory save/export/recovery/injection paths use redaction.
- Settings API key display remains masked and never enters memory export.
