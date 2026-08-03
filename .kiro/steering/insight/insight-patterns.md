---
inclusion: manual
description: "Real-world patterns and page scaffolding templates from eero Insight (web-eero-insight). Use this to build new pages that match Insight's conventions."
---

# Insight Production Patterns

Real-world usage patterns extracted from `web-eero-insight` — the ISP admin dashboard built on Next.js + Tailwind + EDS (`@amzn/eero-web-design-components` and `@amzn/eero-web-design-foundation`).

Use the reference sections (1–6) to understand existing patterns. Use section 7 (Page Scaffolding Guide) to create new pages.

---

## 1. Page Shell & Layout Architecture

### App Shell

Insight uses the EDS `Layout` component as its top-level shell. The shell provides:

- Collapsible sidebar navigation
- Fixed header bar
- Content area with scroll

```tsx
// src/components/LayoutWrapper/LayoutWrapper.tsx
import { Layout, Loader } from "@amzn/eero-web-design-components";

<Layout
  title={containerTitle} // Logo element
  ariaLabel="collapse-expand-button"
  onCollapseMenu={toggleExpanded}
  collapsed={!expanded}
  l10n_skipToContentLabel={T("COMMON_SKIP_TO_CONTENT")}
  fixedSidenavElement={fixedContent} // Pinned content above nav items
  sidenav={sidenav} // Sidebar component
  header={<Header showSearch={showSearch} />} // Top header bar
>
  {children}
</Layout>;
```

### Layout Configurator Pattern

Pages don't directly render the shell — they configure it via `LayoutConfigurator`, a context-based component that sets sidebar content, search visibility, and fixed headers per route:

```tsx
// Organization pages (with sidebar)
<LayoutConfigurator sidenav={<Sidenav />} showSearch>
  <div className="system-page-padding">{children}</div>
</LayoutConfigurator>

// Network detail pages (with sidebar + fixed panel header)
<LayoutConfigurator
  sidenav={<NetworkSidenav />}
  showSearch
  fixedHeader={<NetworkPanelMenu />}
>
  {children}
</LayoutConfigurator>

// Pages without sidebar
<LayoutConfigurator showSearch>
  <div className="system-page-padding h-full">{children}</div>
</LayoutConfigurator>
```

### Route Group Layout Strategy

Next.js route groups control which pages get sidebars:

```
app/[locale]/(orgRoutes)/
  ├── (withSidebar)/        → LayoutConfigurator with <Sidenav />
  ├── (withoutSidebar)/     → LayoutConfigurator without sidenav
  └── (withSidebarNoMainContentPadding)/ → Sidebar, no padding
```

### System Page Padding

All content areas use a responsive padding utility:

```css
/* Responsive page gutters */
.system-page-padding-start {
  @apply ps-3 phone:ps-8 desktop:ps-14;
}
.system-page-padding-end {
  @apply pe-3 phone:pe-8 desktop:pe-14;
}
.system-page-padding-top {
  @apply pt-6 phone:pt-8 desktop:pt-12;
}
.system-page-padding-bottom {
  @apply pb-0.5;
}

.system-page-padding {
  @apply system-page-padding-bottom system-page-padding-start
         system-page-padding-top system-page-padding-end;
}
```

Breakpoints: mobile (default) → `phone` → `desktop`

### Content Wrapper

The main content scroll container:

```css
.wrapper-container {
  @apply h-full max-h-full w-full overflow-y-auto text-text-primary;
}
```

---

## 2. Navigation Patterns

### Sidebar Navigation (EDS `Sidebar` component)

Insight uses the EDS `Sidebar` component with hierarchical menu items:

```tsx
import { Sidebar } from "@amzn/eero-web-design-components";

<Sidebar menuItems={menuItems} currentURL={pathname} collapsed={collapsed} />;
```

Menu items are structured as nested objects with permission-based visibility:

```tsx
const menuItems = [
  // Top-level item
  MENU_ORGANIZATION_HOME(T),

  // Group with sub-items
  {
    ...MENU_ORGANIZATION_ANALYTICS(T),
    items: [
      ...(canViewFleetNetworks
        ? [MENU_ITEM_ORGANIZATION_FLEET_NETWORKS(url, T)]
        : []),
      ...(canViewChurn ? [MENU_ITEM_ORGANIZATION_CHURN(url, T)] : []),
      // ... more conditional items
    ],
  },
];
```

