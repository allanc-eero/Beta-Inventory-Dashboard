# EDS Refactor Mapping (shared reference for refactor agents)

Apply these EXACT conventions. Preserve ALL behavior/logic — only swap the UI/styling layer.
Keep `'use client';` at the top of every file.

## WDS component imports (from `@amzn/eero-web-design-components`)
- `Button` — `<Button type="primary|default|text" label="…" onClick={…} danger fullWidth loading disabled />`
  - For an icon+text label, pass a node: `label={<span className="flex items-center gap-1.5"><Icon size={14}/> Text</span>}` and add `ariaLabel="…"`.
- `Select` — REQUIRES `id`. `<Select id="…" value={v} onChange={(val)=>…} options={[{value,label}]} />` (onChange gives the VALUE, not an event). Wrap in a fixed-width div if needed (`<div className="w-40">`).
- `Input` — REQUIRES `id`. `<Input id="…" label="…" value={v} onChange={(e)=>…} placeholder="…" layout="vertical" />` (onChange gives a ChangeEvent like native).
- `TextArea` — REQUIRES `id`. Same shape as Input.
- `Tag` — `<Tag color="grey|navy|periwinkle|green|orange|red|turquoise|ocean|purple|terracotta|yellow" size="regular" showIcon>{label}</Tag>`
- `Modal` — `<Modal isOpen title="…" onCancel={onClose} onOk={handler} okText="…" cancelText="…" hideFooter?>{children}</Modal>` (replaces bespoke fixed-inset overlay + backdrop + card; remove manual X close button and footer buttons when using onOk/onCancel).
- `Checkbox` — `<Checkbox checked={b} onChange={(e)=>…} />` (replaces `<input type="checkbox">`).
- `Card` — `<Card size={2|3|5} title={node} extra={node}>{children}</Card>` (replaces `bg-white rounded-xl shadow-sm border p-… ` wrappers).
- `Tabs` — `<Tabs activeKey={k} onChange={(key)=>…} items={[{key,label,children}]} />` (replaces bespoke tab-button rows).

## Color token map (hardcoded Tailwind → EDS token utility)
| Old | New |
|---|---|
| `bg-white` | `bg-[var(--ui-background-layer-layer-page)]` |
| `bg-gray-50` (page bg) | `bg-[var(--ui-background-layer-background-page)]` |
| `bg-gray-50/100` (hover/subtle) | `bg-[var(--ui-background-layer-layer-page-hover)]` |
| `text-gray-900` | `text-[var(--ui-text-text-primary)]` |
| `text-gray-700` / `text-gray-800` | `text-[var(--ui-text-text-secondary)]` |
| `text-gray-500` / `text-gray-600` | `text-[var(--ui-text-text-tertiary)]` |
| `text-gray-400` | `text-[var(--ui-text-text-placeholder)]` |
| `text-gray-300` | `text-[var(--ui-text-text-disabled)]` |
| `border-gray-100/200/300` | `border-[var(--ui-background-layer-border-border-layer-page)]` |
| `text-blue-600/700` (links) | `text-[var(--ui-core-periwinkle-periwinkle-6)]` (hover `-7`) |
| `bg-blue-50` | `bg-[var(--ui-support-fill-support-info)]` |
| `border-blue-200` | `border-[var(--ui-support-border-support-info)]` |
| `text-blue-700/800` (on info bg) | `text-[var(--ui-support-text-icon-support-info)]` |
| `bg-red-50` / `border-red-200` / `text-red-700` | `bg-[var(--ui-support-fill-support-error)]` / `border-[var(--ui-support-border-support-error)]` / `text-[var(--ui-support-text-support-error)]` |
| `bg-green-50` / `border-green-200` / `text-green-700` | `bg-[var(--ui-support-fill-support-success)]` / `border-[var(--ui-support-border-support-success)]` / `text-[var(--ui-support-text-support-success)]` |
| `bg-yellow-50` / `border-yellow-200` / `text-yellow-800` | `bg-[var(--ui-support-fill-support-warning)]` / `border-[var(--ui-support-border-support-warning)]` / `text-[var(--ui-support-text-icon-support-warning)]` |
| `text-red-600` | `text-[var(--ui-core-red-red-6)]` |
| `text-green-600` | `text-[var(--ui-core-green-green-6)]` |
| `text-orange-600` | `text-[var(--ui-core-orange-orange-6)]` |

## Status/inline badges (spans like `bg-green-100 text-green-700 rounded-full`)
Replace with `<Tag color="…" size="regular">{text}</Tag>`:
- green pill → `color="green"`, yellow → `color="orange"`, red → `color="red"`, blue → `color="periwinkle"`, gray → `color="grey"`, orange → `color="orange"`, purple → `color="purple"`.

## Tables
Keep the existing `<table>` structure and row-click/sort/group behavior, but re-skin classes with the token map above (headers, borders, hover rows). Do NOT convert to TableV2 (behavior-sensitive) unless the table is trivial. Header cells: `text-[var(--ui-text-text-tertiary)]`, row hover: `hover:bg-[var(--ui-background-layer-layer-page-hover)]`, dividers/borders: the border token.

## Arbitrary text sizes
`text-[13px]` → `text-sm`; `text-[11px]`/`text-[10px]`/`text-[9px]` → `text-xs`. Only change if it won't overflow a tight layout; otherwise leave with a note.

## Brand color
`#2c3e7a` is already migrated to `var(--ui-core-periwinkle-periwinkle-6)` globally — if you still see it, replace it.

## Rules
- Do not change routing, data logic, store calls, or props/behavior.
- Verify WDS components exist before importing.
- lucide-react icons may stay (they're not part of WDS); just token-map their `text-*` color classes.
