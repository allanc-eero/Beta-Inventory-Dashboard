---
inclusion: always
description: Proactively scans code for design system drift — flags inconsistencies against EDS components, tokens, and patterns.
---

# EDS Linter

Proactively checks code for design system consistency. References `eds-guidelines.md` (offline) or the EDS Knowledge Base (online) as the source of truth.

---

## When to Run

- Before creating or modifying any component, token, or pattern
- When reviewing existing code in any repo using EDS
- When auditing a file or feature for design system compliance

---

## Checks (Required)

### 1. Component Check

Before creating a new component:

- Check `@amzn/eero-web-design-components` exports for an existing component that serves the same purpose
- If one exists, USE IT — do not create a duplicate
- If one exists but doesn't quite fit, flag it:

```
⚠️ EXISTING COMPONENT
Component: {name}
Gap: Missing {feature}
Recommendation: Extend existing rather than creating new
```

### 2. Token Check

Before using any color, spacing, font size, radius, or elevation value:

- Check `@amzn/eero-web-design-foundation/tokens/` for the matching token
- Colors: `tw-styles/color-variables.css`
- All other scales: `tw-styles/tw-custom-preset.js`
- If a token exists, it MUST be used
- If hardcoded, flag it:

```
⚠️ HARDCODED VALUE
Value: {value}
Closest token: {token_name} ({token_value})
Action: Replace with token or confirm intentional custom value
```

### 3. Pattern Check

Before implementing a UI pattern:

- Check `eds-guidelines.md` or query the KB for the documented pattern
- Check existing implementations in the codebase
- If the implementation deviates, flag it:

```
⚠️ PATTERN DEVIATION
Pattern: {pattern_name}
Expected: {documented approach}
Actual: {what the code does}
Recommendation: Align with documented pattern or justify deviation
```

### 4. Arbitrary Value Check

Scan for Tailwind arbitrary values that should use tokens:

- `px-[…]`, `gap-[…]`, `mt-[…]`, `w-[…]`, `text-[…]`, `rounded-[…]`
- Each one should map to a design token
- Flag any that don't have a clear token equivalent

---

## Flagging Format

When an inconsistency is detected:

```
⚠️ DESIGN SYSTEM INCONSISTENCY
What: [description]
Existing: [what exists in the shared library]
Proposed: [what the current code does differently]
Recommendation: [use existing / extend existing / create new with justification]
```

---

## Component-to-Guidance Mapping

When checking design compliance, map WDS component names to their guidance section in `eds-guidelines.md`:

| WDS Component                        | See Guidance Under         |
| ------------------------------------ | -------------------------- |
| DropdownButton, DropdownIconButton   | Buttons > Dropdown         |
| SplitButton                          | Buttons > Split dropdown   |
| IconButton, TinyIconButton           | Buttons > Types            |
| InputMenu, InputMenuDropdown         | Input Menus                |
| InputNumber, InputPassword, TextArea | Input > Types              |
| TableV2, MultiFieldTableV2           | Tables                     |
| AutoComplete                         | Input Menus > Autocomplete |
| CardCarousel                         | Card > Types               |
| ProgressBar                          | Loaders > Progress bar     |
| SortableList, SortFilterWidget       | Sort and Filter            |
| Tree, TreeView                       | Navigation                 |
| OverlayPanel                         | Panel or Modal             |
| EllipsisText, CopyableText           | Typography utilities       |

For code examples, check `.reference/web-design-system/components/src/*/stories/` (primary), query the KB, or check `apps/docsite/storybook/stories/`

---

## Knowledge Source Priority

Check these sources in order:

1. **EDS Knowledge Base** (if configured) — live, queryable, always current
2. **`eds-guidelines.md`** — offline reference, full design system knowledge
3. **`@amzn/eero-web-design-components`** — check actual exports and typings in `node_modules`
4. **`@amzn/eero-web-design-foundation/tokens/`** — check actual token values
5. **`.reference/web-design-system/components/src/*/stories/`** — WDS variant examples (how to configure props)
6. **`.reference/web-eero-insight/src/components/`** — Insight components not yet in WDS
7. **`.reference/web-eero-insight/src/app/`** — page compositions showing how components assemble
8. **Figma** — design source of truth (via Figma MCP if configured)
9. **Storybook** — `apps/docsite/storybook/stories/` (local usage examples)
10. **Existing codebase** — how patterns are currently implemented

### Components in Figma but Not Yet in Code

Some components exist in Figma (design is complete) but haven't been added to `@amzn/eero-web-design-components` yet. When encountering these:

- Do NOT flag as "missing from WDS" — the design exists, code hasn't caught up
- Reference the Figma spec for implementation guidance
- Follow EDS tokens and styling standards when building
- See `insight/insight-coverage-audit.md` for the current gap analysis

---

## Rules

- **Never silently create a component that duplicates shared library functionality**
- **Never silently introduce a color, spacing, or font size that doesn't map to a token**
- **Never silently deviate from a documented pattern without flagging it**
- **Always prefer using an existing component over creating a new one**
- **Always prefer using an existing token over introducing a new value**
- **When in doubt, flag it and ask**
- **Designer approval overrides** — if a designer explicitly approves a deviation, that's fine

---

## What This Does NOT Cover

- Docsite-specific layout rules (see `docsite/docsite-steering.md`)
- How to build new code (see `eds-development.md`)
- Full design system reference (see `eds-guidelines.md`)
