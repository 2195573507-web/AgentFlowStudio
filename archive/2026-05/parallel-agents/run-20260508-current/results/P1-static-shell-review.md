# P1 Static Shell Review: Dashboard / Projects / Settings

Scope: static review only. Reviewed `static-app/app.js`, `static-app/styles.css`, and the local Liquid Glass design-system notes. No app code was edited.

## Executive Findings

1. The Liquid Glass token layer exists, but several visible shell surfaces still use hardcoded `rgba(...)` values instead of the new tokens. This makes dark-mode tuning and future token changes brittle.
2. Dashboard, Projects, and Settings all rely on broad layout helpers (`.two-col`, `.three-col`, `.row`, `.spread`, `.panel`, `.item-card`) without page-level classes. Visual polish should add page-specific wrappers/classes first, then tune those wrappers.
3. Primary button contrast is likely weak in dark mode: `--accent` becomes a light blue while `.btn.primary` keeps `color: white`.
4. The static shell has basic semantic structure, but active nav, theme/language state, metric summaries, and settings controls need clearer accessible state semantics.
5. Settings layout currently uses a two-column grid for three panels, so Data Management becomes an orphan panel in the next row instead of a deliberate full-width or secondary danger-zone section.

## Dashboard Recommendations

- `static-app/app.js:453-459` dashboard metric cards should become a semantic summary list or `dl`-style structure. Add a page wrapper such as `class="dashboard-page"` and a metric-specific class such as `class="stat-card dashboard-metric"`.
- `static-app/styles.css:282-284` `.stats-grid` jumps from 5 columns to 2 at 1100px, then 1 at 780px. Consider `repeat(auto-fit, minmax(150px, 1fr))` plus stable `min-height` on metric cards to avoid abrupt wrapping around the 1024x680 target.
- `static-app/app.js:461` and `static-app/app.js:483` use inline `style="margin-top:16px"`. Replace later with a page stack class, for example `.page-stack > section + section`, so spacing follows the design system and does not require inline exceptions.
- `static-app/app.js:466-472` uses generic `.row` for five dashboard actions. The long "generate cross-model recovery context" action can crowd the row. Introduce `.dashboard-actions` with an auto-fit grid or full-width last item at narrow sizes.
- `static-app/app.js:474-479` Current Project could be more informative with updated time, task counts, and status as metadata tags. Keep the status visually secondary; the project name should remain the scannable anchor.
- `static-app/styles.css:312-330` metric cards are visually similar to generic cards. Add metric affordances using tokens: subtle accent rail, small icon slot, or status color variable. Avoid changing shared `.stat-card` if project detail also uses it.

## Projects Recommendations

- `static-app/app.js:521-567` puts New Project and Project List at equal weight. The list is the primary workflow after setup; consider a `.projects-page` layout where the project list gets the wider column and New Project becomes a compact creation panel.
- `static-app/app.js:542-564` lacks an empty state when `state.projects` is empty. Add an `.empty` block with a direct "New Project" action.
- `static-app/app.js:545-561` project cards should have page-specific classes such as `.project-card`, `.project-meta`, and `.project-actions`. This will let visual polish target project cards without changing memory cards, prompt cards, or dashboard cards.
- `static-app/app.js:550-553` platform and tech-stack tags can become very long. Add `min-width: 0`, `overflow-wrap: anywhere`, and a metadata row class before tuning `.tag` globally.
- `static-app/app.js:555-559` destructive Delete currently sits beside View Details with similar visual weight. Put project actions in a card footer and visually separate the danger action, or require a confirmation pattern before delete.
- Semantic improvement: render the project list as a list (`ul`/`li`) or add `aria-label`/`aria-labelledby` to the section. Each article should have a stable heading id if later used by controls.

## Settings Recommendations

- `static-app/app.js:1102-1158` uses `.grid.two-col` for three settings panels. Give settings a dedicated `.settings-grid`; make Data Management span both columns or place it in a right-side stack under Interface Preferences.
- `static-app/app.js:1108` puts "already saved, last four" text in the password input value. This is risky semantically and confusing for assistive tech. Prefer an empty password field with helper text, a "saved key ending ..." note, and explicit Replace/Clear actions.
- `static-app/app.js:1110-1127` binary and option controls are rendered as selects. Consider a toggle for Shared Memory, segmented controls for theme/language, and a compact radio/segmented control for memory injection mode.
- `static-app/app.js:1121-1122` numeric fields should include minimum/maximum guidance and helper copy. Visual polish should reserve fixed widths for numeric controls so the three-column settings row remains stable.
- `static-app/app.js:1148-1156` Data Management mixes export and destructive clear/reset actions. Make this a distinct "danger zone" surface with stronger hierarchy, explanatory helper text, and less accidental proximity between export and clear.
- `static-app/app.js:1133-1146` Interface Preferences duplicates topbar language/theme actions. The UI should show current state via `aria-pressed`, selected segmented state, or explicit current labels.