Key pattern: Menu items are conditionally included using spread + ternary:

```tsx
...(hasPermission ? [menuItem] : [])
```

### Network-Level Sidebar

Network detail pages use a separate `NetworkSidenav` with a `NetworkPanelMenu` pinned above the nav items via `fixedSidenavElement`.

### Header

The header uses EDS `Icon`, `IconMenu`, and `ICONS`:

```tsx
import { Icon, IconMenu, ICONS } from "@amzn/eero-web-design-components";

// Search icon in header
<IconMenu
  item={{
    icon: <Icon icon={ICONS.FUNCTIONAL_SEARCH} />,
    key: "search",
    items: [],
    label: T("COMMON_SEARCH"),
  }}
  onClick={() => setShowBar(true)}
  placement="bottom"
  title={T("COMMON_SEARCH")}
/>

// Virtual agent icon
<IconMenu
  item={{
    icon: <Icon icon={ICONS.FUNCTIONAL_MESSAGE} />,
    key: "virtual-agent",
    items: [],
    label: T("COMMON_VIRTUAL_AGENT"),
  }}
  onClick={toggleVirtualAgent}
  placement="bottom"
  title={T("COMMON_VIRTUAL_AGENT")}
/>
```

---

## 3. EDS Component Usage in Context

### Most-Used Components (by import frequency)

| Component                    | Usage Count | Context                                  |
| ---------------------------- | ----------- | ---------------------------------------- |
| `Button`                     | 39          | Actions, modals, forms, cards            |
| `Icon` + `ICONS`             | 36          | Status indicators, nav, actions          |
| `Card`                       | 28          | Content sections, settings, data display |
| `Loader`                     | 27          | Loading states throughout                |
| `Modal`                      | 25          | Confirmations, forms, settings           |
| `Tag`                        | 13          | Status labels, categories                |
| `ToastType` + `useToast`     | 14          | Success/error notifications              |
| `Divider`                    | 9           | Section separators                       |
| `useLayoutDirection`         | 9           | RTL support                              |
| `Tooltip`                    | 6           | Help text, data explanations             |
| `SupportMessages`            | 6           | Inline warnings/info                     |
| `Popover` + `TinyIconButton` | 6           | Contextual menus                         |
| `Input`                      | 6           | Form fields                              |

### Card Patterns

**EditableCard** — Card with edit button, wraps EDS `Card`:

```tsx
import { Button, Card } from "@amzn/eero-web-design-components";

<Card
  title={
    <div className="flex flex-row gap-2">
      <div className="font-medium">{title}</div>
      {helpText && <HintText text={title} helpText={helpText} />}
    </div>
  }
  extra={
    <Button label={T("COMMON_EDIT")} onClick={openEditModal} type="link" />
  }
  loading={loading}
  size={6}
>
  {children}
</Card>;
```

**ExpandableCard** — Collapsible card with EDS `Card` + `IconButton`:

```tsx
import { Card, IconButton, ICONS } from "@amzn/eero-web-design-components";

<Card
  title={cardTitle}
  expandable
  isCollapsed={!isExpanded}
  size={size}
  extra={
    <IconButton
      icon={
        isExpanded ? ICONS.FUNCTIONAL_CHEVRONUP : ICONS.FUNCTIONAL_CHEVRONDOWN
      }
      type="text"
      ariaLabel={expandButtonLabel}
      onClick={() => onToggleExpand(!isExpanded)}
    />
  }
>
  {isExpanded && expandedContent}
</Card>;
```

### Table Pattern

Insight wraps the EDS `Table` with localization:

