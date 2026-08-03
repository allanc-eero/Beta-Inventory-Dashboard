---
inclusion: always
description: Rules for building with EDS — component usage, token enforcement, Figma translation, styling, and scope management.
---

# EDS Development Rules

Rules for building with the eero Design System. Covers component usage, token enforcement, Figma-to-code translation, and styling standards.

---

## What is EDS

- EDS = the full eero design system. It includes the `@amzn` npm packages (current standardized web components + tokens) plus Insight web components being standardized (marked 🟢 in `.kiro/steering/insight/`).
- The `@amzn` packages are the current source of truth for what's ready to use today.
- Insight components that haven't been promoted yet can be referenced via `.kiro/steering/insight/` for project-specific work.
- App (mobile) components are a separate platform — they share foundations (colors, spacing, typography) but not web components.

**What is NOT EDS:**

- The docsite (`apps/docsite/`) is the documentation website that documents EDS — it is not a product and not a source for components.
- The docsite Storybook (`apps/docsite/storybook/`) contains usage _examples_ of WDS components — it is NOT the source of truth. The source is the WDS Storybook (from the `web-design-system` repo). The `@amzn` npm package is the code source of truth.

---

## Source of Truth

- **Components (imports)** — `node_modules/@amzn/eero-web-design-components/` — what you import and use in code
- **Design tokens (imports)** — `node_modules/@amzn/eero-web-design-foundation/` — colors, spacing, typography, radius, elevation
- **Full styles (imports)** — `@amzn/eero-web-design-components/library/styles.css`
- **Variant examples (reference)** — `.reference/web-design-system/components/src/*/stories/` — how to configure each component for specific use cases
- **Insight components (reference)** — `.reference/web-eero-insight/src/components/` — components not yet in WDS (Chart, CircularGauge, DataTable, etc.)
- **Page compositions (reference)** — `.reference/web-eero-insight/src/app/` — how components assemble into full pages
- **Design decisions** — `eds-guidelines.md` — when to use which component, accessibility, UX rules

**Important:** `node_modules/@amzn/` has the components but NOT usage examples. The `.reference/` clones provide the implementation examples showing how to configure variants. Always check both.

---

## Component Usage (Critical)

**BEFORE writing any UI code, you MUST:**

1. **Check `node_modules/@amzn/eero-web-design-components/` FIRST.** Browse the full package — typings, library, styles. Look for an existing component that serves the purpose. This is the source of truth for production imports.
2. **Check `node_modules/@amzn/eero-web-design-foundation/` for all styling values.** Browse the full package — tokens, fonts, presets. This is the source of truth for colors, spacing, typography, radius, and elevation.
3. **For variant examples, read `.reference/web-design-system/components/src/*/stories/`.** These show every configuration of every WDS component (collapsed sidebar, brush with time range, expandable table, etc.). Use these to configure components correctly.
4. **If NOT in WDS, check `.reference/web-eero-insight/src/components/` for Insight components.** 92 components exist in Insight that are not in WDS. Reusable examples: Charts (includes CircularGauge), DataTable, EditableCard, ExpandableCard, KeyValuePairs, SimpleData, PageSection, TableWithBulkActions, PeriodSelector, CardSkeleton, TableSkeleton, FileUpload, SimplePagination. Read the actual source code. Install their external dependencies (e.g., `recharts` for Charts) as needed.
5. **For page compositions, read `.reference/web-eero-insight/src/app/`.** This shows how components are assembled into full pages — dashboard layouts, analytics views, settings pages, detail pages. Use these as the reference for page structure.
6. **If a WDS component exists, USE IT.** Do not create a local version.
7. **If NOT in WDS or Insight references, check `eds-guidelines.md`** for a documented pattern or foundation that covers the use case.
8. **Only if nothing exists in WDS, Insight, or guidelines — ASK before creating a bespoke component.**
9. **Never silently create a component that duplicates existing functionality.**
10. **Maximize component coverage.** Don't just use the obvious components (Card, Table, Button). Check WDS and Insight for smaller utilities that add polish — Tooltip, Divider, CopyableText, EllipsisText, KeyValuePairs, PageSection, EditableCard, IconButton, TinyIconButton. If it exists and fits the use case, use it.
11. **Before delivering code, self-audit.** Compare every UI element against WDS exports and Insight source. If a component exists for something you built manually, replace it.

---

## P0 — Non-Negotiable

> **ALWAYS prioritize correctness over brevity.** This is the single most important rule. Never compress, simplify, abbreviate, or reduce code to save file size. Never gloss over details. Never create bespoke components when existing ones serve the purpose. Show the full capability of EDS — use every relevant component, include complete mock data, and match production page patterns exactly. Every output should look and work like a real production page. If you find yourself creating something custom, STOP and check if it already exists in WDS, Insight, or the reference repos first.

---

## Core Principle

**EDS is the source of truth.** All styling, components, and tokens from EDS override existing project styles unless the user explicitly requests a bespoke style. If someone installs EDS, their app should look and feel like eero.

**Default behavior: use what exists.** Whether a user is building from scratch, reskinning, or extending — always start with existing WDS components, Insight patterns, and EDS tokens. Only introduce something new when nothing in the system serves the purpose AND the user explicitly approves it. The system has 40+ components, 92 Insight components, and full page patterns — exhaust those before creating anything bespoke.

When a user describes what they want to build:

