# AgentFlow Studio UI Design System

Date: 2026-05-11  
Scope: lightweight UI second refactor for `D:\AgentFlowStudio`

## Direction

The default interface is now a compact desktop configuration tool. It avoids Liquid Glass, glassmorphism, large transparent surfaces, heavy blur, glow, and stacked gradients.

The reference study looked at CC Switch / cc-switch style tools for ideas only: compact provider configuration, unified MCP / Prompts / Skills management, inline status, low-friction switching, session/log visibility, and tool-like information density. No code, logo, icon, trademark, or proprietary visual asset was copied.

References:

- [CC Switch](https://ccswitch.ai/)
- [CC Switch docs, MoleAPI](https://docs.moleapi.com/en-US/docs/apps/cc-switch)

## Color System

Light mode:

| Token | Value | Use |
|---|---|---|
| `--bg-primary` | `#f6f7f9` | App background |
| `--bg-secondary` | `#eef1f5` | Secondary page background |
| `--surface` | `#ffffff` | Cards, panels, controls |
| `--surface-muted` | `#f2f4f7` | Subtle panels and empty states |
| `--surface-hover` | `#f8fafc` | Hover state |
| `--border` | `#d9dee7` | Default divider |
| `--border-strong` | `#c5ccd8` | Active/hover border |
| `--text-primary` | `#17202c` | Headings and primary labels |
| `--text-secondary` | `#536173` | Secondary copy |
| `--text-muted` | `#7a8798` | Hints and metadata |
| `--accent` | `#256f8f` | Primary actions and selected nav |
| `--accent-hover` | `#1d5d78` | Primary hover |

Dark mode:

| Token | Value | Use |
|---|---|---|
| `--bg-primary` | `#15191f` | App background |
| `--bg-secondary` | `#101419` | Deeper background |
| `--surface` | `#1c222a` | Cards, panels, controls |
| `--surface-muted` | `#232a34` | Subtle panels |
| `--surface-hover` | `#27303b` | Hover state |
| `--border` | `#343d4a` | Default divider |
| `--border-strong` | `#465263` | Active/hover border |
| `--text-primary` | `#eef2f7` | Headings and primary labels |
| `--text-secondary` | `#b4bfcc` | Secondary copy |
| `--text-muted` | `#8390a1` | Hints and metadata |
| `--accent` | `#68a9c4` | Primary actions and selected nav |
| `--accent-hover` | `#82bdd4` | Primary hover |

Status colors:

| Token | Light | Dark intent |
|---|---|---|
| `--success` | `#23875a` | Positive completion |
| `--warning` | `#a86413` | Risk or pending review |
| `--danger` | `#c2413b` | Destructive or failed |
| `--info` | `#2d6fa3` | Neutral informational state |

## Typography

Default font stack:

```css
"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif
```

Monospace stack:

```css
"Cascadia Code", "SFMono-Regular", Consolas, ui-monospace, monospace
```

KaiTi is not the default professional UI font. A calligraphy-like theme can be added later as an optional theme, but it should not be used for the default desktop tool surface.

## Spacing And Radius

| Token | Value | Use |
|---|---:|---|
| `--page-padding` | `20px` | Main content padding |
| `--card-padding` | `16px` | Normal card padding |
| `--form-gap` | `12px` | Form stack spacing |
| `--list-gap` | `8px` | List item spacing |
| `--radius-button` | `6px` | Buttons and small controls |
| `--radius-input` | `6px` | Inputs and selects |
| `--radius-card` | `8px` | Cards and panels |

## Component Rules

- Sidebar: solid raised surface, thin right border, compact nav rows, selected row uses muted accent fill.
- Topbar: plain surface separation and direct actions; no hero treatment.
- Cards: `SurfaceCard` uses `surface-card`, border, small radius, restrained shadow.
- Buttons: primary is accent-filled, secondary is surface/border, ghost is text-first, danger uses danger token.
- Inputs/selects/textarea: solid surface, 1px border, clear focus ring, no transparency.
- Tables/lists: tokenized borders, muted metadata, readable row density.
- Badges: small, bordered, status-token fills.
- Toast/empty states: muted surfaces and direct copy; no decorative effects.
- Modals: plain overlay and surface panel with minimal fade.

## Page Experience

The intended beginner path remains visible:

```text
Create project -> Configure Agent -> Create Workflow -> Run -> Logs / feedback repair
```

Dashboard and configuration pages should feel like an operations console, not a landing page. Projects, Agents, Workflows, Prompt Lab, Memory, Git, Admin, and Settings should prioritize scanability, explicit status, and predictable controls.

## Why Liquid Glass Was Removed

Liquid Glass made the app feel visually heavy and inconsistent for long-running developer work: blur and transparency reduced contrast, large highlights competed with data, and the style did not match a configuration-heavy desktop utility. The new system relies on solid surfaces, restrained color, clear borders, and stable typography so the app is easier to scan in both light and dark mode.
