# Agent B - I18n Theme Hardening

Strengthen Chinese/English switching and light/dark/system theme controls in Static fallback and React renderer helper paths.

Focus files:

- `static-app\index.html`
- `static-app\app.js`
- `static-app\styles.css`
- `src\renderer\lib\i18n.ts`
- `src\renderer\lib\theme.ts`

Must confirm or implement:

- Topbar language toggle persists `agentflow.language`.
- Topbar theme toggle persists `agentflow.theme`.
- Settings page contains Chinese and English Interface Preferences.
- Translations contain `zh`, `en`, and `t(key)`.
- CSS variables cover `[data-theme="light"]`, `[data-theme="dark"]`, and `prefers-color-scheme`.
- Major routes avoid large areas of hard-coded English.