1. **Clarify scope first** — ask what they need: a full working prototype, page scaffolding/mockups, or a design recommendation.
2. **Read `insight-patterns.md`** — match their request to existing page templates and scaffolding. Use the exact Tailwind classes documented.
3. **Read `insight-components.md`** — compose using existing Insight components. Use the exact code structure and styling documented.
4. **Check `@amzn/eero-web-design-components` typings** — verify props before using any WDS component.
5. **Check `eds-guidelines.md`** for design decisions — when to use which component, accessibility rules, platform differences.
6. **Style using tokens from `@amzn/eero-web-design-foundation`** — never hardcode values.
7. Only if no existing component or pattern fits — flag it and ask before creating new.

---

## Token Usage (Critical)

- **Always use design tokens.** Never hardcode colors, spacing, font sizes, radius, or elevation values.
- If a value doesn't match a token, use the nearest token and note the mapping.
- Token locations:
  - Colors: `@amzn/eero-web-design-foundation/tokens/tw-styles/color-variables.css`
  - Theme: `light-variables.css` / `dark-variables.css`
  - All scales: `tw-custom-preset.js`

### Custom Hex Values from Figma

When a hex value doesn't match a token:

```
⚠️ NO MATCHING TOKEN
Value: #2268FF
Closest tokens:
  - periwinkle-5: #5c92ff
  - periwinkle-6: #0e55f0
Recommendation: Pick the closest match, or confirm this is an intentional custom value.
```

If confirmed intentional, use with a comment: `/* custom — no token */`

---

## Styling Standards

### Tailwind

- Use Tailwind CSS utility classes mapped to design tokens.
- **No arbitrary values**: do not use `px-[…]`, `gap-[…]`, `mt-[…]`, `w-[…]`, `text-[…]`.
- If Figma spacing doesn't match a token exactly, round to the nearest token and note it.

### CSS Import Order

See `eds-installer.md` for the authoritative CSS import order. Key principle: EDS styles load last and override project styles — EDS is the source of truth for all visual decisions.

---

## Figma-to-Code Translation

### Source of Truth

- Use Figma MCP structured layout as the source of truth: Auto Layout padding, gap, constraints, alignment, sizing, and typography.
- Do not infer spacing from screenshots. Only use screenshots for visual QA after implementation.

### Layout Fidelity

- Recreate layout using flex/grid + gap (match Auto Layout spacing).
- Use parent padding instead of child margins.
- Avoid absolute positioning except for intentional overlays.
- Preserve hierarchy: section containers → stacks/grids → primitives.

### Real-Element Composition

1. **Figma MCP for layout data** — exact coordinates, spacing, font sizes, asset URLs.
2. **Real HTML for all text** — correct font families (Centra No2, JetBrains Mono), exact font-size, line-height, letter-spacing, color.
3. **Individual SVGs for illustrative/icon pieces only** — compose with absolute positioning.
4. **Reuse shared components** — check existing before building custom.
5. **Token-map every color** — comment block listing hex → token mappings.

### Typography

- Use design system text styles/tokens only.
- Match Figma line-height and font weight using tokenized Tailwind utilities.
- If font metrics differ, adjust line-height tokens before changing spacing.

---

## Visual Adjustment Rules

When asked to move, resize, or reposition elements:

- **Just change the value.** Do not add new props, create abstractions, or modify architecture.
- Use existing CSS properties (margin, padding, transform, font-size, line-height).
- Never introduce new component props or wrapper elements for simple visual tweaks.
- `translateY(-Npx)` = up, `translateY(Npx)` = down.

### Size Adjustments

- Set explicit px widths/heights on target elements, not parent containers.
- Use fixed px values. Do not use `calc()`, percentages, or relative units.
- One property change per element. No refactoring.

---

## Scope Rules

One task, one scope. Only touch what you're asked to touch.

| Type          | Scope                             | Examples                    |
| ------------- | --------------------------------- | --------------------------- |
| **Component** | Single component's files only     | Button, Modal, Card         |
| **Layout**    | Page structure/positioning only   | PageShell, Container        |
| **Pattern**   | Reusable pattern files only       | Form patterns, Card grids   |
| **Visual**    | Styles within target element only | Colors, typography, spacing |

**Forbidden:**

- Do not modify anything outside the target scope
- Do not refactor unrelated files
- Do not change Tailwind config, tokens, global CSS, routing, or app structure
- Do not "fix" or "improve" things you weren't asked to touch

---

## Running the Demo Apps

The `apps/` directory contains runnable demo apps that showcase EDS in real
product-style UIs.

| Demo        | Package name                             | Run command               |
| ----------- | ---------------------------------------- | ------------------------- |
| eero Pulse  | `@ux-design-systems/eds-demo-eero-pulse` | `npm run demo:pulse`      |
| Backup Data | `@ux-design-systems/eds-demo-backupdata` | `npm run demo:backupdata` |
| Partner Hub | `@ux-design-systems/eds-demo-partnerhub` | `npm run demo:partnerhub` |

**When a user asks to "run demo pulse", "run the eero pulse demo", "start
backupdata", etc.:**

1. **Run the single root command** — e.g. `npm run demo:pulse` — from the repo
   root. It starts the demo's dev server on localhost.
2. **Do NOT `cd` into the app directory.**
3. **Do NOT run a separate `npm install` inside the app.** The demos are root
   workspaces, so their dependencies are already installed and linked by the
   one root `npm install`. Instructing a per-app install is the old,
   pre-workspace behavior and must not be used.

**Only fall back to installing if the run command errors:**

- **`Cannot find module` / missing deps / workspace not linked** → run
  `npm install` **once from the repo root** (never per-app), then re-run the
  demo command. A root install covers all demos.
- **`E401` / auth errors on `@amzn/*` packages** → CodeArtifact token expired.
  Ask the user to run `npm run codeartifact:login` (interactive Amazon auth),
  then retry.

---

## Output Requirements

- Provide a minimal diff/patch
- List exactly what changed
- Confirm scope was respected
- Note any token mappings or deviations