```tsx
import { Table } from "@amzn/eero-web-design-components";

<Table
  locale={{
    filterReset: T("COMMON_RESET"),
    filterConfirm: T("COMMON_OK"),
    emptyText: T("NO_DATA_NO_DATA"),
    filterSearchPlaceholder: T("COMMON_SEARCH_FILTERS"),
    filterCheckAll: T("COMMON_FILTER_ALL"),
  }}
  labels={{
    sort: {
      ascending: T("SORT_ASCENDING"),
      descending: T("SORT_DESCENDING"),
      tooltip: T("SORT_SORT"),
    },
    expand: {
      open: T("EXPAND_EXPAND"),
      close: T("EXPAND_COLLAPSE"),
    },
  }}
/>;
```

### PageHeader Pattern

Wraps EDS `PageHeader` with localized back/forward buttons:

```tsx
import { PageHeader } from "@amzn/eero-web-design-components";

<PageHeader
  backButtonConfig={{
    name: T("COMMON_GO_BACK"),
    title: T("COMMON_GO_BACK"),
    ariaLabel: T("COMMON_GO_BACK"),
  }}
  forwardButtonConfig={{
    name: T("COMMON_GO_FORWARD"),
    title: T("COMMON_GO_FORWARD"),
    ariaLabel: T("COMMON_GO_FORWARD"),
  }}
  {...customProps}
/>;
```

### PageSection Pattern

Custom component for content sections with optional action menus:

```tsx
<PageSection
  title="Section Title"
  actionItems={[...]}
  bordered={false}
  className="eo-mobile-container"
>
  {/* Section content */}
</PageSection>
```

Structure: header with title + action menu, separated by a bottom border, then children.

```tsx
<header className="mb-6 flex items-center justify-between border-b border-solid
  border-border-background-page pb-4 pt-6">
  <div className="text-base">{title}</div>
  <PageSectionActionMenu actionItems={actionItems} />
</header>
<div>{children}</div>
```

---

## 4. Common Page Templates

### Home Page (Role-Based)

The home page renders different views based on user role:

```tsx
// Role → Component mapping
const HOME_VIEW_COMPONENTS = {
  RETAIL: RetailHome,
  PRO: DefaultHome,
  BUSINESS_OWNER: DefaultHome,
  ISP: IspHome,
  DEFAULT: DefaultHome,
};
```

**DefaultHome** — Two-column layout with search tips + action widgets:

```tsx
<div className="flex h-full w-full flex-col md:flex-row">
  {/* Left: Search tips */}
  <div className="flex w-full justify-center p-4 md:w-1/2">
    <HomeSearchTips header={T("SEARCH_HEY_THERE")} />
  </div>
  {/* Right: Action widgets */}
  <div className="flex w-full flex-col items-center gap-6 p-4 md:w-1/2 desktop:items-end">
    <CrateNetworkWidget />
    <ViewCommunitiesWidget />
  </div>
</div>
```

**IspHome** — Wraps DefaultHome with sidebar navigation:

```tsx
<LayoutConfigurator showSearch sidenav={<Sidenav />}>
  <div className="system-page-padding h-full">
    <DefaultHome />
  </div>
</LayoutConfigurator>
```

### Fleet Summary Dashboard

Structure: `PageHeader` → display name → flex column of data sections.

```tsx
<div className="w-full pb-12">
  {/* Page header with action button */}
  <PageHeader
    title={T("ORGANIZATION_FLEET_SUMMARY")}
    actions={
      <Can I={Actions.CREATE} on={Subjects.API.EEROS}>
        <Button
          leftIcon={ICONS.FUNCTIONAL_ADD}
          label={T("ORGANIZATION_FLEET_SUMMARY_CREATE_NEW_NETWORK")}
          onClick={() => push(ROUTES.RNM_CREATE_NETWORK)}
        />
      </Can>
    }
  />

  <OrganizationDisplayName />

  {/* Data sections — flex column with gap */}
  <div className="mt-4 flex w-full flex-col items-start justify-start gap-8 largeDesktop:flex-row">
    <ActivationsSection />
  </div>
  {canViewNetworkOutages && <OutagesSection />}
</div>
```

**OutagesSection** — Card with map + summary data, uses GraphQL polling:

```tsx
<Card
  className="outages-map-content mt-4 w-full"
  size={4}
  title={<OutagesSectionTitle />}
  extra={<Button label={T("COMMON_VIEW_DETAILS")} type="link" />}
>
  <OutagesMap />
  <OutagesSummary />
</Card>
```