## Shell / Navigation Recommendations

- `static-app/app.js:415` active nav buttons only use the `active` class. Add `aria-current="page"` for the active page.
- `static-app/app.js:436-439` language/theme buttons do not expose selected/current state. Add `aria-pressed` for language buttons and make the theme button label describe the current mode plus action, not only the next mode.
- `static-app/styles.css:117-131`, `199-211`, `248-274`, `180-190`, `411-420`, and `469-473` still use hardcoded transparent backgrounds or accent rgba values. Add tokens like `--glass-surface-muted`, `--accent-border`, `--accent-hover`, `--focus-ring`, and `--danger-border`.
- `static-app/styles.css:417-420` `.btn.primary` should use an accent foreground token. In dark mode, white text over `--accent: #78aaff` is likely below WCAG contrast.
- `static-app/styles.css:240-246` topbar actions wrap but have no max-width or priority. At narrow widths, the mode pill and action buttons can consume the header. Consider grouping language/theme/export into a compact toolbar.

## Risky Selectors To Treat Carefully

- `static-app/styles.css:277-280` `.grid`: used everywhere. Do not change gap or display globally unless every page is rechecked.
- `static-app/styles.css:282-284` `.stats-grid`: dashboard-specific in name, but still shared by all metric cards. Safe-ish, but verify project detail stats if reusing `.stat-card`.
- `static-app/styles.css:286-288` `.two-col`: used by dashboard, projects, project detail, prompt lab, log analyzer, safety box, shared memory, and settings. Use page-specific grid classes before changing.
- `static-app/styles.css:290-292` `.three-col`: used inside forms and metric sections. Global changes can break settings numeric fields and project forms.
- `static-app/styles.css:294-306` `.panel, .stat-card, .item-card, .form-box`: global glass surface rule. Any shadow/radius/background change affects nearly every page.
- `static-app/styles.css:333-350` `.section-title`: shared heading/action layout. Changing wrapping or alignment may affect panels with buttons, tags, and badges.
- `static-app/styles.css:359-370` `.row` and `.spread`: generic flex helpers. Dashboard actions, project metadata, project cards, memory cards, and form rows all depend on these.
- `static-app/styles.css:396-437` `.btn`, `.btn.primary`, `.btn.danger`, `.btn.ghost`, `.btn.small`: global action system. Contrast fixes are needed, but test all pages after changing.
- `static-app/styles.css:439-474` `.field input`, `.field textarea`, `.field select`: global form styling. Settings polish should not be done here first; add settings-specific classes for control density.
- `static-app/styles.css:248-274` `.mode-pill, .status-pill, .tag, .risk-pill`: these are grouped together. Token or spacing changes to tags will also affect status and risk badges.
- `static-app/styles.css:630-680` breakpoint rules: current breakpoints are broad. Add page-specific responsive rules rather than expanding this shared media block blindly.

## Suggested Implementation Order

1. Add page wrapper classes from `app.js`: `.dashboard-page`, `.projects-page`, `.settings-page`, plus page-specific child classes.
2. Add missing semantics: `aria-current`, `aria-pressed`, labelled sections, and better settings helper text.
3. Add or refine tokens for focus, accent foreground, accent border, muted glass surface, and danger border.
4. Polish dashboard metrics and action strip.
5. Restructure settings grid and danger zone.
6. Polish project list cards and empty state.

## Blockers / Watch Items

- No runtime/browser pass was performed in this dispatch. The next agent should verify at 1024x680, a mobile width, light mode, and dark mode.
- Avoid broad CSS edits until page-level classes exist; the shared selectors are too coupled for safe visual tuning.
- `static-app/index.html` displayed mojibake in meta/title text during review. It was outside the requested app.js/styles.css scope, but a separate encoding check is recommended before release.
