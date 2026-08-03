---
inclusion: manual
description: Installs and configures all eero Design System dependencies — WDS components, foundation tokens, reference repos, steering files, and AI tooling.
---

# EDS Installer

When a user asks to "install EDS", "set up the design system", "install WDS", "add eero components", or "get EDS dependencies", follow this guide to install and configure everything needed to use the eero Design System.

This installs the full stack: steering files for AI context, reference repo clones for variant examples and page compositions, WDS components, foundation tokens, React, Vite, Tailwind CSS, PostCSS, Claude Code CLI, and all required configuration.

---

## Prerequisites

### GitHub Access

The installer clones two reference repositories that require access. Users must be added to the [eds-adopters](https://github.com/orgs/eero-inc/teams/eds-adopters) GitHub team — ask Isaac Park to be added. This grants read access to:

- `eero-inc/web-design-system` — WDS component source + Storybook stories
- `eero-inc/web-eero-insight` — Insight components + page compositions

### CodeArtifact Authentication

The `@amzn` scoped packages are hosted on AWS CodeArtifact. The user must authenticate before installing:

```bash
mwinit -f                     # Authenticate Amazon session
npm run codeartifact:login    # Login to CodeArtifact registry
```

If `codeartifact:login` isn't available in their project, run manually:

```bash
ada credentials update --account=880918510484 --provider=conduit --role=cloud-local-development --once
aws codeartifact login --region us-west-2 --tool npm --domain amazon --domain-owner 149122183214 --repository eero-shared
```

Their `.npmrc` must point to the CodeArtifact registry:

```
registry=https://amazon-149122183214.d.codeartifact.us-west-2.amazonaws.com/npm/eero-shared/
```

If the user gets 401/403 errors, prompt them to re-run `mwinit -f` then `npm run codeartifact:login`.

### Node and npm

Requires Node 24+ and npm 11+. Recommended to install via [Volta](https://volta.sh/):

```bash
volta install node@24.12.0
volta install npm@11.6.2
```

---

## Full Installer (One-Liner)

The installer sets up everything AI tools need: steering files, reference repos, Claude Code CLI, and IDE integration.

Run from the root of any eero project:

```bash
git clone --depth 1 https://github.com/eero-inc/ux-design-systems.git /tmp/eds-steering && bash /tmp/eds-steering/scripts/install-eds-steering.sh && rm -rf /tmp/eds-steering
```

### What it installs

**1. Steering files** → `.kiro/steering/eds/` and `.kiro/steering/insight/`

| File                        | What it does                                                           |
| --------------------------- | ---------------------------------------------------------------------- |
| `eds-development.md`        | Rules for building — components, tokens, styling, Figma, enforcement   |
| `eds-linter.md`             | Flags drift — checks code against EDS components, tokens, and patterns |
| `eds-guidelines.md`         | Offline design reference — full component/pattern/foundation guidance  |
| `eds-installer.md`          | This file — installation and configuration guide                       |
| `insight-components.md`     | Insight component interfaces and usage                                 |
| `insight-patterns.md`       | Insight page compositions and layout patterns                          |
| `insight-coverage-audit.md` | Gap analysis between Insight and WDS                                   |

**2. Reference repo clones** → `.reference/`

| Clone                          | What it provides                                                        |
| ------------------------------ | ----------------------------------------------------------------------- |
| `.reference/web-design-system` | WDS Storybook stories — variant examples showing how to configure props |
| `.reference/web-eero-insight`  | Insight source — components, page compositions, layouts, patterns       |

These are what AI reads to understand _how_ to use components (not just what exists). The npm packages provide the piano keys (props, types, exports). The reference clones provide the sheet music (which prop combinations produce which variants, how components compose into full pages).

**3. Claude Code CLI + IDE integration**

- Installs Claude Code via Builder Toolbox (if available)
- Installs AIM plugins (builder MCP)
- Configures IDE integration (`claude setup-ide`)

**4. CLAUDE.md**

Creates a `CLAUDE.md` in your project root that references the steering files, enabling Claude Code to load EDS context automatically.

### If authentication fails

```bash
mwinit -f
```

Then re-run the installer.

### Manual install

If you prefer not to use the script:

```bash
mkdir -p .kiro/steering/eds .kiro/steering/insight .reference

# Steering files
git clone --depth 1 --filter=blob:none --sparse https://github.com/eero-inc/ux-design-systems.git /tmp/eds-repo
cd /tmp/eds-repo && git sparse-checkout set ".kiro/steering/eds" ".kiro/steering/insight"
cp /tmp/eds-repo/.kiro/steering/eds/* .kiro/steering/eds/
cp /tmp/eds-repo/.kiro/steering/insight/* .kiro/steering/insight/
rm -rf /tmp/eds-repo

# Reference repos (requires eds-adopters team membership)
git clone --depth 1 https://github.com/eero-inc/web-design-system .reference/web-design-system
git clone --depth 1 https://github.com/eero-inc/web-eero-insight .reference/web-eero-insight

# Add to .gitignore
echo ".reference/" >> .gitignore
```

After installing, start a new Kiro or Claude Code chat to pick up the context.

---

## What Gets Installed (npm packages)

### Core EDS packages

| Package                                  | Version | What it is                                                                                                                                                                             |
| ---------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@amzn/eero-web-design-components` (WDS) | 2.18.0  | 40+ production React components — Button, Card, Input, Select, Switch, Tabs, Tag, Icon, Modal, Table, Search, Loader, Tooltip, and more. Built on Ant Design, styled with eero tokens. |
| `@amzn/eero-web-design-foundation`       | 0.5.1   | Design tokens (colors, spacing, typography, radius, elevation), Tailwind CSS preset, Centra No2 font files, CSS variables for theming.                                                 |

### Runtime dependencies

| Package     | Why                                   |
| ----------- | ------------------------------------- |
| `react`     | React 18 — required by WDS components |
| `react-dom` | DOM renderer — peer dependency of WDS |

### Build and styling toolchain

| Package                    | Why                                                                       |
| -------------------------- | ------------------------------------------------------------------------- |
| `vite`                     | Build tool and dev server                                                 |
| `@vitejs/plugin-react-swc` | Fast React compilation via SWC                                            |
| `tailwindcss`              | Utility CSS framework — EDS ships a Tailwind preset with all token scales |
| `postcss`                  | CSS processing — required by Tailwind                                     |

---

## Installation Commands

Run these from the project directory:

```bash
# Core EDS packages + React
npm install @amzn/eero-web-design-components@^2.18.0 @amzn/eero-web-design-foundation@^0.5.1 react@^18.2.0 react-dom@^18.2.0

# Build toolchain
npm install -D vite@^6.4.1 @vitejs/plugin-react-swc@^3.11.0 tailwindcss@^3.4.0 postcss@^8.4.0
```

If the project is a workspace in this monorepo, add it to the root `package.json` `workspaces` array and run `npm install` from the repo root instead.

---

## Required Configuration

After installing packages, these config files must be created or updated:

### Tailwind config — `tailwind.config.cjs`

The EDS foundation ships a Tailwind preset that maps all design tokens to utility classes. The component library content path is required because WDS components use Tailwind classes internally.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require("@amzn/eero-web-design-foundation/tokens/tw-styles/tw-custom-preset.js"),
  ],
  content: [
    "./src/**/*.{js,tsx,ts}",
    "./index.html",
    "./node_modules/@amzn/eero-web-design-components/library/**/*.{js,css}",
  ],
};
```

### PostCSS config — `postcss.config.cjs`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
```

### Vite config — `vite.config.ts`

The React alias prevents WDS from bundling a second React copy, which causes "Invalid hook call" errors:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.dirname(require.resolve("react/package.json")),
      "react-dom": path.dirname(require.resolve("react-dom/package.json")),
    },
  },
});
```

### TypeScript config — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"]
}
```

---

## CSS Setup

### Import order (critical)

In your entry file (e.g. `main.tsx`), imports must follow this exact order. **EDS styles load last and override project styles** — EDS is the source of truth for all visual decisions.

```tsx
// 1. Your project's base CSS (if any) — loads first, gets overridden by EDS
import "./base.css"; // optional — only if you have pre-existing styles

// 2. Your CSS with Tailwind directives
import "./index.css";

// 3. Fonts — loads Centra No2 (eero's typeface)
import "@amzn/eero-web-design-foundation/tokens/fonts/fonts.css";

// 4. Color tokens — the full color ramp values
import "@amzn/eero-web-design-foundation/tokens/tw-styles/color-variables.css";

// 5. Theme variables — semantic color mappings (light mode)
import "@amzn/eero-web-design-foundation/tokens/tw-styles/light-variables.css";

// 6. WDS component styles — loads LAST, EDS overrides everything
import "@amzn/eero-web-design-components/library/styles.css";
```

> **Why EDS loads last:** The WDS styles include a Tailwind reset and eero-specific styling. Loading them last ensures the app looks like eero out of the box. If you need to override EDS for a specific bespoke element, add styles _after_ this import and document why.

#### Existing EDS projects (e.g., docsite)

If your project already uses EDS and you need your own CSS to override specific WDS reset behavior (e.g., font-smoothing), reverse the order — load EDS first, your CSS last:

```tsx
import "@amzn/eero-web-design-foundation/tokens/tw-styles/color-variables.css";
import "@amzn/eero-web-design-foundation/tokens/tw-styles/light-variables.css";
import "@amzn/eero-web-design-foundation/tokens/fonts/fonts.css";
import "@amzn/eero-web-design-components/library/styles.css";
import "./index.css"; // Your overrides load last
```

### CSS file with Tailwind directives and font override

```css
/* index.css */
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

@layer base {
  *,
  *::before,
  *::after {
    font-family: "Centra No2", sans-serif;
  }
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

### Theme support

Set `data-theme` on a parent element:

```html
<body data-theme="light"></body>
```

For dark mode, toggle to `data-theme="dark"` and also import:

```tsx
import "@amzn/eero-web-design-foundation/tokens/tw-styles/dark-variables.css";
```

---

## WDS Component Reference

All WDS components are named exports from `@amzn/eero-web-design-components` (v2.18.0):

```tsx
import {
  // Core components
  AutoComplete,
  Brush,
  Button,
  Card,
  CardCarousel,
  CheckableTag,
  Checkbox,
  ConnectionStatus,
  Container,
  CopyableText,
  DatePicker,
  RangePicker,
  Divider,
  EllipsisText,
  EntityList,
  Icon,
  ICONS,
  Input,
  InputMenu,
  InputMenuDropdown,
  InputNumber,
  InputPassword,
  IntervalSelector,
  Loader,
  Menu,
  MiniExpand,
  MiniTable,
  Modal,
  MultiFieldTableV2,
  useMultiFieldTableV2,
  OverlayPanel,
  PageHeader,
  Pagination,
  Panel,
  PanelMenu,
  Popover,
  ProgressBar,
  Radio,
  Search,
  Segmented,
  Select,
  Sidebar,
  Slider,
  SortableList,
  SortFilterWidget,
  SupportMessages,
  Switch,
  Table,
  TableV2,
  usePaginatedTable,
  Tabs,
  Tag,
  TextArea,
  Tooltip,
  Tour,
  Tree,
  TreeView,
  WifiQRCode,

  // Button variants
  DropdownButton,
  DropdownIconButton,
  CheckableTagDropdown,
  IconButton,
  IconMenu,
  SplitButton,
  TinyIconButton,

  // Layout
  Layout,

  // Providers and hooks
  ToastProvider,
  useToast,
  LayoutContextProvider,
  LayoutContext,
  useLayoutDirection,

  // Accessibility
  AriaLiveRegion,
  useAriaLiveRegion,

  // Constants
  INPUT_MENU_TYPES,
} from "@amzn/eero-web-design-components";
```

### Key component APIs

| Component           | Key props                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`            | `type` ("primary" / "default" / "text" / "link"), `label`, `leftIcon`, `rightIcon`, `loading`, `danger`, `ghost`, `fullWidth`, `size`                        |
| `Card`              | `title`, `size` (1-10), `expandable`, `isCollapsed`, `footer`, `extra`                                                                                       |
| `CardCarousel`      | Horizontal card scrolling container                                                                                                                          |
| `Input`             | `id` (required), `label`, `caption`, `state` ("default" / "error" / "warning"), `layout` ("horizontal" / "vertical")                                         |
| `InputMenu`         | `id` (required), `type` (use `INPUT_MENU_TYPES`), searchable dropdown menus                                                                                  |
| `Select`            | `id` (required), `label`, `options`, `placeholder`, `state`                                                                                                  |
| `AutoComplete`      | Typeahead input with filtered suggestions                                                                                                                    |
| `Switch`            | `format` ("small" / "default" / "large"), `checked`, `onChange`                                                                                              |
| `Tabs`              | `items` (array of `{key, label, children}`), `topIcons`, `tabFillSpace`                                                                                      |
| `Tag`               | `color` ("grey" / "navy" / "periwinkle" / "green" / "orange" / "red" / "turquoise" / "ocean" / "purple"), `status`, `size` ("regular" / "large"), `showIcon` |
| `CheckableTag`      | Selectable tag — acts as a filter chip                                                                                                                       |
| `Icon`              | `icon` (use `ICONS` enum values like `ICONS.FUNCTIONAL_HOME`)                                                                                                |
| `Search`            | `id` (required), `placeholder`                                                                                                                               |
| `Modal`             | Standard Ant Design Modal API                                                                                                                                |
| `OverlayPanel`      | Sliding panel overlay (alternative to Modal for complex content)                                                                                             |
| `TableV2`           | TanStack-based table with sorting, filtering, pagination                                                                                                     |
| `MultiFieldTableV2` | Editable table with inline field editing, validation, add/remove rows                                                                                        |
| `Brush`             | Time-range selection chart (drag to select a range)                                                                                                          |
| `ProgressBar`       | Determinate/indeterminate progress indicator                                                                                                                 |
| `SortableList`      | Drag-to-reorder list                                                                                                                                         |
| `SortFilterWidget`  | Combined sort + filter controls                                                                                                                              |
| `Pagination`        | Page navigation with `PaginationInfo`                                                                                                                        |
| `Layout`            | App shell with `Sidebar` — collapsible navigation layout                                                                                                     |
| `Tree` / `TreeView` | Hierarchical data display with expand/collapse                                                                                                               |

### Where to find variant examples

The npm package has types but **not usage examples**. To see how to configure each component for specific variants:

- **`.reference/web-design-system/components/src/*/stories/`** — Storybook stories showing every prop combination
- **`.reference/web-eero-insight/src/components/`** — Real-world usage in production code
- **`.reference/web-eero-insight/src/app/`** — Full page compositions showing how components assemble

Always check both the typings (for what's possible) and the stories (for how to configure it correctly).

---

## Design Tokens

Tokens are available as CSS variables and through the Tailwind preset:

| Category   | CSS variables                                                                | Example                                               |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| Text       | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-quaternary` | `style={{ color: "var(--text-primary)" }}`            |
| Background | `--background-primary`, `--background-secondary`                             | `style={{ background: "var(--background-primary)" }}` |
| Border     | `--border-primary`                                                           | `style={{ borderColor: "var(--border-primary)" }}`    |

The Tailwind preset from `@amzn/eero-web-design-foundation` maps all spacing, radius, elevation, and typography scales to utility classes.

---

## Verification

After installation and configuration, drop this into any component to verify everything works:

```tsx
import { Button, Tag, Card } from "@amzn/eero-web-design-components";

function EDSCheck() {
  return (
    <Card title="EDS Installed" size={2}>
      <div className="flex items-center gap-3">
        <Button type="primary" label="Working" />
        <Tag color="green" size="regular">
          Ready
        </Tag>
      </div>
    </Card>
  );
}
```

If the button renders with eero styling (periwinkle blue, rounded corners) and Centra No2 font, the installation is complete.

---

## Amazon Builder Tools (ABT) Compatibility

### Peru Projects (Supported)

The EDS installer works with **Peru**-based ABT projects. Peru uses npm under the hood, so `npm install` from the commands above will pull the `@amzn` packages from eero's CodeArtifact registry as expected.

If you hit registry issues in a Peru project, see the [ABT guide for private CodeArtifact repositories](https://docs.hub.amazon.dev/languages/typescript/peru/#using-packages-from-private-codeartifact-repositories) for configuration details.

### Brazil Projects (Not Supported for WDS Packages)

**Brazil cannot install the WDS npm packages** (`@amzn/eero-web-design-components`, `@amzn/eero-web-design-foundation`). Brazil resolves dependencies from its own version sets, not from external CodeArtifact registries, so it will 404 on these packages.

> The constraint is on Brazil's dependency resolution, not on the EDS itself.

**However, the EDS is still valuable in Brazil projects.** The steering files, UX guidelines, patterns, and the EDS Knowledge Base (KB ID: `7EIQUFRWS1`) are all usable regardless of build system. You can work in Brazil with any component library (e.g., Ant Design + Tailwind) and leverage the EDS to get the eero look and feel:

- **Steering files** — Install the steering files for design system guidance, component patterns, and consistency checks.
- **EDS Knowledge Base** — Query the KB for component interfaces, token values, Storybook examples, and UX guidelines.
- **Design tokens as reference** — Even without the npm packages, you can reference the token values from the KB or steering files and apply them manually in your styling approach.

**Example starting prompts for Brazil projects:**

- "Create \<feature\> using the EDS design guidance, variables, tokens and components" — AI will use the steering files to apply eero-themed visuals with whatever component library is available.
- "Show me a list of colors, typography, or components available to me with the EDS" — AI will pull from the steering files and KB.

### Future: WDS Migration to ABT

The WDS team is planning to migrate the Web Design System packages to ABT after the Next.js migration is complete. Once that lands, Brazil projects will be able to consume `@amzn/eero-web-design-components` and `@amzn/eero-web-design-foundation` natively through version sets.

---

## Troubleshooting

| Problem                                             | Cause                                                   | Fix                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 401/403 on `npm install`                            | CodeArtifact token expired                              | Run `mwinit -f` then `npm run codeartifact:login`                                                                 |
| "Invalid hook call"                                 | Duplicate React instances                               | Add React alias in `vite.config.ts` (see config section)                                                          |
| Components render unstyled                          | Wrong CSS import order                                  | Foundation CSS must load before component CSS before Tailwind                                                     |
| Centra No2 font not loading                         | Missing font import                                     | Import `@amzn/eero-web-design-foundation/tokens/fonts/fonts.css` in entry file                                    |
| Tailwind classes not applying to WDS                | Missing content path                                    | Add `./node_modules/@amzn/eero-web-design-components/library/**/*.{js,css}` to `content` in `tailwind.config.cjs` |
| Dark mode not working                               | Missing theme attribute or CSS                          | Set `data-theme="dark"` on parent element and import `dark-variables.css`                                         |
| `Cannot find module '@amzn/...'`                    | Not authenticated or wrong registry                     | Check `.npmrc` points to CodeArtifact, re-run `codeartifact:login`                                                |
| Reference clone fails (404)                         | Not in eds-adopters team                                | Ask Isaac Park to add you to [eds-adopters](https://github.com/orgs/eero-inc/teams/eds-adopters)                  |
| Installer script 404                                | Using old `curl` command                                | Use the `git clone` one-liner (see Full Installer section above)                                                  |
| Figma MCP in `~/.claude/mcp.json` but tools missing | Wrong config file — Claude Code doesn't read `mcp.json` | Use `claude mcp add figma -e FIGMA_API_KEY="TOKEN" -s user -- figma-developer-mcp --stdio` instead                |

---

## EDS Knowledge Base (Optional)

The EDS Bedrock Knowledge Base gives AI tools direct access to component interfaces, token values, Storybook examples, and UX guidelines via semantic search.

**KB ID:** `7EIQUFRWS1`
**Account:** `547868852706`
**Region:** `us-west-2`

### 1. Install `uvx`

```bash
brew install uv
```

### 2. Authenticate

```bash
ada credentials update --account=880918510484 --provider=conduit --role=cloud-local-development --profile=eero-ux-eng --once
```

If you get an AccessDenied error, you don't have the `cloud-local-development` role assigned in Conduit. Reach out to [Will Bertelsen](https://eero.slack.com/archives/D08S9BWKF1Q) to request access.

### 3. Add MCP config

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "bedrock-kb-retrieval": {
      "command": "uvx",
      "args": ["awslabs.bedrock-kb-retrieval-mcp-server@latest"],
      "env": {
        "AWS_REGION": "us-west-2",
        "AWS_PROFILE": "eero-ux-eng"
      },
      "autoApprove": ["QueryKnowledgeBases"]
    }
  }
}
```

### 4. Query tips

The KB uses semantic search. Be specific — vague queries return guidelines, specific queries return exact interfaces and code.

**Component interfaces:** Include component name + prop names.

```
"ButtonProps danger ghost href leftIcon rightIcon size fullWidth"
"TableV2 props for sorting pagination and row expansion"
```

**Token values:** Ask for specific families.

```
"What is the hex value for periwinkle primary button color"
"What spacing tokens are available and what are their pixel values"
```

**Usage examples:** Ask for a specific component with "example" or "story".

```
"Show me a Storybook example for DropdownButton with items"
"TableV2 paginated table example with sorting and filtering"
```

**Pattern discovery:** Describe what you need.

```
"I'm building a form, what EDS components should I use"
"What EDS component should I use for a dropdown button with a menu of items"
```

### What the KB cannot answer

- "List all components" — use pattern discovery queries instead
- Contentful articles — those are in the docsite, not the KB
- Full code diffs — use the linter steering for that

---

## Figma MCP (Optional)

Gives AI tools (Claude Code, Kiro) direct read/write access to Figma files — design directly from your terminal.

### 1. Get a Figma Personal Access Token

Go to [Figma Settings → Personal Access Tokens](https://www.figma.com/settings) and generate a token with read/write scope.

### 2. Install the Figma MCP server globally

The package must be installed from the **public npm registry** — `npx` won't work because your `.npmrc` points to CodeArtifact (which only has `@amzn` packages):

```bash
npm --registry https://registry.npmjs.org install -g figma-developer-mcp
```

### 3. Add to Claude Code

**Important:** Claude Code does NOT read `~/.claude/mcp.json` for MCP servers. You must register servers using the `claude mcp add` command, which writes to `.claude.json` (the project-level config that Claude Code actually loads):

```bash
claude mcp add figma -e FIGMA_API_KEY="YOUR_FIGMA_TOKEN_HERE" -s user -- figma-developer-mcp --stdio
```

Replace `YOUR_FIGMA_TOKEN_HERE` with your personal access token. The `-s user` flag makes it available across all projects.

To verify it was registered:

```bash
claude mcp list
# Should show: figma: figma-developer-mcp --stdio - ✔ Connected
```

### 4. Add to Kiro

Add to `.kiro/settings/mcp.json` (merge with existing config):

```json
{
  "mcpServers": {
    "figma": {
      "command": "figma-developer-mcp",
      "args": ["--stdio"],
      "env": {
        "FIGMA_API_KEY": "YOUR_FIGMA_TOKEN_HERE"
      }
    }
  }
}
```

### 5. Restart your session

Restart Claude Code or Kiro for the MCP server to connect. You'll then be able to:

- Read Figma designs and extract layout/spacing/colors
- Create and edit Figma frames directly from prompts
- Use Figma as the source of truth for implementations

> **Note:** Never commit your token. The `claude mcp add -s user` command stores it in your user-level `.claude.json` which stays local. If adding to `.kiro/settings/mcp.json`, add it to `.gitignore`.

### Troubleshooting

| Problem                                          | Cause                           | Fix                                                                            |
| ------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| `claude mcp list` doesn't show figma             | Server not registered correctly | Re-run `claude mcp add` command above                                          |
| Figma tools not in session                       | MCP loads at session start      | Restart Claude Code after adding                                               |
| `~/.claude/mcp.json` has figma but tools missing | Wrong config file               | Claude Code reads `.claude.json`, not `mcp.json`. Use `claude mcp add` instead |