Pattern: `Card` wraps each dashboard section. `size={4}` for full-width cards. Title includes filter controls, `extra` has action links.

### Network Detail Page

Uses Next.js parallel routes for composable sections:

```tsx
// layout.tsx — parallel routes: children + @information + @eeros
type NetworkDetailsLayoutProps = {
  children: React.ReactNode;
  information: React.ReactNode; // @information slot
  eeros: React.ReactNode; // @eeros slot
};

<AccessibilityProvider>
  <NetworkDetailsModalProvider>
    <AlertPanel>
      <div className="system-page-padding h-full w-full">
        {children} {/* Overview header */}
        <AlertContainer />
        {information} {/* Network info cards */}
        <div className="section-marker" id="eeros" />
        {eeros} {/* Eeros list */}
      </div>
    </AlertPanel>
  </NetworkDetailsModalProvider>
</AccessibilityProvider>;
```

**NetworkDetailsHeader** — Uses `PageHeaderWithLocale` with actions and tags:

```tsx
<PageHeaderWithLocale
  actions={[
    <NetworkSnapshot key="snapshot" networkId={networkId} />,
    <NetworkMoreDropdown key="actions" networkName={displayName} />,
  ]}
  tags={pageHeaderTags}
  title={displayName ?? T("NETWORK_DETAILS_NETWORK_NAME_NONE")}
/>
```

Pattern: `PageHeader` with `actions` array (snapshot button + dropdown menu) and `tags` for status labels (network type, customer type).

### Settings Page

Structure: `PageHeader` → scrollable list of `EditableCard` and `PageSection` components.

```tsx
<div className="h-fit w-full pb-6">
  <PageHeaderWithLocale
    title={T("COMMON_SETTINGS")}
    actions={<DropdownButton items={actionItems} />}
  />
  <OrganizationDisplayName />

  {/* Settings sections — each is an EditableCard or PageSection */}
  <MainSettings organization={organization} />
  <OrgLanguageSettings />
  <OrgSpeedTestSettings />
  <OrgLatencySettings />
  <OrgCustomerAccountSettings />
  <OrgAccountStackingLimit orgSettings={orgSettings} />
  {shouldShowRadiusFeature && <RadiusCard />}
  <OrgAllowedIPSettings />
  <OrgCobrandedImageUploadForm imageAssets={imageAssets} />
  {/* ... more setting cards */}
</div>
```

Each settings card follows the `EditableCard` pattern:

- `Card` with title + "Edit" link button
- Click edit → opens `Modal` with form
- Save → mutation → `useToast` for success/error feedback

**Complex settings card example** (Account Stacking Limit):

```tsx
import {
  Button,
  Card,
  IconButton,
  ICONS,
  InputNumber,
  TinyIconButton,
  ToastType,
  useToast,
} from "@amzn/eero-web-design-components";

// Card with expandable content + table + modals
<Card title={<Header />} extra={editButton}>
  <Form form={form}>
    <Radio.Group>
      <Radio value={5}>{T("FIVE_NETWORKS_PER_ACCOUNT")}</Radio>
      <Radio value="custom">{T("COMMON_CUSTOM")}</Radio>
    </Radio.Group>
    {isCustom && <InputNumber min={1} max={100} />}
  </Form>
  <TableWithLocale columns={columns} dataSource={overrides} />
</Card>;
```

### List/Table Page Pattern

Used for fleet networks, users, communities, etc.:

```tsx
<div className="w-full pb-12">
  {/* Header with breadcrumbs + actions */}
  <PageHeaderWithLocale
    title={T("PAGE_TITLE")}
    actions={<Button label={T("ADD_NEW")} leftIcon={ICONS.FUNCTIONAL_ADD} />}
  />

  {/* Filters row */}
  <div className="flex items-center gap-4 mb-4">
    <PeriodSelector />
    <NetworkTypeFilter />
    <SearchInput />
  </div>

  {/* Data table */}
  <TableWithLocale
    columns={columns}
    dataSource={data}
    loading={loading}
    locale={tableLocale}
    labels={tableLabels}
  />
</div>
```

Variants:

- `TableWithBulkActions` — adds checkbox selection + bulk action bar
- `TableWithVirtualList` — virtualized rows for large datasets
- `SimplePagination` — custom pagination below table

---

## 5. Token & Styling Patterns

### Tailwind Token Classes Used

Insight uses EDS foundation tokens via Tailwind classes:

**Text colors:**

- `text-text-primary` — Default body text
- `text-text-on-color` — Text on dark backgrounds (header)
- `text-text-disabled` — Disabled state text

**Backgrounds:**

- `bg-background-midnight` — Dark header/nav background
- `bg-white` — Content areas

**Borders:**

- `border-border-background-page` — Section dividers

**Spacing (Tailwind utilities):**

- `gap-2` (8px) — Standard element spacing
- `mb-4` — Card bottom margin
- `mb-6 pb-4 pt-6` — Section header spacing
- `ps-3 phone:ps-8 desktop:ps-14` — Responsive page padding

### Custom Theme Colors

Insight extends tokens with chart-specific and status colors in `theme.ts`:

```tsx
// Status colors
successColor: "rgb(84,222,180)"; // Green
dataNegative: "rgb(236,112,112)"; // Red
dataNeutral: "rgb(253,190,85)"; // Orange/warning
dataPositive: "rgb(101,216,181)"; // Green

// Chart palette
chartBlue: "rgb(30,71,166)";
chartBlueGreenMedium: "rgb(22,176,197)";
chartOrangeDark: "rgb(236,152,57)";
chartPurple: "rgb(97,52,87)";
// ... 30+ chart colors
```

### Tailwind Config Extensions

```tsx
// tailwind.config.ts
extend: {
  height: {
    header: "64px",
    content: "calc(100vh - 64px)",
  },
  gridTemplateColumns: {
    auto: "repeat(auto-fit, minmax(0, 1fr))",
    "eero-card": "14rem 8rem 11rem 1.2fr 1fr 0.5fr 1.2fr",
    "network-outages": "35% 1fr",
  },
}
```

### RTL Support

Components use `useLayoutDirection` from EDS and logical properties (`ps-*`, `pe-*` instead of `pl-*`, `pr-*`):

```tsx
import { useLayoutDirection } from "@amzn/eero-web-design-components";
```

### Responsive Breakpoints

Insight uses custom breakpoints: `phoneMax`, `phone`, `desktop` — mapped in Tailwind config. Page padding scales across these breakpoints.

---

## 6. Key Architectural Patterns

### Context-Based Layout Configuration

Instead of prop-drilling layout config, Insight uses React context:

1. `LayoutProvider` wraps the app
2. `LayoutConfigurator` sets config per route group
3. `LayoutWrapper` reads config and renders the EDS `Layout` shell

### Permission-Based UI

Every nav item and feature is gated by ability checks:

```tsx
const canViewAnalytics = !isAgent && hasEeroInsight;
...(canViewAnalytics ? [analyticsMenuItem] : [])
```

### Localization Wrapper Pattern

EDS components are wrapped with localized labels:

- `TableWithLocale` wraps `Table`
- `PageHeaderWithLocale` wraps `PageHeader`
- All user-facing strings use `useTranslations()` from `next-intl`

### Error Boundaries

Pages wrap content in `SentryPageWrapper` for error tracking:

```tsx
<SentryPageWrapper config={{ program: EeroPrograms.ESP }}>
  <PageContent />
</SentryPageWrapper>
```

---

## 7. Page Scaffolding Guide

Use these starter templates when building new pages. Pick the template that matches your page type, copy it, and customize.

### Decision Tree: Which Template?

| You're building...                           | Use template                    |
| -------------------------------------------- | ------------------------------- |
| A page with sidebar navigation               | **Dashboard** or **List/Table** |
| A page without sidebar                       | **Full-Width**                  |
| A page showing summary cards + charts        | **Dashboard**                   |
| A page with a data table as the main content | **List/Table**                  |
| A page with editable configuration cards     | **Settings**                    |
| A page showing a single entity's details     | **Detail**                      |

---

### Template A: Dashboard Page (with sidebar)

For: Fleet summary, analytics, outage overview — pages with cards, charts, and summary data.

**File structure:**

```
app/[locale]/(orgRoutes)/(withSidebar)/organization/my-dashboard/
  ├── page.tsx          # Server component, metadata + permissions
  └── _components/
      ├── MyDashboard.tsx    # Client component with data fetching
      └── SummaryCard.tsx    # Individual card sections
```

**page.tsx** (server component):

```tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { READ } from "@/contexts/authorization/actions/operations";
import { ORGANIZATION__SELF } from "@/contexts/authorization/subjects/api";
import routePermissionsCheck from "@/utils/authorization/routePermissionsCheck";
import { SentryPageWrapper } from "@/core/errors/wrappers/SentryPageWrapper";
import { EeroPrograms } from "@/core/errors/utils/constants/constants";
import MyDashboard from "./_components/MyDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const T = await getTranslations();
  return { title: T("MY_DASHBOARD_TITLE") };
}

export default async function MyDashboardPage() {
  await routePermissionsCheck({
    permissions: [{ operation: READ, scope: ORGANIZATION__SELF }],
  });

  return (
    <SentryPageWrapper config={{ program: EeroPrograms.ESP }}>
      <MyDashboard />
    </SentryPageWrapper>
  );
}
```

**MyDashboard.tsx** (client component):

```tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  ICONS,
  PageHeader,
} from "@amzn/eero-web-design-components";
import Can from "@/contexts/authorization/Can";
import Actions from "@/contexts/authorization/actions/operations";
import Subjects from "@/contexts/authorization/subjects";
import OrganizationDisplayName from "@/orgComponents/OrganizationDisplayName";

export default function MyDashboard() {
  const T = useTranslations();

  return (
    <div className="w-full pb-12">
      {/* Page header with optional action button */}
      <PageHeader
        title={T("MY_DASHBOARD_TITLE")}
        actions={
          <Can I={Actions.CREATE} on={Subjects.API.EEROS}>
            <Button
              leftIcon={ICONS.FUNCTIONAL_ADD}
              label={T("MY_DASHBOARD_ADD_ACTION")}
              onClick={() => {
                /* navigate or open modal */
              }}
            />
          </Can>
        }
      />

      <OrganizationDisplayName />

      {/* Summary cards — flex column, responsive row on large screens */}
      <div className="mt-4 flex w-full flex-col items-start justify-start gap-8 largeDesktop:flex-row">
        {/* Card section 1 */}
        <Card className="w-full" size={4} title={<span>{T("SECTION_1")}</span>}>
          {/* Chart or summary content */}
        </Card>

        {/* Card section 2 */}
        <Card className="w-full" size={4} title={<span>{T("SECTION_2")}</span>}>
          {/* Chart or summary content */}
        </Card>
      </div>

      {/* Full-width section below */}
      <Card
        className="mt-4 w-full"
        size={4}
        title={<span>{T("SECTION_3")}</span>}
      >
        {/* Table, map, or detailed content */}
      </Card>
    </div>
  );
}
```

**Key conventions:**

- `pb-12` on outer wrapper for bottom spacing
- `mt-4` between PageHeader and first content section
- `gap-8` between card sections
- `Card size={4}` for full-width cards
- `Card className="w-full"` to fill container
- Permission-gate actions with `<Can>`

---

### Template B: List/Table Page (with sidebar)

For: Fleet networks, users, communities, tags — pages where a data table is the primary content.

**MyListPage.tsx:**

```tsx
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@apollo/client";
import {
  Button,
  ICONS,
  PageHeader,
  Loader,
} from "@amzn/eero-web-design-components";
import TableWithLocale from "@/components/TableWithLocale/TableWithLocale";
import PageSection from "@/components/PageSection/PageSection";

export default function MyListPage() {
  const T = useTranslations();
  const [filters, setFilters] = useState({});

  const { data, loading } = useQuery(MY_QUERY, { variables: filters });

  const columns = [
    {
      title: T("COLUMN_NAME"),
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: T("COLUMN_STATUS"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag>{status}</Tag>,
    },
    {
      title: T("COLUMN_ACTIONS"),
      key: "actions",
      render: (_: unknown, record: DataType) => (
        <Button
          type="link"
          label={T("COMMON_VIEW")}
          onClick={() => navigate(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="w-full pb-12">
      <PageHeader
        title={T("MY_LIST_TITLE")}
        actions={
          <Button
            leftIcon={ICONS.FUNCTIONAL_ADD}
            label={T("ADD_NEW")}
            onClick={openCreateModal}
          />
        }
      />

      {/* Filters row */}
      <div className="mt-4 flex items-center gap-4">
        <PeriodSelector value={filters.period} onChange={handlePeriodChange} />
        <NetworkTypeFilter value={filters.type} onChange={handleTypeChange} />
      </div>

      {/* Data table */}
      <div className="mt-4">
        {loading ? (
          <Loader loadingMsg={T("COMMON_LOADING")} type="horizontal" />
        ) : (
          <TableWithLocale
            columns={columns}
            dataSource={data?.items ?? []}
            rowKey="id"
          />
        )}
      </div>
    </div>
  );
}
```

**Key conventions:**

- Filters row: `flex items-center gap-4` above the table
- `mt-4` spacing between sections
- `TableWithLocale` wraps EDS `Table` with i18n labels
- Column `render` functions for custom cells (Tags, Buttons, Icons)
- Loading state uses `Loader` component

---

### Template C: Settings Page (with sidebar)

For: Organization settings, network settings — pages with multiple editable configuration cards.

**MySettingsPage.tsx:**

```tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@amzn/eero-web-design-components";
import EditableCard from "@/components/EditableCard/EditableCard";
import PageSection from "@/components/PageSection/PageSection";

export default function MySettingsPage() {
  const T = useTranslations();

  return (
    <div className="h-fit w-full pb-6">
      <PageHeader title={T("COMMON_SETTINGS")} />

      {/* Each setting is an EditableCard */}
      <EditableCard
        title={T("SETTING_GENERAL")}
        openEditModal={() => setModal("general")}
      >
        <div className="flex flex-col gap-2">
          <SimpleData label={T("SETTING_NAME")} value={settings.name} />
          <SimpleData label={T("SETTING_EMAIL")} value={settings.email} />
        </div>
      </EditableCard>

      <EditableCard
        title={T("SETTING_PREFERENCES")}
        openEditModal={() => setModal("preferences")}
        helpText={T("SETTING_PREFERENCES_HELP")}
      >
        <div className="flex flex-col gap-2">
          <SimpleData label={T("SETTING_LANGUAGE")} value={settings.language} />
          <SimpleData label={T("SETTING_TIMEZONE")} value={settings.timezone} />
        </div>
      </EditableCard>

      {/* Section with action menu instead of edit button */}
      <PageSection
        title={T("SETTING_ADVANCED")}
        actionItems={[
          { label: T("COMMON_EDIT"), onClick: () => setModal("advanced") },
          { label: T("COMMON_RESET"), onClick: handleReset, danger: true },
        ]}
        showActionMenu
      >
        {/* Advanced settings content */}
      </PageSection>

      {/* Edit modals */}
      <GeneralSettingsModal
        visible={modal === "general"}
        onClose={() => setModal(null)}
        onSave={handleSave}
      />
    </div>
  );
}
```

**Edit modal pattern:**

```tsx
import {
  Modal,
  Input,
  ToastType,
  useToast,
} from "@amzn/eero-web-design-components";

function EditModal({ visible, onClose, onSave }) {
  const T = useTranslations();
  const { openToast } = useToast();

  const handleSave = async () => {
    try {
      await onSave(formData);
      openToast({ type: ToastType.success, description: T("COMMON_SAVED") });
      onClose();
    } catch {
      openToast({ type: ToastType.error, description: T("COMMON_ERROR") });
    }
  };

  return (
    <Modal
      title={T("EDIT_TITLE")}
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
    >
      <Input label={T("FIELD_NAME")} value={value} onChange={setValue} />
    </Modal>
  );
}
```

**Key conventions:**

- `h-fit w-full pb-6` on outer wrapper
- `EditableCard` for each setting group (title + edit link + display content)
- `PageSection` for sections needing action menus
- `SimpleData` for label/value pairs inside cards
- Modal for editing, Toast for feedback
- `flex flex-col gap-2` for stacking label/value rows

---

### Template D: Detail Page (with sidebar + fixed header)

For: Network detail, eero detail — pages showing a single entity with multiple sections.

**Layout setup:**

```tsx
// layout.tsx
import LayoutConfigurator from "@/contexts/layout/LayoutConfigurator";
import { EntitySidenav } from "./components/EntitySidenav";
import { EntityPanelMenu } from "./components/EntityPanelMenu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutConfigurator
      sidenav={<EntitySidenav />}
      showSearch
      fixedHeader={<EntityPanelMenu />} // Pinned above sidebar nav
    >
      {children}
    </LayoutConfigurator>
  );
}
```

**page.tsx** (server component fetches entity data):

```tsx
import { graphql } from "@/types/api";
import { queryServer } from "@/utils/apollo/serverFunctions";
import EntityHeader from "./components/EntityHeader";

const ENTITY_QUERY = graphql(`
  query GetEntity($id: String!) {
    entity(id: $id) {
      name
      status
      type
      organization {
        name
      }
    }
  }
`);

export default async function EntityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await queryServer({
    query: ENTITY_QUERY,
    variables: { id: params.id },
  });

  const entity = result?.data?.entity;

  return (
    <div className="system-page-padding h-full w-full">
      <EntityHeader name={entity?.name} status={entity?.status} />

      {/* Sections with hash anchors for sidebar navigation */}
      <div className="section-marker" id="overview" />
      <OverviewSection entity={entity} />

      <div className="section-marker" id="details" />
      <DetailsSection entity={entity} />

      <div className="section-marker" id="history" />
      <HistorySection entityId={params.id} />
    </div>
  );
}
```

**EntityHeader:**

```tsx
import PageHeaderWithLocale from "@/components/PageHeaderWithLocale/PageHeaderWithLocale";
import { Tag } from "@amzn/eero-web-design-components";

<PageHeaderWithLocale
  title={name ?? T("UNNAMED_ENTITY")}
  tags={[<Tag key="type">{entityType}</Tag>]}
  actions={[
    <SnapshotButton key="snapshot" />,
    <ActionsDropdown key="actions" />,
  ]}
/>;
```

**Key conventions:**

- `LayoutConfigurator` with `fixedHeader` for entity-level controls pinned above sidebar
- Server component fetches data, passes to client components
- `section-marker` divs with `id` for hash-based sidebar navigation
- `PageHeaderWithLocale` with `tags` array for status/type labels and `actions` array for buttons
- `system-page-padding h-full w-full` on content wrapper

---

### Template E: Full-Width Page (no sidebar)

For: Search results, onboarding, standalone views.

**Layout:**

```tsx
// Uses (withoutSidebar) route group
<LayoutConfigurator showSearch>
  <div className="system-page-padding h-full">{children}</div>
</LayoutConfigurator>
```

**Page:**

```tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@amzn/eero-web-design-components";

export default function MyFullWidthPage() {
  const T = useTranslations();

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader title={T("PAGE_TITLE")} />

      <div className="mt-4 flex flex-col gap-6">{/* Content sections */}</div>
    </div>
  );
}
```

---

### Checklist: New Page Setup

When adding any new page to Insight:

- [ ] Choose route group: `(withSidebar)`, `(withoutSidebar)`, or `(withSidebarNoMainContentPadding)`
- [ ] Create `page.tsx` as server component with `generateMetadata` and `routePermissionsCheck`
- [ ] Wrap page content in `SentryPageWrapper`
- [ ] Add sidebar menu item in `Sidenav.tsx` (with permission gate)
- [ ] Use `PageHeader` or `PageHeaderWithLocale` for page title + actions
- [ ] Use `system-page-padding` for content spacing (or inherit from layout)
- [ ] Use EDS components: `Card`, `Table`, `Button`, `Modal`, `Loader`, `Tag`, `Icon`
- [ ] Wrap tables in `TableWithLocale` for i18n
- [ ] Gate features with `<Can>` and ability checks
- [ ] Use `useToast` for success/error feedback
- [ ] Add translations to locale files
- [ ] Use `useTranslations()` — never hardcode user-facing strings
