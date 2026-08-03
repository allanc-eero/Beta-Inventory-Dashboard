---
inclusion: manual
description: "Comprehensive reference of all Insight custom components not in EDS. Use when building features that need to match Insight's look and feel."
---

# Insight Component Reference

Complete inventory of custom components in `web-eero-insight/src/components/`. These are patterns used in eero Insight that are **not yet componentized in EDS** (`@amzn/eero-web-design-components`). Use this as a bridge reference when building features that need to match Insight's look and feel.

> **Legend**
>
> - 🟢 **EDS candidate** — generic enough to componentize in the design system
> - 🔵 **Domain-specific** — tightly coupled to Insight business logic
> - ⚪ **Wrapper/Locale** — thin wrapper adding i18n or defaults to an existing EDS component

---

## Layout & Navigation

### LayoutWrapper ⚪

**What it does:** Top-level app shell that wraps the entire Insight UI with sidebar navigation, header, and content area.

**Props:**

```ts
PropsWithChildren; // children only
```

**EDS components used:** `Layout`, `Loader`

**Key Tailwind classes:** `flex h-screen w-screen flex-col bg-white`, `flex h-full w-full flex-row`, `flex h-full items-center justify-center`

**Code structure:**

```tsx
<Layout
  title={containerTitle} // EeroInsightLogo link
  onCollapseMenu={toggleExpanded}
  collapsed={!expanded}
  fixedSidenavElement={fixedContent}
  sidenav={sidenav}
  header={<Header />}
>
  <div className="flex h-full w-full flex-row">
    <div className="wrapper-container">{children}</div>
    <FeedbackButton />
    <ChatbotSidebar />
  </div>
</Layout>
```

**Usage context:** Root layout component — wraps every authenticated page. Special-cases the Virtual Agent route with a minimal layout.

---

### Header 🟢

**What it does:** Top navigation bar with search, virtual agent toggle, help dropdown, tenant switcher, user dropdown, and modal triggers.

**Props:**

```ts
interface HeaderProps {
  showSearch?: boolean;
}
```

**EDS components used:** `Icon`, `IconMenu`, `ICONS`

**Key Tailwind classes:** `flex h-full w-full items-center text-text-on-color`, `justify-between`, `justify-end`, `flex flex-row gap-2`

**Code structure:**

```tsx
<header className="flex h-full w-full items-center text-text-on-color">
  {shouldShowSearchBar && <HeaderSearch />}
  {shouldShowSearchAutocomplete && <HeaderSearch />}
  <div className="flex flex-row gap-2">
    {/* Search icon, Virtual Agent, Help, TenantSwitcher, UserDropdown */}
  </div>
  <LanguageSelector />
  <TimezoneSelector />
  <DataAggregationPreference />
  <MigrationProgressModal />
</header>
```

**Usage context:** Rendered inside LayoutWrapper's `header` prop. Contains all top-bar actions.

---

### PageSection 🟢

**What it does:** Reusable page section with optional title, action menu, and bordered variant.

**Props:**

```ts
interface PageSectionProps extends PropsWithChildren {
  title?: string | ReactNode;
  keyName?: string;
  actionItems?: ActionItem[];
  showActionMenu?: boolean;
  className?: string;
  childrenClassName?: string;
  testid?: string;
  bordered?: boolean;
  removeHeaderMargin?: boolean;
  setFocusPointRefModal?: Dispatch<SetStateAction<FocusPointRef>>;
}

interface ActionItem {
  id: string;
  title: string;
  action: () => void;
  customStyle?: {};
  disabled?: boolean;
  testId: string;
}
```

**EDS components used:** None (pure custom)

**Key Tailwind classes:** `eo-mobile-container`, `mb-6 flex items-center justify-between border-b border-solid border-border-background-page pb-4 pt-6`, `w-full rounded border p-6 desktop:border-0 desktop:p-0`

**Code structure:**

```tsx
<div className="eo-mobile-container">
  <header className="mb-6 flex items-center justify-between border-b ...">
    <div className="text-base">{title}</div>
    <PageSectionActionMenu actionItems={actionItems} />
  </header>
  <div>{children}</div>
</div>
```

**Usage context:** Used across network detail pages, organization pages, and settings pages to create titled sections with optional action buttons.

---

### PageHeaderWithLocale ⚪

**What it does:** Thin wrapper around EDS `PageHeader` that injects localized back/forward button labels.

**Props:**

```ts
PageHeaderProps; // from @amzn/eero-web-design-components
```

**EDS components used:** `PageHeader`

**Code structure:**

```tsx
<PageHeader
  backButtonConfig={{ name: T("COMMON_GO_BACK"), ...backButtonConfig }}
  forwardButtonConfig={{ name: T("COMMON_GO_FORWARD"), ...forwardButtonConfig }}
  {...customProps}
/>
```

**Usage context:** Used on all detail pages that need breadcrumb-style navigation.

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### EeroInsightContainer 🟢

**What it does:** Page-level footer container with data disclaimer and copyright.

**Props:**

```ts
type Props = {
  children: ReactNode;
  alternativeTextKey?: string;
  wrapperClassName?: string;
};
```

**EDS components used:** None

**Key Tailwind classes:** `flex flex-col justify-between gap-2 pb-12 pe-5 ps-0 pt-0 sm:flex-row`, `min-h-fit text-[0.875rem] font-light text-text-secondary`

**Usage context:** Wraps page content to add the standard Insight footer with disclaimer text.

**Code structure:**

```tsx
return (
    <div className={clsx(props?.wrapperClassName)}>
      {props.children}
      <hr className="mb-4" />
      <footer className="flex flex-col justify-between gap-2 pb-12 pe-5 ps-0 pt-0 sm:flex-row">
        <p className="eo-text-gray-m">
          {props?.alternativeTextKey
            ? T(props?.alternativeTextKey as IntlKeys)
            : T("EERO_INSIGHT_DATA_DISCLAIMER")}
        </p>

        <small className="min-h-fit text-[0.875rem] font-light text-text-secondary">
          &copy; {dayjs.tz().year()} eero LLC, San Francisco, CA
        </small>
      </footer>
    </div>
  );
}

```

---

### SettingsSectionTitle 🟢

**What it does:** Section header for settings pages with optional popover and action buttons.

**Props:**

```ts
interface SettingsSectionTitleProps {
  title: string;
  keyIdentifier: string;
  popover?: ReactNode;
  buttons?: ReactNode[];
}
```

**EDS components used:** None

**Key Tailwind classes:** `flex h-10 items-center justify-between`, `ms-0.5 text-base font-medium leading-6`

**Usage context:** Used in network settings, organization settings pages.

**Code structure:**

```tsx
return (
    <div className="flex h-10 items-center justify-between" key={keyIdentifier}>
      <div className="flex items-center">
        <div className="ms-0.5 text-base font-medium leading-6">{title}</div>
        {!!popover && <div>{popover}</div>}
      </div>
      {!!buttons && <div>{buttons}</div>}
    </div>
  );
}

```

---

### InternalLoader 🔵

**What it does:** Dynamically loads internal micro-frontend assets (JS/CSS) via GraphQL query and injects them into the DOM.

**Props:**

```ts
interface InternalLoaderProps {
  assetName: string;
  selector?: string;
}
```

**EDS components used:** `Loader`

**Usage context:** Used to load legacy internal tools within the Next.js shell. Handles route permissions and asset manifest parsing.

**Code structure:**

```tsx
return () => {
      assetEntries.forEach((entry) => entry.removeFromDOM());
    };
  }, [assetEntries]);

  useEffect(() => {
    runInDevMode(() => {
      // @ts-expect-error - Debug helper
      window[`debug_internal_manifest_${assetName}`] = routeManifest;
      // @ts-expect-error - Debug helper
      window[`debug_internal_sourceMap_${assetName}`] = sourceMap;
      // @ts-expect-error - Debug helper
      window[`debug_internal_assetEntries_${assetName}`] = assetEntries;
    });
  }, [assetName, routeManifest, sourceMap, assetEntries]);

  if (loading) {
    return <Loader loadingMsg={T("COMMON_LOADING")} />;
  }

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### EeroInsightLogo 🔵

**What it does:** SVG logo component for the eero Insight branding in the sidebar.

**Props:** None

**EDS components used:** None

**Usage context:** Rendered in LayoutWrapper's sidebar title.

**Code structure:**

```tsx
return (
    <svg
      width="126"
      height="24"
      viewBox="0 0 126 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.97 5.32172C5.1 5.32172 4.29 5.48867 3.57 5.82259C2.85 6.14606 2.21 6.61563 1.68 7.19998C1.15 7.77389 0.73 8.47302 0.44 9.25563C0.15 10.0487 0 10.9148 0 11.8539C0 12.8243 0.14 13.7217 0.43 14.5148C0.71 15.3078 1.13 16.0069 1.66 16.5913C2.19 17.1756 2.83 17.6348 3.57 17.9478C4.31 18.2713 5.14 18.4382 6.05 18.4382C7.11 18.4382 8.1 18.2295 8.99 17.8122C9.86 17.4052 10.6 16.7269 11.2 15.7982L10.13 14.8591C9.73 15.5269 9.15 16.0695 8.42 16.4556C7.67 16.8522 6.88 17.0608 6.08 17.0608C5.15 17.0608 4.39 16.873 3.8 16.5078C3.21 16.1426 2.74 15.7043 2.39 15.193C2.04 14.6817 1.8 14.1495 1.67 13.6174C1.54 13.0852 1.47 12.6365 1.47 12.2817V12.2295H11.58V11.1339C11.58 10.4139 11.46 9.70433 11.22 9.00519C10.98 8.30606 10.62 7.67998 10.15 7.12693C9.67 6.59476 9.08 6.14606 8.39 5.82259C7.69 5.48867 6.88 5.32172 5.97 5.32172ZM10.11 10.873H1.47V10.8208C1.47 10.6539 1.54 10.3513 1.68 9.89215C1.82 9.44346 2.06 8.97389 2.39 8.50432C2.72 8.03476 3.18 7.60693 3.74 7.24172C4.31 6.8765 5.03 6.68867 5.89 6.68867C6.47 6.68867 7.02 6.80346 7.54 7.02259C8.05 7.24172 8.51 7.54433 8.88 7.91998C9.26 8.29563 9.56 8.73389 9.78 9.22433C10 9.71476 10.11 10.2574 10.11 10.8208V10.873Z"
        fill="white"
      />
      <path
        d="M19.31 5.32172C18.44 5.32172 17.63 5.48867 16.91 5.82259C16.19 6.1565 15.55 6.61563 15.02 7.19998C14.49 7.78433 14.07 8.47302 13.78 9.26606C13.49 10.0487 13.34 10.9252 13.34 11.8539C13.34 12.8243 13.48 13.7217 13.77 14.5148C14.05 15.3078 14.47 16.0069 15 16.5913C15.53 17.1756 16.17 17.6348 16.91 17.9478C17.65 18.2713 18.48 18.4382 19.39 18.4382C20.45 18.4382 21.44 18.2295 22.33 17.8122C23.2 17.4052 23.94 16.7269 24.54 15.7982L23.47 14.8591C23.07 15.5269 22.49 16.0695 21.76 16.4556C21.01 16.8522 20.22 17.0608 19.42 17.0608C18.49 17.0608 17.73 16.873 17.14 16.5078C16.55 16.1426 16.08 15.7043 15.73 15.193C15.38 14.6817 15.14 14.1495 15.01 13.6174C14.88 13.0852 14.81 12.6365 14.81 12.2817V12.2295H24.92V11.1339C24.92 10.4139 24.8 9.70433 24.56 9.00519C24.32 8.30606 23.96 7.67998 23.49 7.12693C23.02 6.58433 22.43 6.13563 21.73 5.80172C21.04 5.48867 20.22 5.32172 19.31 5.32172ZM23.45 10.873H14.8V10.8208C14.8 10.6539 14.87 10.3513 15.01 9.89215C15.15 9.44346 15.39 8.97389 15.72 8.50432C16.05 8.03476 16.51 7.60693 17.08 7.24172C17.65 6.8765 18.37 6.68867 19.23 6.68867C19.81 6.68867 20.36 6.80346 20.88 7.02259C21.39 7.24172 21.85 7.54433 22.22 7.91998C22.6 8.29563 22.9 8.73389 23.12 9.22433C23.34 9.71476 23.45 10.2574 23.45 10.8208V10.873Z"
        fill="white"
      />
      <path
        d="M38.23 5.32172C37.32 5.32172 36.47 5.48867 35.69 5.81215C34.92 6.13563 34.25 6.59476 33.7 7.17911C33.15 7.76346 32.72 8.46259 32.41 9.25563C32.1 10.0487 31.94 10.9356 31.94 11.8852C31.94 12.8348 32.1 13.7217 32.41 14.5148C32.72 15.3078 33.15 16.0069 33.7 16.5913C34.25 17.1756 34.92 17.6348 35.69 17.9582C36.46 18.2817 37.32 18.4487 38.23 18.4487C39.14 18.4487 39.99 18.2817 40.75 17.9582C41.51 17.6348 42.18 17.1756 42.74 16.5913C43.3 16.0069 43.74 15.3078 44.05 14.5148C44.36 13.7217 44.52 12.8348 44.52 11.8852C44.52 10.9356 44.36 10.0487 44.05 9.25563C43.74 8.46259 43.3 7.76346 42.74 7.17911C42.18 6.59476 41.51 6.13563 40.75 5.81215C39.99 5.48867 39.14 5.32172 38.23 5.32172ZM38.23 17.0713C37.5 17.0713 36.82 16.9356 36.23 16.6539C35.64 16.3826 35.12 16.0069 34.7 15.5374C34.28 15.0678 33.96 14.5148 33.74 13.8887C33.52 13.2626 33.41 12.5843 33.41 11.8748C33.41 11.1652 33.52 10.4869 33.74 9.86085C33.96 9.23476 34.28 8.68172 34.7 8.21215C35.12 7.74259 35.63 7.37737 36.23 7.09563C36.82 6.82433 37.5 6.67824 38.23 6.67824C38.96 6.67824 39.64 6.81389 40.23 7.09563C40.82 7.36693 41.34 7.74259 41.76 8.21215C42.18 8.68172 42.5 9.23476 42.72 9.86085C42.94 10.4869 43.05 11.1652 43.05 11.8748C43.05 12.5843 42.94 13.2626 42.72 13.8887C42.5 14.5148 42.18 15.0678 41.76 15.5374C41.34 16.0069 40.83 16.3722 40.23 16.6539C39.64 16.9252 38.96 17.0713 38.23 17.0713Z"
        fill="white"
      />
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### NonceProvider 🔵

**What it does:** Injects CSP nonce into the DOM client-side for Webpack dynamic imports and InternalLoader asset injection.

**Props:**

```ts
{
  nonce: string;
}
```

**EDS components used:** None

**Usage context:** Rendered at the app root to support Content Security Policy.

**Key Tailwind classes:** None — not a visual component (injects meta tags for CSP).

**Code structure:**

```tsx
// Sets window.__webpack_nonce__ and injects <meta name="csp-nonce"> for asset loading.
// No visual output — utility component only.
```

---

## Cards & Containers

### EditableCard 🟢

**What it does:** Card with a title, optional help text tooltip, and an edit button that opens a modal.

**Props:**

```ts
interface EditableCardProps extends PropsWithChildren {
  title: string | ReactNode;
  className?: string;
  openEditModal?: () => void;
  helpText?: string;
  buttonText?: string | ReactElement;
  disabled?: boolean;
  editDisabled?: boolean;
  hideButtonOnDisabled?: boolean;
  loading?: boolean;
  size?: SizeRange; // 1-6, default 6
}
```

**EDS components used:** `Button`, `Card`

**Key Tailwind classes:** `flex flex-row gap-2`, `font-medium`, `font-normal`, `text-text-disabled`

**Code structure:**

```tsx
<Card
  title={<HintText text={title} helpText={helpText} />}
  extra={<Button label="Edit" onClick={openEditModal} type="link" />}
  loading={loading}
  size={size}
>
  {children}
</Card>
```

**Usage context:** Used extensively across network detail pages, organization settings — any card that has a view mode and an edit modal.

---

### ExpandableCard 🟢

**What it does:** Card with expand/collapse toggle. Clones child elements and passes data to them.

**Props:**

```ts
interface ExpandableCardProps<T> {
  data?: T | null;
  cardTitle?: ReactElement | null;
  cardExpandedContent?: ReactElement | null;
  isCardExpanded?: boolean;
  onToggleItem?: ((toggleData: ToggleItemData) => void) | null;
  actions?: ReactElement | null;
  loading?: boolean;
  size?: 1 | 2 | 3 | 4 | 5 | 6;
  footer?: ReactElement | null;
  footerClassName?: string;
}
```

**EDS components used:** `Card`, `IconButton`, `ICONS`

**Key Tailwind classes:** `mb-4`, `flex items-center`

**Code structure:**

```tsx
<Card
  title={React.cloneElement(cardTitle, { data })}
  expandable
  isCollapsed={!isExpanded}
  extra={
    <div className="flex items-center">
      {actions}
      <IconButton icon={chevronIcon} onClick={toggle} />
    </div>
  }
  footer={footer}
>
  {React.cloneElement(cardExpandedContent, { data })}
</Card>
```

**Usage context:** Used in network eero lists, device lists — any list of items that can be expanded to show details.

---

### ExpandedCardContent 🟢

**What it does:** Responsive grid layout for expanded card content with optional alerts, middle items, and right items.

**Props:**

```ts
interface ExpandedCardContentProps {
  singleRow?: boolean;
  children: ReactNode | ReactNode[];
  alerts?: ReactNode | ReactNode[];
  middleItems?: ReactNode | ReactNode[];
  rightItems?: ReactNode | ReactNode[];
}
```

**EDS components used:** None

**Key Tailwind classes:** `px-0 pe-8 md:ps-8`, `flex flex-col justify-between gap-x-1 gap-y-8 lg:flex-row`, `grid w-full grid-flow-row gap-6` with responsive grid columns (`md:grid-cols-3`, `2xl:grid-cols-5`)

**Code structure:**

```tsx
<div className="px-0 pe-8 md:ps-8">
  {alerts && <div className="mb-6">{alerts}</div>}
  <div className="flex flex-col justify-between ... lg:flex-row">
    <div className="grid w-full grid-flow-row gap-6 md:grid-cols-3 ...">
      {children}
    </div>
    {middleItems && <div>{middleItems}</div>}
    {rightItems}
  </div>
</div>
```

**Usage context:** Used inside ExpandableCard to lay out SimpleData fields in a responsive grid.

---

### EditableInline 🟢

**What it does:** Card with inline edit mode — toggles between view and edit states without opening a modal.

**Props:**

```ts
interface EditableInlineProps extends PropsWithChildren {
  title: string | ReactNode;
  disabled?: boolean;
  editDisabled?: boolean;
  subtitle?: string | ReactNode;
  headerData?: () => ReactNode;
  onEdit?: (edit?: boolean) => void;
  onClose?: () => void;
  onCancel?: () => void;
  onSave: () => void;
  breakpointToHideExpand?: number;
  showDivider?: boolean;
  showExpandButton?: boolean;
  tooltipMessage?: string;
  hideEditButton?: boolean;
  isLoading?: boolean;
  updated?: boolean;
  showHeaderDataOnEdit?: boolean;
  isCollapsed?: boolean | null;
  isEditing?: boolean;
  onDelete?: () => void | null;
  showDeleteButton?: boolean;
  hideHorizontalDividerOnMobile?: boolean;
  isFullWidthCard?: boolean;
  className?: string;
  hasEditMode?: boolean;
}
```

**EDS components used:** `Button`, `Card`, `IconButton`, `Tooltip`

**Usage context:** Used in settings pages (PPPoE, VLAN, RADIUS, Mobile Roaming) where inline editing is preferred over modal editing.

**Key Tailwind classes:** `flex grow-0 gap-2`, `me-2 ms-2`, `flex flex-col text-text-primary md:w-56`, `text-base font-medium text-text-primary md:w-56`, `text-sm font-normal text-text-secondary`, `eo-editable-inline flex min-w-0 shrink flex-grow items-center justify-between`, `me-6 hidden h-12 border-s border-border-layer-page md:flex`, `flex min-w-0 shrink flex-grow items-center justify-between`

**Code structure:**

```tsx
return (
        <div className="flex flex-row">
          <div className="w-full">
            <div className={cx({ "text-text-disabled": disabled })}>
              {children}
            </div>

            <div
              className={cx(
                "mt-4 block h-4 border-t border-border-layer-page",
                {
                  hidden: isFullWidthCard
                    ? hideHorizontalDividerOnMobile || width >= smWidth
                    : hideHorizontalDividerOnMobile ||
                      containerWidth >= mobileWidth,
                },
              )}
            />
            <div
              className={cx("flex", {
```

---

## Tables & Data Display

### TableWithLocale ⚪

**What it does:** Wrapper around EDS `Table` that injects localized strings for filters, sorting, empty states, and expand labels.

**Props:**

```ts
ComponentProps<typeof Table<RT>>; // passes through all EDS Table props
```

**EDS components used:** `Table`

**Code structure:**

```tsx
<Table
  {...props}
  locale={{ filterReset: T("COMMON_RESET"), emptyText: T("NO_DATA_NO_DATA"), ... }}
  labels={{ sort: { ascending: T("SORT_ASCENDING"), ... }, expand: { ... } }}
/>
```

**Usage context:** Used everywhere a table is needed — the standard table component in Insight.

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### TableWithBulkActions 🟢

**What it does:** Table with row selection checkboxes and configurable bulk action buttons and modals.

**Props:**

```ts
type TableWithBulkActionsProps<RT> = {
  rowKey: string;
  data: RT[];
  showAccountIdentifier: boolean;
  config: {
    buttons: {
      btn: (selectedKeys, onControlModal, total, totalSelected?) => ReactNode;
    }[];
    modals: { modal: (visible, onOk, onCancel, selectedKeys) => ReactNode }[];
    actions: { trigger: (networkIds: number[]) => Promise<void> }[];
  };
  filterByStackedNetwork: ReactNode;
  title: string;
  // ...plus TableWithLocale props (pagination, columns, onChange)
};
```

**EDS components used:** `Table` (via TableWithLocale)

**Key Tailwind classes:** `mb-2 flex w-full items-baseline justify-between`, `relative ms-1.5 inline-block pe-2`

**Usage context:** Used in organization network lists for bulk operations like transfer, delete.

**Code structure:**

```tsx
return (
    <div className="w-full">
      <div className="mb-2 flex w-full items-baseline justify-between">
        <div>
          {isTransferNetworkFeatureFlagEnabled &&
            (showAccountIdentifier ? (
              filterByStackedNetwork
            ) : (
              <>
                <span className="font-medium text-text-primary">{title} </span>
                {pagination && pagination.total ? (
                  <span className="lowercase">
                    ({pagination.total} {T("TOTAL")})
                  </span>
                ) : null}
              </>
            ))}
        </div>
        {buttons && (
          <div>
```

---

### TableWithVirtualList 🟢

**What it does:** Virtualized table for large datasets using the `virtual` prop on EDS Table.

**Props:**

```ts
interface TableWithVirtualListProps {
  data: any[];
  columns: ColumnType<any>[];
  showHeader?: boolean;
  loading?: boolean;
}
```

**EDS components used:** `Table`, `Loader`

**Usage context:** Used for large data tables (e.g., audit logs, event streams) where virtualization improves performance.

**Code structure:**

```tsx
return (
    // @ts-expect-error TODO: fix types
    <Table
      virtual={!!data.length}
      dataSource={data}
      loading={{
        indicator: (
          <div>
            <Loader />
          </div>
        ),
        spinning: loading,
      }}
      scroll={{
        scrollToFirstRowOnChange: false,
      }}
      columns={columns}
      pagination={false}
      showHeader={showHeader}
    />
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### DataTable 🟢

**What it does:** Full-featured data table with dual view modes (table and card), pagination, sorting, row selection, and expandable rows. Built on TanStack React Table.

**Props:**

```ts
interface DataTableProps<TRow> {
  data: TRow[];
  loading?: boolean;
  keyName?: string;
  view?: DataTableView; // Table | Card
  columns: ColumnDef<TRow>[];
  renderExpandedRow?: (row: TRow) => ReactNode;
  expandRowLabel?: (row: TRow) => string;
  getRowCanExpand?: (row: TRow) => boolean;
  enableRowSelection?: boolean;
  initialColumnPinning?: ColumnPinningState;
  defaultSort?: SortingState;
  pageSizeOptions?: number[];
  cardTitle?: ReactElement;
  cardExpandedContent?: ReactElement;
  cardFooter?: ReactElement;
  shouldShowCardFooter?: (item: TRow) => boolean;
  cardFooterClassName?: string;
  expandedItems?: string[];
  onToggleItem?: (data: ToggleItemData) => void;
  onExpandedChange?: (expanded: boolean) => void;
  onPageDataChange?: (ids: string[]) => void;
  onPageIndexChange?: (pageIndex: number, pageSize: number) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  rowHoverBg?: string;
}
```

**EDS components used:** `TableV2`, `Pagination`

**Usage context:** Used in network list pages with card/table view toggle. The most feature-rich table component in Insight.

**Key Tailwind classes:** `flex flex-col gap-4`, `flex items-center justify-center py-4`, `text-sm text-text-secondary`, `pt-2`

**Code structure:**

```tsx
return (
          state === true || Object.keys(state).some((id) => pageRowIds.has(id))
        );
      }
      return expandedItems.length > 0;
    },
  }));

  const stableRenderExpandedRow = useCallback(
    (row: TRow) => renderExpandedRow?.(row) ?? <></>,
    [renderExpandedRow],
  );

  const tablePaginationInfo: PaginationInfo = {
    totalItems: table.getFilteredRowModel().rows.length,
    totalPages: table.getPageCount(),
    hasPreviousPage: table.getCanPreviousPage(),
    hasNextPage: table.getCanNextPage(),
  };

```

---

### SimpleData 🟢

**What it does:** Label/value display pair with optional copy, edit, and link functionality.

**Props:**

```ts
interface SimpleDataProps {
  label: ReactNode;
  value?: ReactNode | string;
  copyable?: boolean;
  onEditClick?: () => void;
  dropdown?: DropdownProps;
  link?: ReactNode;
  className?: string;
  suffix?: ReactNode;
  centerItems?: boolean;
  testId?: string;
  toolTipText?: string;
  shouldRender?: boolean;
  valueClassName?: string;
}
```

**EDS components used:** `CopyableText`, `ICONS`, `TinyIconButton`

**Key Tailwind classes:** `whitespace-normal`, `mb-1 pl-1 font-medium text-text-primary` (label), `pl-1 text-sm text-text-secondary` (value), `text-text-disabled` (no value)

**Code structure:**

```tsx
<dl>
  <dt className="mb-1 pl-1 font-medium text-text-primary">{label}</dt>
  <dd className="pl-1 text-sm text-text-secondary">
    {copyable ? <CopyableText text={value} /> : <span>{value}</span>}
    {onEditClick && <TinyIconButton icon={ICONS.FUNCTIONAL_EDIT} />}
  </dd>
</dl>
```

**Usage context:** The primary key-value display component. Used inside ExpandedCardContent grids, detail panels, and settings pages.

---

### SimpleList 🟢

**What it does:** Renders a list of items with icon, label, and value using a compound component pattern.

**Props:**

```ts
type SimpleListProps = {
  items?: ItemMeta[];
  renderItem?: () => ReactNode;
};
```

**EDS components used:** None

**Usage context:** Used for simple data lists in network details and eero details.

**Key Tailwind classes:** `mr-2 inline-block`, `simplelist__itemrow`, `flex items-center justify-between`, `eo-flex eo-align-items-center`

**Code structure:**

```tsx
return (
    <div className="simplelist__itemrow" {...other}>
      {children}
    </div>
  );
}

function Item({
  children,
  ...otherProps
}: {
  children: ReactNode;
  otherProps?: any;
}) {
  return <Row {...otherProps}>{children}</Row>;
}

function CustomItemMeta({
  children,
  ...otherProps
```

---

### KeyValuePairs 🟢

**What it does:** Responsive flex layout for displaying multiple key-value pairs, supporting both icon-based and label/value items.

**Props:**

```ts
type KeyValuePairsProps = {
  items: KeyValueItem[];
  className?: string;
};

type KeyValueItem = {
  label?: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  className?: string;
};
```

**EDS components used:** None (uses SimpleData internally)

**Key Tailwind classes:** `flex flex-wrap gap-x-8 gap-y-4`

**Usage context:** Used in eero detail cards and network overview sections.

**Code structure:**

```tsx
return (
    <div className={`flex flex-wrap gap-x-8 gap-y-4 ${className}`}>
      {/* eslint-disable react/no-array-index-key -- items are static display data, never reordered */}
      {items.map((item, index) =>
        item.icon ? (
          <div key={index} className="flex flex-col items-center ps-1">
            {item.icon}
            <div className={item.className}>{item.value}</div>
          </div>
        ) : (
          <SimpleData key={index} label={item.label} value={item.value} />
        ),
      )}
      {/* eslint-enable react/no-array-index-key */}
    </div>
  );
}

```

---

### ColumnEditorPanel 🟢

**What it does:** Slide-out panel for reordering and toggling table column visibility with drag-and-drop and search.

**Props:**

```ts
type ColumnEditorPanelProps = {
  title: string;
  closeButtonTitle: string;
  listKey: string;
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnEditorItem[];
  onColumnsChange: (cols: ColumnEditorItem[]) => void;
  searchRef?: React.Ref<HTMLInputElement>;
  announce?: (message: string) => void;
};

type ColumnEditorItem = {
  id: string;
  label: string;
  is_active: boolean;
};
```

**EDS components used:** `Panel`, `SortableList`, `Input`, `Icon`, `ICONS`

**Usage context:** Used in network list pages to customize visible table columns.

**Key Tailwind classes:** `sticky top-0 z-10 bg-layer-page px-2 pb-1 pt-2`, `flex h-full items-center justify-center py-8 text-text-tertiary`, `pb-32`

**Code structure:**

```tsx
return (
    <Panel
      panels={[
        {
          title,
          size: "regular",
          body: (
            <>
              {/* Search */}
              <div className="sticky top-0 z-10 bg-layer-page px-2 pb-1 pt-2">
                <Input
                  id={`${listKey}-search`}
                  placeholder={T("NETWORK_LIST_SEARCH_FOR_COLUMNS")}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  type="search"
                  prefix={<Icon icon={ICONS.FUNCTIONAL_SEARCH} />}
                  ref={searchRef}
```

---

## Forms & Inputs

### PhoneInput 🟢

**What it does:** International phone number input with country code selector, validation, and formatting using `libphonenumber-js`.

**Props:**

```ts
interface PhoneInputProps {
  input?: { value?: string; onChange?: (value?: PhoneNumberType) => void };
  className?: string;
  id?: string;
  label?: ReactNode | string;
  onChange?: (value?: PhoneNumberType) => void;
  countryCodes?: CountryCode[];
  returnAsYouType?: boolean;
  caption?: ReactNode;
  ariaLabel?: string;
  override?: boolean;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean, errorMessage?: string) => void;
}
```

**EDS components used:** `Input`, `Select`

**Key Tailwind classes:** `phone-select-wrapper none flex gap-2`, `block w-full pb-2`, `mb-1 text-sm text-text-warning`

**Code structure:**

```tsx
<label>{label}</label>
<div className="phone-select-wrapper flex gap-2">
  <Select value={countryCode} onChange={handleCountryChange} options={sortedOptions} showSearch />
  <Input value={formattedNumber} onChange={handlePhoneInputChange} status={isValid ? undefined : "error"} />
</div>
{!isValid && <div className="text-text-warning" role="alert">{errorMessage}</div>}
```

**Usage context:** Used in organization settings for support phone number, and in network owner forms.

---

### SchemaSelectorInput 🔵

**What it does:** Input field with a protocol schema selector (HTTP/HTTPS) as an addon prefix.

**Props:**

```ts
interface SchemaSelectorInputProps {
  name?: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  inputValue: string | null;
  savingSettings?: boolean;
  isUnavailable?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFocus?: () => void;
  handleBlur?: () => void;
  onPaste?: (e: ClipboardEvent<HTMLInputElement>) => void;
  suffixContent?: ReactNode;
  addonBefore?: ReactNode;
  inputRef?: React.Ref<typeof Input>;
  schema?: string;
  onChangeSelect?: (value: string) => void;
}
```

**EDS components used:** None (uses antd `Input`, `Select` directly)

**Usage context:** Used in network settings for captive portal URL configuration.

**Code structure:**

```tsx
return (
    <Input
      name={name}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength || undefined}
      value={inputValue || ""}
      disabled={savingSettings || isUnavailable}
      onChange={onChange}
      onPaste={onPaste}
      addonBefore={addonBefore || schemaSelector}
      onFocus={handleFocus}
      onBlur={handleBlur}
      suffix={suffixContent}
      ref={inputRef as any}
    />
  );
}

export default SchemaSelectorInput;
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### FileUpload 🟢

**What it does:** Drag-and-drop file upload area using antd's Upload.Dragger.

**Props:**

```ts
type FileUploadProps = UploadProps & {
  buttonText: string;
};
```

**EDS components used:** None (uses antd `Upload` directly)

**Code structure:**

```tsx
<Upload.Dragger {...otherProps}>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">{buttonText}</p>
</Upload.Dragger>
```

**Usage context:** Used in RADIUS certificate upload and other file import flows.

**Key Tailwind classes:** `ant-upload-drag-icon`, `ant-upload-text`

---

### FileUploadCsv 🔵

**What it does:** CSV file upload with operation options (radio buttons), upload progress tracking, and retry capability.

**Props:**

```ts
type Props = {
  fetchUploadLink: () => Promise<any>;
  operationOptionsTitle: string;
  operationOptions: {
    text: string | ElementType | JSX.Element;
    optionValue?: string;
  }[];
  setEnableNext: Dispatch<SetStateAction<boolean>>;
  importOperation: string;
  setImportOperation: Dispatch<SetStateAction<string>>;
  onFinishUpload: (data: FileUploadData) => void;
  uploadLinkData?: FileImportUploadLink;
};
```

**EDS components used:** `Button`, `Radio`

**Usage context:** Used in file import modals for CSV-based bulk operations (network import, user import).

**Key Tailwind classes:** `w-full`, `mt-4 rounded border bg-background-page py-4 pe-4 ps-4`, `mb-4 text-sm font-medium text-text-primary`

**Code structure:**

```tsx
return (
    <>
      <div className="w-full">
        <Upload
          fileList={files}
          accept=".csv"
          beforeUpload={beforeUploadFile}
          itemRender={fileRender}
          data-testid="csv-file-upload"
        >
          {!files.length && (
            <Button type="link" label={T("COMMON_CHOOSE_FILE")} />
          )}
        </Upload>
      </div>
      {!!files.length && operationOptions.length > 0 && (
        <div className="mt-4 rounded border bg-background-page py-4 pe-4 ps-4">
          <span className="mb-4 text-sm font-medium text-text-primary">
            {operationOptionsTitle}
          </span>
```

---

### RangeDatePicker ⚪

**What it does:** Wrapper around EDS `RangePicker` with locale support and custom date range controls.

**Props:**

```ts
type RangeDatePickerProps = {
  onFilter?: (value: { startDate: Date; endDate: Date }) => void;
  dateControl?: { fromDate: Dayjs; setFromDate; toDate: Dayjs; setToDate };
  customControl: {
    openRangePicker: boolean;
    handleOnOpenChangeRangePicker: (open: boolean) => void;
    disabledDate: (current: Dayjs) => boolean;
    handleOnChangeRangePicker: (values: (Dayjs | null)[] | null) => void;
    autoFocus: boolean;
  };
};
```

**EDS components used:** `RangePicker`

**Usage context:** Used in PeriodSelectorWithDatePicker and audit log date filtering.

**Code structure:**

```tsx
return (
    <ConfigProvider locale={getCurrentLocale}>
      <div data-testid="range-picker-container">
        <RangePicker
          open={openRangePicker}
          onOpenChange={
            customControl?.handleOnOpenChangeRangePicker ??
            handleOnOpenChangeRangePicker
          }
          disabledDate={customControl?.disabledDate ?? disabledDate}
          onChange={
            customControl?.handleOnChangeRangePicker ??
            handleOnChangeRangePicker
          }
          {...otherProps(getRangeDateSelected)}
          aria-label={T("COMMON_DATE_RANGE_PICKER")}
          placeholder={[
            `${T("COMMON_DATE_RANGE_PICKER_START", { format: "YYYY-MM-DD" })}`,
            `${T("COMMON_DATE_RANGE_PICKER_END", { format: "YYYY-MM-DD" })}`,
          ]}
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

## Status & Indicators

### AccessoryStatus 🔵

**What it does:** Displays status for eero accessories (Retrograde cellular backup, Foghorn voice adapter) with model-specific rendering.

**Props:**

```ts
interface AccessoryStatusProps {
  model: string;
  configurationStatus?: string;
  registered?: boolean;
  properties?: AccessoryProperties;
  cellularBackupStatus?: string | null;
  connectedEeroUrl?: string | null;
  isHorizontalDisplay?: boolean;
  networkId?: string;
}
```

**EDS components used:** `Icon`, `ICONS` (via BaseStatusDisplay)

**Usage context:** Used in eero detail cards to show accessory connection status.

**Code structure:**

```tsx
return (
    <BaseStatusDisplay
      icon={config.icon}
      label={config.label}
      iconClassName={config.iconClassName}
      labelClassName={config.labelClassName}
      isHorizontalDisplay={isHorizontalDisplay}
    />
  );
}

interface FoghornStatusProps {
  configurationStatus?: string;
  port1VoiceStatus?: PortVoiceStatus;
  port2VoiceStatus?: PortVoiceStatus;
  isHorizontalDisplay?: boolean;
  networkId?: string;
}

function FoghornStatus({
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### AlertLevelIcon 🟢

**What it does:** Renders an info or warning icon with tooltip based on alert level.

**Props:**

```ts
interface AlertLevelIconProps {
  level?: Maybe<string>; // "info" | "warning"
  title?: string;
}
```

**EDS components used:** `ICONS`, `Icon`, `Tooltip`

**Code structure:**

```tsx
// level === "info"
<Tooltip title={title}><Icon icon={ICONS.FUNCTIONAL_INFOFILLEDCOLOR} /></Tooltip>
// level === "warning"
<Tooltip title={title}><Icon icon={ICONS.FUNCTIONAL16X16_WARNINGSMALL} /></Tooltip>
```

**Usage context:** Used in network alerts, metrics alerts, and table cells to indicate severity.

**Key Tailwind classes:** `cursor-default`

---

### BackupInternetStatus 🔵

**What it does:** Displays backup internet status (cellular, WiFi backup WAN) with signal bars icon and status text.

**Props:**

```ts
type BackupInternetStatusProps = {
  ringLte?: EeroDetailsRingLte | null;
  cellularBackup?: CellularBackup | null;
  backupWan?: { ssid?: Maybe<string> } | null;
  maxData?: number | null;
  configurationStatuses?: string[];
  loading?: boolean;
};
```

**EDS components used:** `Icon`, `ICONS`

**Key Tailwind classes:** `flex flex-row items-center`, `min-w-8`

**Usage context:** Used in eero detail cards and network overview to show backup internet state.

**Code structure:**

```tsx
return (
      <div className="flex flex-row items-center">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center">
      {config.icon && (
        <div className={cx("min-w-8", config.iconClassName)}>
          <Icon icon={config.icon} />
        </div>
      )}
      <span className={config.textClassName}>{config.text}</span>
    </div>
  );
}

export default BackupInternetStatus;
```

---

### BaseStatusDisplay 🟢

**What it does:** Generic icon + label status display with optional link wrapper. Supports horizontal and vertical layouts.

**Props:**

```ts
interface BaseStatusDisplayProps {
  icon: ICONS;
  label: string;
  iconClassName?: string;
  labelClassName?: string;
  isHorizontalDisplay?: boolean;
  href?: string;
}
```

**EDS components used:** `Icon`, `ICONS`

**Key Tailwind classes:** `flex items-center`, `flex-row gap-2` (horizontal), `flex-col` (vertical), `text-nowrap text-center text-sm font-medium`

**Code structure:**

```tsx
<div
  className={cx(
    "flex items-center",
    isHorizontalDisplay ? "flex-row gap-2" : "flex-col",
  )}
>
  <Icon icon={icon} title={label} className={iconClassName} />
  <span className="text-nowrap text-center text-sm font-medium">{label}</span>
</div>
```

**Usage context:** Base component used by AccessoryStatus, EeroConnectedStatus, and other status displays.

---

### EeroConnectedStatus 🔵

**What it does:** Displays eero connection status with icon and label, supporting multiple connection types (WiFi, Ethernet, backup internet).

**Props:**

```ts
interface EeroConnectedStatusProps {
  status?: Maybe<string>;
  connectionType?: Maybe<string>;
  type?: string;
  warnings?: Maybe<Warning>;
  inline?: Maybe<boolean>;
  meshQualityBars?: Maybe<number>;
  backupInternetBars?: Maybe<number>;
  ethernetAddresses?: Maybe<string[]>;
  lastHeartbeat?: Maybe<string>;
  isRebooting?: boolean;
  enabled?: Maybe<boolean>;
  isInternetBackup?: Maybe<boolean>;
}
```

**EDS components used:** None (uses custom StatusIcon and StatusLabel sub-components)

**Key Tailwind classes:** `flex items-center`, `w-34 flex-col` (vertical), `flex-row gap-1` (inline)

**Usage context:** Used in eero cards and tables to show online/offline/rebooting status.

**Code structure:**

```tsx
return (
    <div className={className}>
      <StatusIcon
        type={type}
        warnings={warnings}
        status={status}
        inline={inline}
        connectionType={connectionType}
        meshQualityBars={meshQualityBars}
        backupInternetBars={backupInternetBars}
        ethernetAddresses={ethernetAddresses ?? []}
        isRebooting={isRebooting}
        enabled={enabled}
        isInternetBackup={isInternetBackup}
      />
      <div className={clsx("min-w-0", { "flex-1": !inline })}>
        <StatusLabel
          type={type}
          warnings={warnings}
          status={status}
```

---

### DotIcon 🟢

**What it does:** Colored dot indicator with support for multi-color gradients and dashed borders.

**Props:**

```ts
type DotIconProps = {
  color: string;
  className?: string;
  size?: number;
  border?: string;
  borderWidth?: number;
  multiColors?: { color: string; offset: string }[];
  strokeDasharray?: boolean;
  margin?: string;
};
```

**EDS components used:** None

**Code structure:**

```tsx
<div
  className="eo-dot-icon"
  style={{
    width: size || 10,
    height: size || 10,
    borderRadius: "50%",
    backgroundColor: multiColors ? "transparent" : color,
    backgroundImage: multiColors ? `linear-gradient(...)` : undefined,
  }}
/>
```

**Usage context:** Used in chart legends, status indicators, and list items.

**Key Tailwind classes:** `eo-dot-icon`

---

### NetworkModeTag 🔵

**What it does:** Displays a colored tag indicating network mode (bridge, NAT, etc.) with optional tooltip.

**Props:**

```ts
type NetworkModeTagProps = {
  mode: string | null;
  showResidentInfo?: boolean;
};
```

**EDS components used:** `Tooltip`, `Tag`

**Usage context:** Used in network detail headers and network list tables.

**Code structure:**

```tsx
return (
      <Tooltip title={T(currentState?.toolTip)}>
        <div>
          <Tag color={currentState.tagColor}>{T(currentState.text)}</Tag>
        </div>
      </Tooltip>
    );
  }

  return (
    <div>
      <Tag color={currentState.tagColor}>{T(currentState.text)}</Tag>
    </div>
  );
}

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### FeatureOutageBanner 🟢

**What it does:** Error banner displayed when a feature is experiencing an outage, with a "Try Again" button.

**Props:**

```ts
type FeatureOutageBannerProps = {
  display?: boolean;
};
```

**EDS components used:** `Button`, `SupportMessages`

**Code structure:**

```tsx
<SupportMessages
  messageType="error"
  additionalMessage={
    <div className="flex gap-2">
      {T("ORGANIZATION_GENERIC_FEATURE_OUTAGE_BANNER")}
      <Button
        type="link"
        label={T("COMMON_TRY_AGAIN")}
        onClick={() => window.location.reload()}
      />
    </div>
  }
/>
```

**Usage context:** Used at the top of feature sections when API calls fail.

**Key Tailwind classes:** `mb-6`, `flex gap-2`

---

### EeroInternalAlerts 🔵

**What it does:** Displays internal maintenance banners for eero staff.

**EDS components used:** None (delegates to GenericMaintenanceBanner)

**Usage context:** Shown in the app layout for internal users during maintenance windows.

**Code structure:**

```tsx
return <GenericMaintenanceBanner />;
}

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

## Modals & Dialogs

### ConfirmCableCheckModal 🔵

**What it does:** Confirmation modal for triggering ethernet cable checks on eero ports, with warnings about connectivity loss and unsupported ports.

**Props:**

```ts
type ConfirmCableCheckModalProps = {
  visible?: boolean;
  eeroId: number;
  eeroInternalModelName?: string;
  ports?: string[] | number[];
  onClose: (cableCheckId?: string) => void;
  onConfirm?: () => void;
  showUnsupportedPortsWarning?: boolean;
};
```

**EDS components used:** `Button`, `Modal`, `SupportMessages`, `ToastType`, `useToast`

**Usage context:** Used in eero port details when running cable diagnostics.

**Key Tailwind classes:** `py-2`, `inline-block`, `flex flex-col gap-y-4 py-4`

**Code structure:**

```tsx
return (
    <Modal
      open={visible}
      okText={
        portsWarning
          ? T("COMMON_CONTINUE")
          : T("EEROS_CABLE_CHECK_MODAL_CONFIRM", { ports: ports.length })
      }
      cancelText={T("COMMON_CANCEL")}
      onOk={() => (portsWarning ? setPortsWarning(false) : triggerCableCheck())}
      okButtonProps={{
        disabled: loading,
        loading,
        danger: false,
      }}
      title={
        portsWarning
          ? T("EEROS_CABLE_CHECK_MODAL_UNSUPPORTED_TITLE")
          : T("EEROS_CABLE_CHECK_MODAL_POSSIBLE_CONNECTIVITY_LOSS")
      }
```

---

### DataExportsModal 🟢

**What it does:** Modal for exporting data as CSV with optional email notification, sort/filter options, and a Data Connector tab for S3 bucket configuration.

**Props:**

```ts
type DataExportsModalProps = {
  datasetName: Dataset;
  title: string;
  isVisible: boolean;
  requestExport: (params: any) => Promise<void>;
  onCancel?: () => void;
  showFiltering?: boolean;
  defaultSortFilters?: boolean;
  dataConnector?: boolean;
  useNetworkListDataConnector?: boolean;
};
```

**EDS components used:** `Checkbox`, `Modal`, `Tabs`, `useToast`, `ToastType`

**Usage context:** Used across organization pages for exporting network lists, user lists, and other datasets.

**Key Tailwind classes:** `flex flex-col gap-4 pt-4`, `mb-4`, `mb-0`, `mt-2 text-text-secondary`

**Code structure:**

```tsx
return (
      <Modal
        okText={okText}
        onOk={handleOk}
        onCancel={cancel}
        destroyOnClose
        cancelText={T("COMMON_CANCEL")}
        title={title}
        open={isVisible}
        okButtonProps={{
          loading: isLoading,
          disabled:
            useNetworkListDataConnector && activeTab !== DataExportTabs.csv,
        }}
        cancelButtonProps={{
          disabled: isLoading,
        }}
      >
        <DataExportsOutage error={responseError} />
        <Tabs
```

---

### FileImportModal 🔵

**What it does:** Multi-step file import modal with information step and import step, using context provider for shared state.

**Props:**

```ts
type Props = {
  organizationId?: string | null;
  closeModal: () => void;
  importJobType: FileImportJobType;
  description: string | ReactNode;
  sampleItems: { letter: string; title: string; description: string }[];
  sampleFile: StaticImageData;
  importOperationOptions: { message?: string; value: string; title: string }[];
  onSaveCompleted?: () => void;
  focusPointRefModal?: MutableRefObject<HTMLElement | null> | null;
  metadata?: Partial<FileImportJob["metadata"]>;
};
```

**EDS components used:** `Modal` (in sub-components)

**Usage context:** Used for CSV-based bulk imports (networks, users, devices).

**Code structure:**

```tsx
return (
    <FileImportModalContext.Provider value={contextValue}>
      {openModal === "IMPORT" && <ImportModal />}
      {openModal === "INFORMATION" && (
        <InformationModal
          sampleItems={sampleItems}
          sampleFile={sampleFile}
          setOpenModal={setOpenModal}
        />
      )}
    </FileImportModalContext.Provider>
  );
}

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### ModalCustomerInfo 🔵

**What it does:** Simple confirmation modal for viewing customer information with focus management.

**Props:**

```ts
type ModalCustomerInfoProps = {
  showModal?: boolean;
  closeModal: () => void;
  onOk: () => void;
};
```

**EDS components used:** `Modal`

**Usage context:** Used in network detail pages when accessing owner information.

**Key Tailwind classes:** `mt-4 text-sm text-text-primary`

**Code structure:**

```tsx
return (
    <Modal
      title={T("NETWORK_DETAILS_OWNER_INFO_TITLE")}
      open={showModal}
      okText={T("COMMON_CONFIRM")}
      cancelText={T("COMMON_CANCEL")}
      onOk={onOk}
      onCancel={closeModal}
    >
      <p
        className="mt-4 text-sm text-text-primary"
        ref={paragraphRef}
        tabIndex={-1}
      >
        {T("NETWORK_DETAILS_OWNER_INFO_DESCRIPTION")}
      </p>
    </Modal>
  );
}

```

---

### ModalNetworkLimitExceeded 🔵

**What it does:** Warning modal shown when a network ownership transfer would exceed the limit.

**Props:**

```ts
type ModalNetworkLimitExceededProps = {
  showModal?: boolean;
  closeModal: () => void;
  onOk: () => void;
};
```

**EDS components used:** `Modal`

**Usage context:** Used in network transfer flows.

**Key Tailwind classes:** `mt-4 text-sm text-text-primary`

**Code structure:**

```tsx
return (
    <Modal
      title={T("NETWORK_DETAILS_OWNER_LIMIT_EXCEEDED_TITLE")}
      open={showModal}
      okText={T("COMMON_CONFIRM")}
      cancelText={T("COMMON_BACK")}
      onOk={onOk}
      onCancel={closeModal}
    >
      <p className="mt-4 text-sm text-text-primary">
        {T("NETWORK_DETAILS_OWNER_LIMIT_EXCEEDED")}
      </p>
    </Modal>
  );
}

```

---

### RadioSelectorModal 🟢

**What it does:** Generic modal with radio button selection, supporting both predefined options and custom children.

**Props:**

```ts
interface RadioSelectorModalProps<T> extends PropsWithChildren {
  title: string;
  subtitle?: string;
  options?: { key: string; value: T; label: string }[];
  isVisible: boolean;
  closeModal: () => void;
  onSave: (newValue: T) => Promise<any>;
  isLoading?: boolean;
  initialValue?: string | number;
}
```

**EDS components used:** `Modal`, `Radio`

**Code structure:**

```tsx
<Modal
  title={title}
  okText={T("COMMON_SAVE")}
  onOk={handleSave}
  onCancel={closeModal}
>
  <h3>{subtitle}</h3>
  <Form form={form}>
    <Form.Item name="value" initialValue={initialValue}>
      {children || <Radio name="value" options={radioOptions} />}
    </Form.Item>
  </Form>
</Modal>
```

**Usage context:** Used for settings that require selecting one option from a list (e.g., DNS settings, update preferences).

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### EeroFirmwareUpdateModal 🔵

**What it does:** Modal for selecting and applying firmware updates to eeros with version selection and confirmation.

**Props:**

```ts
interface EeroFirmwareUpdateModalProps {
  isVisible: boolean;
  onCancel: () => void;
  eeroId: string | null;
  onConfirmFirmwareUpdate: () => void;
  currentVersion?: Maybe<string>;
}
```

**EDS components used:** `Loader`, `Modal`, `Radio`, `Input`, `useToast`, `ToastType`, `Icon`, `ICONS`

**Usage context:** Used in eero detail pages for manual firmware updates.

**Key Tailwind classes:** `text-base`, `flex h-firmware flex-col`, `border-b pb-2`, `flex-1 overflow-y-auto`, `my-4 flex items-center justify-center`

**Code structure:**

```tsx
<Modal
  title={T("EERO_FIRMWARE_UPDATE_TITLE")}
  onCancel={onCancel}
  onOk={handleConfirm}
>
  <div className="flex h-firmware flex-col">
    <Input
      placeholder={T("SEARCH")}
      onChange={handleSearch}
      className="border-b pb-2"
    />
    <div className="flex-1 overflow-y-auto">
      <Radio.Group value={selectedVersion}>
        {/* firmware version list */}
      </Radio.Group>
    </div>
  </div>
</Modal>
```

---

### EerosModal (AddDiscoveredEerosModal / NameEerosModal) 🔵

**What it does:** Multi-step modal flow for adding discovered eeros to a network and naming them.

**EDS components used:** `Modal`, `Input`, `Loader`

**Usage context:** Used in network setup and eero management flows.

**Key Tailwind classes:** `mb-3 mt-4`, `my-2 ms-2 flex items-center gap-3`, `text-icon-primary`, `flex flex-col`, `flex items-center gap-2`, `text-sm font-medium text-text-primary`, `text-text-primary`, `text-text-error`

**Code structure:**

```tsx
return (
    <Modal
      isOpen={visible}
      onOk={form.submit}
      title={T("ADD_EERO_ADD_EERO")}
      okText={T("COMMON_ADD")}
      cancelText={T("COMMON_CANCEL")}
      onCancel={handleClose}
      okButtonProps={{
        disabled: !enableAddButton,
        loading,
      }}
    >
      <div className="mb-3 mt-4">{T("EERO_CHOOSE_EEROS_TO_SETUP")}</div>
      <Form layout="vertical" form={form} onFinish={onSubmit}>
        <Form.Item name="selected">
          <Checkbox
            onChange={(checked: string[]) =>
              setEnableAddButton(!!checked?.length)
            }
```

---

### AssociateCommunityModal / DisassociateCommunityModal 🔵

**What it does:** Multi-step modals for associating/disassociating networks with community organizations (MDU).

**EDS components used:** `Modal`

**Usage context:** Used in MDU (Multi-Dwelling Unit) network management.

**Key Tailwind classes:** None — uses WDS Modal, no custom styling.

**Code structure:**

```tsx
<Modal
  onCancel={goBack}
  cancelText={activeStep > 0 ? T("COMMON_BACK") : T("COMMON_CANCEL")}
  onOk={() => form.submit()}
  okText={activeStep >= lastStep ? T("COMMON_CONFIRM") : T("COMMON_CONTINUE")}
  title={T("NETWORK_DETAILS_ASSOCIATE_WITH_COMMUNITY")}
>
  {/* Multi-step form content */}
</Modal>
```

---

### LocaleSelect ⚪

**What it does:** Language selection modal with radio buttons for all supported locales.

**Props:**

```ts
interface LanguageSelectorProps {
  isVisible: boolean;
  closeModal: () => void;
  onSave?: (language: string) => void;
  preSelectedLanguage?: string;
  isLoading?: boolean;
  updateApp?: boolean;
}
```

**EDS components used:** `Radio`, `Modal`

**Usage context:** Triggered from the Header user dropdown to change the app language.

**Key Tailwind classes:** `py-1 text-text-primary`, `mt-5 text-sm font-medium text-text-primary`

**Code structure:**

```tsx
return (
    <Modal
      open={isVisible}
      okText={T("COMMON_SAVE")}
      cancelText={T("COMMON_CANCEL")}
      onOk={form.submit}
      onCancel={closeModal}
      okButtonProps={{
        loading: isLoading,
      }}
      cancelButtonProps={{
        disabled: isLoading,
      }}
      title={
        <span className="py-1 text-text-primary">
          {T("LANGUAGE_SELECTOR_MODAL_TITLE")}
        </span>
      }
    >
      <p className="mt-5 text-sm font-medium text-text-primary">
```

---

## Filters & Controls

### PeriodSelector 🟢

**What it does:** Dropdown select for choosing a time period from a list of ISO date strings, with computed relative labels.

**Props:**

```ts
type PeriodSelectorProps = {
  onChange?: (value: string | number | Date, option: any) => void;
  defaultValue?: string | number;
  periods: string[];
  customLabel?: string;
  customStyle?: React.CSSProperties;
} & Omit<SelectProps, "id">;
```

**EDS components used:** `Select`

**Key Tailwind classes:** `w-40`

**Usage context:** Used in data usage pages, event streams, and other time-series views.

**Code structure:**

```tsx
return (
    <Select
      id="periodSelector"
      style={customStyle}
      defaultValue={defaultVal}
      onChange={(value, option) => onChange && onChange(value, option)}
      options={basicOptions}
      className="w-40"
      {...otherProps}
    />
  );
}

```

---

### PeriodSelectorWithDatePicker 🟢

**What it does:** Combines PeriodSelectorV2 with a RangeDatePicker — selecting "Custom" opens a date range picker.

**Props:**

```ts
type PeriodSelectorWithDatePickerProps = {
  onChange: (
    label: string,
    startDate: Date | PeriodSelectorOption,
    endDate?: Date,
  ) => void;
  defaultValue: string;
  periods: PeriodSelectorOption[];
  customLabel?: string;
  minDateRange?: string;
  maxDateRange?: Dayjs;
  selectedValue?: string;
};
```

**EDS components used:** `Select` (via PeriodSelectorV2), `RangePicker` (via RangeDatePicker)

**Usage context:** Used in fleet summary, outage reports, and other pages needing both preset and custom date ranges.

**Code structure:**

```tsx
return (
    <div>
      {showPeriodSelector ? (
        <PeriodSelectorV2
          onSelect={handleOnSelectPeriodSelector}
          periods={periods}
          defaultValue={defaultSelectValue as TimePeriod}
          customLabel={customMessage}
          customStyle={{ minWidth: "120px" }}
          value={selectedValue}
          data-testid="period-selector-container"
        />
      ) : (
        <RangeDatePicker
          customControl={{
            openRangePicker,
            autoFocus: true,
            handleOnOpenChangeRangePicker,
            disabledDate,
            handleOnChangeRangePicker,
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### PeriodFilter 🟢

**What it does:** Segmented control for time period selection (7 days, 30 days, 90 days, 12 months, YTD) with mobile dropdown fallback.

**Props:**

```ts
type Props = {
  loading?: boolean;
  period: string;
  periods?: { [key in PeriodKeys]?: string };
  setPeriod: (period: PeriodKeys) => void;
};
```

**EDS components used:** `INPUT_MENU_TYPES`, `InputMenu`, `Segmented`, `InputMenuDropdown`

**Code structure:**

```tsx
{
  /* Desktop */
}
<Segmented items={items} value={period} onChange={setPeriod} />;
{
  /* Mobile */
}
<InputMenuDropdown
  optionsList={items}
  InputMenu={<InputMenu type={INPUT_MENU_TYPES.SELECT} />}
/>;
```

**Usage context:** Used in fleet summary dashboards and analytics pages.

**Key Tailwind classes:** `hidden sm:block`, `wds-eero-segmented mb-4 font-normal sm:mb-0 sm:me-3`, `block w-full pb-3 sm:hidden`

---

### NetworkTypeFilter 🟢

**What it does:** Multi-select dropdown for filtering by network customer type (Residential, Business, MDU, Enterprise).

**Props:**

```ts
type Props =
  | {
      custom: false;
      networkTypes: NetworkTypeValues[];
      setNetworkTypes: (types: NetworkTypeValues[]) => void;
    }
  | {
      custom: true;
      networkTypes: NetworkCustomerTypes[];
      setNetworkTypes: (types: NetworkCustomerTypes[]) => void;
      networkTypeOptions?: { label: string; value: NetworkCustomerTypes }[];
    };
```

**EDS components used:** `INPUT_MENU_TYPES`, `InputMenu`, `InputMenuDropdown`

**Usage context:** Used alongside PeriodFilter in fleet summary and analytics pages.

**Key Tailwind classes:** `w-full sm:w-auto`

**Code structure:**

```tsx
return (
    <div className="w-full sm:w-auto">
      <InputMenuDropdown
        optionsList={options}
        l10n_labelFilter={getNetworkTypeButtonLabel(networkTypes, T)}
        hideTotalFiltered
        applyFilter={onSelect}
        alignment="right"
        InputMenu={
          <InputMenu
            inputName="network_type"
            type={INPUT_MENU_TYPES.MULTI_SELECT}
            options={options}
            initialValue={networkTypes}
            autosave
            label={{
              selected: T("COMMON_SELECTED"),
              notSelected: T("COMMON_NOT_SELECTED"),
            }}
          />
```

---

### SegmentedControl ⚪

**What it does:** Thin wrapper around EDS `Segmented` with controlled state management.

**Props:**

```ts
type SegmentedControlProps<T extends string> = {
  segments: Array<{ value: T; label: string }>;
  defaultSegmentValue?: T;
  currentSegmentValue?: T;
  onChange: (value: T) => void;
};
```

**EDS components used:** `Segmented`

**Usage context:** Used for view toggles (e.g., table/card view, chart type selection).

**Code structure:**

```tsx
return (
    <Segmented
      items={segments}
      value={selectedSegment}
      // @ts-expect-error - should fix segmented from WDS to receive the key type
      onChange={handleOnClickSegment}
    />
  );
}

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### SortMenu 🟢

**What it does:** Dropdown icon button for sort options with checkmark on the selected sort.

**Props:**

```ts
type SortMenuProps = {
  placement?: "bottomLeft" | "bottomRight";
  menuItems: {
    key: string;
    title: string;
    action: () => void;
    disabled?: boolean;
    selected?: boolean;
  }[];
};
```

**EDS components used:** `DropdownIconButton`, `Icon`, `ICONS`

**Code structure:**

```tsx
<DropdownIconButton
  icon={ICONS.FUNCTIONAL_FILTERALT}
  items={menuItems.map(({ key, title, selected, action }) => ({
    key,
    label: (
      <button onClick={action}>
        <span>{title}</span>
        {selected && <Icon icon={ICONS.FUNCTIONAL_CHECK} />}
      </button>
    ),
  }))}
/>
```

**Usage context:** Used in list pages for sorting options.

**Key Tailwind classes:** `!ps-3 pe-3`, `flex w-full gap-4`

---

### TimeRangePaginator 🟢

**What it does:** Time-based pagination with back/forward navigation by day, week, or month, with keyboard shortcuts.

**Props:**

```ts
type TimeRangePaginatorProps = {
  unitOfTime: ManipulateType;
  onChange: (timeRange: { start: string; end: string }) => void;
  defaultDay?: string;
  hideNavigation?: boolean;
  hasToDisableBackButton?: (timeRange: string) => boolean;
  maxPastMonths?: number;
};
```

**EDS components used:** `IconButton`, `ICONS`, `Tooltip`

**Key Tailwind classes:** `w-60 text-nowrap text-center sm:me-3 sm:text-start`

**Usage context:** Used in data usage pages and event timelines for navigating through time periods.

**Code structure:**

```tsx
return () => {};

    Mousetrap.bind(KEYBOARD_SHORTCUTS.NAVIGATE_FORWARD, navigateForward);

    return () => {
      Mousetrap.unbind(KEYBOARD_SHORTCUTS.NAVIGATE_BACK);
      Mousetrap.unbind(KEYBOARD_SHORTCUTS.NAVIGATE_FORWARD);
    };
  }, [currentDay, isInCurrentPeriod, navigateBack, navigateForward]);

  return (
    <nav className="time-range-paginator">
      <div className="w-60 text-nowrap text-center sm:me-3 sm:text-start">
        <span>
          {currentTimeRangeText(unitOfTime, currentDay.toISOString(), T)}
        </span>
        <span className="ms-3">
          {unitOfTime === UNIT_OF_TIME.WEEK &&
            weekRange(currentDay.toISOString())}
        </span>
```

---

### SimplePagination 🟢

**What it does:** Simple prev/next pagination with icon buttons.

**Props:**

```ts
type SimplePaginationProps = {
  hasPrev: boolean;
  hasNext: boolean;
  goToPrev: () => Promise<void>;
  goToNext: () => Promise<void>;
  top?: boolean;
  className?: string;
};
```

**EDS components used:** `IconButton`, `ICONS`

**Key Tailwind classes:** `flex justify-center gap-10 desktop:justify-end desktop:gap-2`

**Usage context:** Used in audit logs and other cursor-based paginated views.

**Code structure:**

```tsx
return (
    <div
      className={clsx(
        "eo-simple-pagination-container flex justify-center gap-10 desktop:justify-end desktop:gap-2",
        className,
        {
          "mt-4": !top,
        },
      )}
    >
      <IconButton
        ariaLabel={T("COMMON_PREVIOUS")}
        title={T("COMMON_PREVIOUS")}
        disabled={!hasPrev}
        onClick={goToPrev}
        icon={ICONS.FUNCTIONAL_CHEVRONLEFT}
      />
      <IconButton
        ariaLabel={T("COMMON_NEXT")}
        title={T("COMMON_NEXT")}
```

---

## Charts & Visualization

### Chart 🟢

**What it does:** Universal chart component built on Recharts that supports area, bar, line, radial bar, and composed chart types with configurable axes, tooltips, reference lines, brush, and legend.

**Props:**

```ts
type ChartProps<T> = {
  chartItems?: Array<Record<string, any>>;
  data: Array<T>;
  chartComponent: ChartComponents; // "area" | "bar" | "line" | "composed" | "radialBar"
  xAxis?: Record<string, any>;
  yAxis?: Record<string, any>;
  height?: number;
  width?: number | string;
  tooltip?: Record<string, any>;
  loading?: boolean;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseMove?: () => void;
  referenceLines?: Array<Record<string, any>> | null;
  referenceDots?: Array<Record<string, any>> | null;
  cartesianGrid?: Record<string, any> | null;
  referenceAreas?: Array<Record<string, any>> | null;
  brush?: Record<string, any> | null;
  children?: ReactElement | ((chartObject: any) => ReactNode);
  id?: string;
  radialBarOptions?: Record<string, any>;
  disableAnimation?: boolean;
  legendOptions?: Record<string, any> | null;
  title?: string;
  extraChartConfig?: Record<string, any>;
};
```

**EDS components used:** `Loader`, `useLayoutDirection`

**External dependencies:** `recharts` (XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Brush, Legend, etc.)

**Code structure:**

```tsx
<ResponsiveChartContainer width={width} height={height}>
  <ChartComponent data={data} style={{ direction }}>
    {cartesianGrid && <CartesianGrid />}
    {referenceLines?.map((config) => (
      <ReferenceLine />
    ))}
    {!tooltip.hide && <Tooltip />}
    {legendOptions && <Legend />}
    {brush && <Brush />}
    <XAxis /> <YAxis />
    {chartItems.map((item) => (
      <Component /* Area/Bar/Line */ />
    ))}
    {referenceDots?.map((config) => (
      <ReferenceDot />
    ))}
    {referenceAreas?.map((config) => (
      <ReferenceArea />
    ))}
  </ChartComponent>
</ResponsiveChartContainer>
```

**Usage context:** The primary charting component in Insight. Used for data usage charts, speed test charts, outage timelines, fleet metrics, and more.

**Key Tailwind classes:** `chart-brush`, `flex justify-center`

---

### ResponsiveChartContainer 🟢

**What it does:** Wrapper around Recharts' `ResponsiveContainer` with resize handling to fix width recalculation issues.

**Props:**

```ts
type ResponsiveChartContainerProps = {
  width?: number | string;
  children: ReactElement;
  [key: string]: any; // height, etc.
};
```

**EDS components used:** None

**External dependencies:** `recharts` (ResponsiveContainer)

**Usage context:** Used by Chart component to ensure charts resize correctly when the sidebar collapses/expands.

**Code structure:**

```tsx
return () => window.removeEventListener("resize", resizeHandler);
  }, [resizeHandler]);

  // Convert width to the type expected by recharts
  const rechartsWidth: number | `${number}%` | undefined =
    typeof width === "string" && width.endsWith("%")
      ? (width as `${number}%`)
      : typeof width === "string"
        ? parseFloat(width) || undefined
        : width;

  return (
    <RechartsResponsive ref={container} width={rechartsWidth} {...otherProps}>
      {children}
    </RechartsResponsive>
  );
}

export default ResponsiveChartContainer;

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### ChartsLegend (MultiCharts) 🟢

**What it does:** Horizontal legend with colored dots and labels for multi-series charts, with optional popover descriptions.

**Props:**

```ts
type Props = {
  className?: string;
  items: {
    label: string;
    color: string;
    multiColors?: string;
    legend?: string;
    extraProps?: any;
  }[];
};
```

**EDS components used:** `Popover`

**Code structure:**

```tsx
<div className="flex w-full justify-center">
  {items.map((item) => (
    <div className="mt-6 pe-4 ps-4 border-r">
      <Popover content={item.legend}>
        <div className="flex items-center gap-3">
          <DotIcon color={item.color} size={12} />
          <div className="text-base">{item.label}</div>
        </div>
      </Popover>
    </div>
  ))}
</div>
```

**Usage context:** Used alongside Chart components for multi-series data visualization.

**Key Tailwind classes:** `flex items-center gap-3`, `text-base`, `w-60`

---

### WorldMap 🔵

**What it does:** Interactive MapLibre GL map with clustered markers, zoom controls, and detail popups for geographic data visualization.

**Props:**

```ts
type Props = {
  locations: Locations[];
  detailPopup: (props: any) => ReactElement;
  totalKey: TotalKey;
};
```

**EDS components used:** `IconButton`, `ICONS`

**External dependencies:** `react-map-gl/maplibre`, `maplibre-gl`

**Key Tailwind classes:** `absolute bottom-0 right-0 my-4 me-4 ms-4 flex flex-col gap-2`

**Usage context:** Used in outage reports and fleet overview pages to show geographic distribution of networks/outages.

**Code structure:**

```tsx
return (
    <>
      <Source
        id="points-outages"
        type="geojson"
        data={outagesGeoJSON}
        cluster
        clusterMaxZoom={14}
        clusterRadius={100}
        clusterProperties={{
          total: ["+", ["get", "total", ["properties"]]],
        }}
      >
        <Layer {...pointsShadowLayer} />
        <Layer {...pointsLayer} />
        <Layer {...pointTotalLayer} />
      </Source>
      <Source
        id="cluster-outages"
        type="geojson"
```

---

## Feedback & Loading

### FullScreenLoading 🟢

**What it does:** Centered full-screen loading spinner with optional message.

**Props:**

```ts
type FullScreenLoadingProps = {
  loadingMsg?: string | null;
  loadingMsgType?: "horizontal" | "vertical";
};
```

**EDS components used:** `Loader`

**Key Tailwind classes:** `flex h-full w-full items-center justify-center`

**Usage context:** Used as the loading state for pages and major sections.

**Code structure:**

```tsx
return (
    <div
      data-testid="loader"
      className="flex h-full w-full items-center justify-center"
    >
      <Loader
        loadingMsg={
          loadingMsg !== null ? loadingMsg || T("COMMON_LOADING") : undefined
        }
        type={loadingMsgType}
      />
    </div>
  );
}

export default FullScreenLoading;

```

---

### TableSkeleton 🟢

**What it does:** Skeleton loading state for tables with animated placeholder rows matching column headers.

**Props:**

```ts
type Props = {
  columns?: {
    title: string;
    width?: number;
    className?: string;
    sorter?: boolean;
    filter?: boolean;
  }[];
  rowCount?: number;
  testId?: string;
};
```

**EDS components used:** `Icon`, `ICONS`, `Loader`

**Key Tailwind classes:** `w-full min-w-full table-auto rounded-xl border bg-white`, `h-4 w-3/4 animate-[pulse_0.6s_infinite] rounded bg-gray-200`

**Usage context:** Used as loading placeholder for network list tables and other data tables.

**Code structure:**

```tsx
return (
    <div
      id="churned-networks-list-skeleton"
      className="flex w-full flex-col overflow-scroll"
      data-testid={testId}
    >
      <table
        className={cx(
          "w-full min-w-full table-auto rounded-xl border bg-white",
          {
            "!min-w-[1443px]": columns.length > 5,
          },
        )}
      >
        <colgroup>
          {columns.map((col) => (
            <col
              key={uuidv4()}
              className={col.width ? `w-[${col.width}px]` : "w-[297px]"}
            />
```

---

### CardSkeleton (FullWidthCardSkeleton) 🟢

**What it does:** Skeleton loading state for full-width cards with animated placeholder blocks.

**Props:** None

**Key Tailwind classes:** `flex h-[6.625rem] flex-col gap-2 rounded-xl border border-layer-page-backplate bg-white py-4 pe-6 ps-6`, `eo-card-loading flex h-6 w-16 rounded-md`

**Usage context:** Used as loading placeholder for card-based layouts.

**Code structure:**

```tsx
return (
    <div
      className="flex h-[6.625rem] flex-col gap-2 rounded-xl border border-layer-page-backplate bg-white py-4 pe-6 ps-6"
      data-testid="full-width-card-skeleton"
    >
      <div className="flex w-full justify-between">
        <div className="flex gap-2">
          <div className="eo-card-loading flex h-6 w-16 rounded-md" />
          <div className="eo-card-loading flex h-6 w-[30rem] rounded-md" />
        </div>
        <div className="eo-card-loading flex h-6 w-[5.5rem] rounded-md" />
      </div>
      <div className="eo-card-loading flex h-10 w-full rounded-md" />
    </div>
  );
}

export default FullWidthCardSkeleton;

```

---

### CardSkeleton (SimpleEditableCardSkeleton) 🟢

**What it does:** Skeleton loading state for editable cards with title and button placeholders.

**Props:** None

**Key Tailwind classes:** `flex h-20 flex-row gap-2 rounded-xl border border-layer-page-backplate bg-white py-2 pe-4 ps-4 md:h-24 md:py-4 md:pe-6 md:ps-6`, `eo-card-loading my-2 flex h-5 w-32 rounded-md`

**Usage context:** Used as loading placeholder for EditableCard components.

**Code structure:**

```tsx
return (
    <div
      className="flex h-[6.625rem] flex-col gap-2 rounded-xl border border-layer-page-backplate bg-white py-4 pe-6 ps-6"
      data-testid="full-width-card-skeleton"
    >
      <div className="flex w-full justify-between">
        <div className="flex gap-2">
          <div className="eo-card-loading flex h-6 w-16 rounded-md" />
          <div className="eo-card-loading flex h-6 w-[30rem] rounded-md" />
        </div>
        <div className="eo-card-loading flex h-6 w-[5.5rem] rounded-md" />
      </div>
      <div className="eo-card-loading flex h-10 w-full rounded-md" />
    </div>
  );
}

export default FullWidthCardSkeleton;

```

---

### PageErrorBoundary 🟢

**What it does:** Full-page error boundary with 500 error display, Sentry error ID, support link, and retry button.

**Props:**

```ts
{ error: Error & { digest?: string }; reset: () => void }
```

**EDS components used:** `Button`, `Icon`, `ICONS`

**Key Tailwind classes:** `flex h-full w-full flex-col items-center justify-center`, `flex max-w-md flex-col items-center justify-center text-center`

**Usage context:** Used as the Next.js `error.tsx` boundary for page-level errors.

**Code structure:**

```tsx
return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      data-testid="page-error-boundary"
    >
      <div
        data-testid="loader-upper-border"
        className="fixed left-0 top-16 z-10 w-full overflow-hidden"
      >
        <div className="h-4 w-full rounded-t-2xl outline outline-8 outline-offset-0 outline-Midnight-midnight-9" />
      </div>
      <div className="flex max-w-md flex-col items-center justify-center text-center">
        <h1 className="text-text-primary">500</h1>
        <h2>
          <div className="flex h-fit items-center justify-center gap-2">
            <Icon icon={ICONS.FUNCTIONAL_ISSUEREGULAR} />
            <span className="text-xl text-text-primary">
              {T("COMMON_SOMETHING_WENT_WRONG")}
            </span>
          </div>
```

---

### ErrorBoundary 🟢

**What it does:** React error boundary wrapper with configurable fallback UI, supporting both page and modal contexts.

**Props:**

```ts
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  minHeightPx?: number;
  minWidthPx?: number;
  onReset?: () => void;
  onClose?: () => void;
  modal?: boolean;
  isModalOpen?: boolean;
}
```

**EDS components used:** None (custom ErrorFallback component)

**Usage context:** Wraps individual sections and modals to prevent cascading failures.

**Code structure:**

```tsx
return (
    <ErrorBoundaryGenerator fallback={errorFallback}>
      {children}
    </ErrorBoundaryGenerator>
  );
}

export default ErrorBoundary;

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

## Utility & Misc

### Copy 🟢

**What it does:** Wraps any content to make it copyable on click, with tooltip feedback and toast notification. Handles both plain text and link children differently.

**Props:**

```ts
type CopyProps = {
  className?: string;
  textToCopy?: string | null;
  tooltipPosition?: TooltipPlacement;
  toastText?: string;
  children?: string | ReactElement | null;
};
```

**EDS components used:** `ICONS`, `TinyIconButton`, `ToastType`, `Tooltip`, `useToast`

**Key Tailwind classes:** `-mx-1 cursor-pointer rounded-md px-1 hover:bg-layer-page-backplate`

**Code structure:**

```tsx
// For plain text children — entire block is clickable
<Tooltip title={isCopied ? "Copied" : "Copy"}>
  <button className="cursor-pointer rounded-md hover:bg-layer-page-backplate" onClick={handleOnCopy}>
    {children}
  </button>
</Tooltip>

// For link children — only the copy icon is clickable
<button>
  {children}
  <TinyIconButton icon={ICONS.FUNCTIONAL_COPY} onClick={handleOnCopy} />
</button>
```

**Usage context:** Used extensively throughout Insight to make text copyable (serial numbers, MAC addresses, IPs, network names).

---

### CopySnapshot 🔵

**What it does:** Icon button that copies a text snapshot to clipboard with keyboard shortcut support (Mousetrap).

**Props:**

```ts
type Props = {
  textToCopy: string;
  snapshotName: string;
};
```

**EDS components used:** `IconButton`, `ICONS`, `ToastType`, `useToast`

**Usage context:** Used in network detail pages to copy a full snapshot of network data.

**Code structure:**

```tsx
return () => {
      Mousetrap.unbind(KEYBOARD_SHORTCUTS.COPY_SNAPSHOT);
    };
  }, [onCopy]);

  return (
    <IconButton
      onClick={onCopy}
      ariaLabel={T("COPY_SNAPSHOT")}
      icon={ICONS.FUNCTIONAL_COPY}
      name={T("COPY_SNAPSHOT")}
      title={
        isCopied
          ? T("COPY_COPIED")
          : T("COPY_COPY_SNAPSHOT", {
              snapshotName: snapshotName.toLowerCase(),
            })
      }
      type="text"
    />
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### HintText 🟢

**What it does:** Text with an info icon tooltip for contextual help.

**Props:**

```ts
interface HintTextProps {
  text: string | ReactNode;
  helpText?: string;
}
```

**EDS components used:** `Tooltip`, `TinyIconButton`, `ICONS`

**Code structure:**

```tsx
<div className="flex flex-row flex-nowrap items-center">
  <div className="mr-4 inline-block">{text}</div>
  {helpText && (
    <Tooltip title={helpText}>
      <TinyIconButton icon={ICONS.FUNCTIONAL_INFOFILLED} />
    </Tooltip>
  )}
</div>
```

**Usage context:** Used in EditableCard titles and form labels to provide contextual help.

**Key Tailwind classes:** `flex flex-row flex-nowrap content-normal items-center`, `mr-4 inline-block`, `h-[24px]`

---

### HiddenInfo 🟢

**What it does:** Masked text with a show/hide toggle button (eye icon).

**Props:**

```ts
interface HiddenInfoProps {
  info: string;
  mask?: string; // default: "•••••••••••••••"
}
```

**EDS components used:** `TinyIconButton`, `ICONS`

**Key Tailwind classes:** `flex h-6 items-center`, `me-1 text-base font-normal leading-6 text-text-secondary`

**Usage context:** Used for sensitive data like passwords, API keys in settings pages.

**Code structure:**

```tsx
return (
    <div className="flex h-6 items-center">
      <span className="me-1 text-base font-normal leading-6 text-text-secondary">
        {isHidden || disabled ? mask : info}
      </span>
      {!disabled && (
        <TinyIconButton
          name={T("SHOW_PASSWORD")}
          ariaLabel={T("SHOW_PASSWORD")}
          title={T("SHOW_PASSWORD")}
          icon={isHidden ? ICONS.FUNCTIONAL_EYE : ICONS.FUNCTIONAL_EYEOFF}
          onClick={() => setIsHidden(!isHidden)}
        />
      )}
    </div>
  );
}

```

---

### InfiniteScroll 🟢

**What it does:** Intersection Observer-based infinite scroll that triggers `fetchMore` when the sentinel element enters the viewport.

**Props:**

```ts
type InfiniteScrollProps = {
  fetchMore: FetchMoreFunction;
  paramsRange: ParamsRange;
  previousParamsRange: ParamsRange;
  loading?: boolean;
  compareParam?: string;
  rootMargin?: string;
};
```

**EDS components used:** `Loader`

**Code structure:**

```tsx
<>
  {children}
  <div ref={loadMoreRef} data-reference-to-scroll={JSON.stringify(paramsRange)}>
    {loading && <Loader />}
  </div>
</>
```

**Usage context:** Used in event streams and long lists that load data incrementally.

**Key Tailwind classes:** `mt-2 flex justify-center`

---

### TextDivider 🟢

**What it does:** Horizontal rule with centered text label.

**Props:**

```ts
{
  text: string;
}
```

**EDS components used:** None

**Key Tailwind classes:** `flex w-full items-center`, `px-2 text-sm font-medium text-text-primary`

**Code structure:**

```tsx
<div className="flex w-full items-center">
  <hr className="w-full border-border-layer-page" />
  <span className="px-2 text-sm font-medium text-text-primary">{text}</span>
  <hr className="w-full" />
</div>
```

**Usage context:** Used to separate sections within forms and detail views.

---

### ThreeDotsMenu 🟢

**What it does:** Horizontal ellipsis icon button that opens a dropdown menu of actions.

**Props:**

```ts
type ThreeDotsMenuProps = {
  menuItems: { key: string; title: string; action: () => void }[];
  disabledMenu?: boolean;
  dropdownRef?: MutableRefObject<HTMLSelectElement | null>;
  title?: string;
};
```

**EDS components used:** `DropdownIconButton`, `ICONS`

**Code structure:**

```tsx
<DropdownIconButton
  type="text"
  icon={ICONS.FUNCTIONAL_ELLIPSESHORIZONTAL}
  items={menuItems.map(({ key, title, action }) => ({
    key,
    label: <button onClick={action}>{title}</button>,
  }))}
/>
```

**Usage context:** Used in card headers, table rows, and list items for contextual actions.

**Key Tailwind classes:** `flex w-full gap-4`

---

### TooltipContent 🟢

**What it does:** Structured tooltip/popover content with title, subtitle, and compound sub-components (TextContent, HighlightedContent).

**Props:**

```ts
type TooltipContentProps = {
  title?: ReactNode | string;
  subtitle?: string;
  size?: "small" | "medium" | "large" | "auto";
  children?: ReactNode | ReactNode[];
  noBorder?: boolean;
  style?: object;
};
```

**EDS components used:** None

**Key Tailwind classes:** `min-w-44` (auto), `w-44` (small), `w-60` (medium), `w-80` (large), `px-4 border border-solid rounded-md bg-layer-page`

**Compound components:**

- `TooltipContent.TextContent` — `<div className="px-0 py-1">`
- `TooltipContent.HighlightedContent` — `<div className="bg-layer-page-backplate p-4">`

**Usage context:** Used inside Tooltip/Popover components for rich tooltip content (eero details, chart data points).

**Code structure:**

```tsx
return (
    <div
      className={clsx(
        { "min-w-44": size === "auto" },
        { "w-44": size === "small" },
        { "w-60": size === "medium" },
        { "w-80": size === "large" },
        "px-4",
        "border",
        "border-solid",
        "rounded-md",
        "bg-layer-page",
      )}
    >
      {title && (
        <header
          className={clsx(
            "border-b-solid",
            "pt-4",
            { "border-b-0 border-b-background-page pb-0": noBorder },
```

---

### DropdownActions 🟢

**What it does:** Renders action buttons — single button for one action, dropdown menu for multiple actions. Supports both dashed (icon) and link (text) variants.

**Props:**

```ts
interface DropdownActionsProps {
  menuOptions: DropdownActionsMenuOption[];
  dispatch: (action: string) => void;
  dashed?: boolean;
  handleFocus?: (ref: any) => void;
}
```

**EDS components used:** `Button`, `DropdownButton`, `DropdownIconButton`, `ICONS`

**Usage context:** Used in card headers and section headers for contextual actions.

**Code structure:**

```tsx
return (
      <Button
        type="link"
        leftIcon={icon}
        label={text}
        className={className}
        onClick={() => {
          onClick();
          if (actionDropdown && handleFocus) {
            handleFocus(actionDropdown);
          }
        }}
        key={text}
        ref={actionDropdown}
      />
    );
  });
}

export default DropdownActions;
```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### HomeSearchTips 🔵

**What it does:** Displays search tips and searchable attributes on the home page.

**Props:**

```ts
interface Props {
  header: string;
}
```

**EDS components used:** None

**Usage context:** Shown on the Insight home page when no search has been performed.

**Key Tailwind classes:** `text-2xl desktop:text-4xl`, `flex flex-col gap-2 text-xl`, `xs:hidden`, `ms-4 mt-4 list-disc`, `my-2`, `flex flex-col justify-start gap-8 px-8`

**Code structure:**

```tsx
return (
    <section className={clsx("flex flex-col justify-start gap-8 px-8")}>
      {header && <h2 className="text-2xl desktop:text-4xl">{header}</h2>}
      <div className="flex flex-col gap-2 text-xl">
        <div className="xs:hidden">
          {T("SEARCH_USE_KEY_FOR_QUICK_SEARCH", {
            key: KEYBOARD_SHORTCUTS.GLOBAL_SEARCH,
          })}
        </div>
        <div>
          <div>{T("SEARCH_YOU_CAN_SEARCH_VIA_FOLLOWING_ATTRIBUTES")}</div>
          <ul className="ms-4 mt-4 list-disc">
            <li className="my-2">{T("CUSTOMER_CUSTOMER_NAME")}</li>
            <li className="my-2">{T("COMMON_EMAIL")}</li>
            <li className="my-2">{T("COMMON_PHONE_NUMBER")}</li>
            <li className="my-2">{T("SEARCH_NETWORK_NAME")}</li>
            <li className="my-2">{T("NETWORK_DETAILS_HOME_IDENTIFIER")}</li>
            <li className="my-2">{T("SEARCH_CUSTOMER_ACCOUNT_IDENTIFIER")}</li>
            <li className="my-2">{T("NETWORK_DETAILS_MAC_ADDRESS")}</li>
            <li className="my-2">{T("ADD_EERO_SERIAL_NUMBER")}</li>
```

---

### UnsupportedModelCard 🔵

**What it does:** Error card shown when an unsupported eero model is detected during network creation, with a link to supported models.

**Props:**

```ts
interface UnsupportedModelCard {
  onSeeSupportedEeros: (e: any) => void;
  networkType?: Maybe<string>;
}
```

**EDS components used:** `Button`

**Key Tailwind classes:** `mt-4 items-center justify-center rounded-md bg-Red-red-1 py-4 pe-4 ps-4 text-start leading-4`

**Usage context:** Used in network creation flow.

**Code structure:**

```tsx
return (
    <div className="mt-4 items-center justify-center rounded-md bg-Red-red-1 py-4 pe-4 ps-4 text-start leading-4">
      <p role="alert">{getLabelUnsupportedModel()}</p>
      <Button
        onClick={onSeeSupportedEeros}
        className="mt-1 text-wrap text-start"
        type="link"
        label={getLabelBtn()}
      />
    </div>
  );
}
export default UnsupportedModelCard;

```

---

## Domain-Specific

These components are tightly coupled to Insight business logic and are unlikely candidates for EDS componentization. They are documented here for context when building features that interact with these domains.

### AuditLogs (AuditlogTable) 🔵

**What it does:** Full audit log viewer with date range filtering, pagination, and columns for date, entity, event, role, and source.

**EDS components used:** `AriaLiveRegion`, `useAriaLiveRegion`, `Card`, `PageHeader`, `Table`, `RangePicker`

**Key patterns:** Uses SimplePagination, cursor-based pagination, date range filtering with RangePicker, and responsive column widths based on layout context.

**Usage context:** Organization-level audit log page.

**Key Tailwind classes:** `top-pagination justify-end gap-2`, `audit-logs-page-header`, `mb-8 mt-2`, `flex justify-between gap-4`, `gap-2`, `audit-log-table mt-8 pb-14`

**Code structure:**

```tsx
return (
    <SimplePagination
      goToNext={goToNext}
      hasPrev={hasPrev}
      goToPrev={goToPrev}
      hasNext={hasNext}
      top
      className={className}
    />
  );
}

type AuditlogTableProps = {
  entityType: AuditLogEntityType;
  id: string | null;
  getActions?: string | boolean | undefined;
  context?: Record<string, any>;
  title?: string;
  subtitle?: string[];
  backRoute?: URL;
```

---

### Chatbot (ChatbotSidebar) 🔵

**What it does:** Slide-out AI assistant sidebar with chat interface, expand/collapse, new chat, and more options menu.

**EDS components used:** `Icon`, `IconButton`, `ICONS`

**Key patterns:** Uses context providers for virtual agent state, keyboard shortcuts, localStorage for chat persistence.

**Usage context:** Available globally via the Header's AI assistant button.

**Key Tailwind classes:** `flex h-full flex-col p-2`, `flex h-full flex-col overflow-clip rounded-xl border border-border-background-page bg-layer-page`, `flex items-center justify-between border-b border-border-background-page py-1 pe-1 ps-5`, `flex items-center gap-2`, `text-base font-medium text-text-primary`, `eero-chat-header-buttons flex w-14 items-center justify-end`

**Code structure:**

```tsx
return (
    <div
      id="virtual-agent"
      data-testid="virtual-agent"
      className={`flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out ${width} absolute right-0 rounded-tl-xl lg:relative`}
    >
      <div
        className="flex h-full flex-col p-2"
        data-testid="virtual-agent-frame"
      >
        <div
          className="flex h-full flex-col overflow-clip rounded-xl border border-border-background-page bg-layer-page"
          data-testid="virtual-agent-panel"
        >
          <div className="flex items-center justify-between border-b border-border-background-page py-1 pe-1 ps-5">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-text-primary">
                {T("COMMON_ASSISTANT")}
              </span>
              <Icon icon={ICONS.FUNCTIONAL16X16_INSIGHTAI} />
```

---

### DhcpOptions (DhcpOptionsCard) 🔵

**What it does:** Card for viewing and editing DHCP options with form validation.

**EDS components used:** `Card`, `Button`

**Key patterns:** Uses EditableCard pattern, Form from antd, and custom sub-components for header and edit views.

**Usage context:** Network settings page.

**Key Tailwind classes:** `w-full`, `mt-4 flex justify-end`, `mr-2`, `dhcp-options-card w-full`, `flex w-full items-center ps-6 md:flex-wrap lg:flex-nowrap`, `flex items-center`, `ms-auto flex items-center justify-end`, `flex grow-0 gap-2`

**Code structure:**

```tsx
return (
    <div className="w-full" ref={containerRef}>
      {isEditing ? (
        <EditableCard
          title={<CardTitle tooltipMessage={tooltipMessage} />}
          editDisabled={editDisabled}
          className="w-full"
          disabled={editDisabled || !!fetchError || loading || !!error}
          hideButtonOnDisabled
          buttonText={T("COMMON_CANCEL")}
          openEditModal={handleCancel}
          loading={updateLoading}
        >
          <DhcpOptionsEdit
            loading={loading}
            error={error}
            dhcpOptions={dhcpOptions}
            form={form}
            enabledOptions={enabledOptions}
          />
```

---

### EeroFirmware 🔵

**What it does:** Displays eero firmware version with update status icon and tooltip.

**Props:**

```ts
interface EeroFirmwareProps {
  eeroId: string;
  updateAvailable: boolean;
  version: string;
  updating: UpdatingStatusType;
  state?: EeroState;
}
```

**EDS components used:** `Tooltip`, `Loader`

**Usage context:** Used in eero detail cards and eero list tables.

**Key Tailwind classes:** `flex`, `firmware-version flex items-center gap-1`, `text-sm font-normal text-text-secondary`, `mb-1`, `flex items-center justify-center gap-1`

**Code structure:**

```tsx
return (
    <div className="flex" data-testid={`firmware-container__${eeroId}`}>
      {!isUpdating && (
        <Tooltip placement="bottom" title={T(getTooltipTextReference(status))}>
          <div className="firmware-version flex items-center gap-1">
            <span className="text-sm font-normal text-text-secondary">
              {version}
            </span>
            <div className="mb-1">{getStatusIcon(status)}</div>
          </div>
        </Tooltip>
      )}
      {isUpdating && (
        <div className="flex items-center justify-center gap-1">
          <Loader />
          <div className="text-sm font-normal text-text-secondary">
            {T(getDescriptionReference(updating))}
          </div>
        </div>
      )}
```

---

### EeroPorts 🔵

**What it does:** Suite of components for displaying eero ethernet port status, cable check results, and port details.

**Sub-components:** `EeroPortsCards`, `EeroPortsDetails`, `EeroPort`, `EeroPortIcon`, `EeroPortStatus`, `EeroPortTooltip`, `EeroPortDetailsContent`, `CablesCheckResult`, `ActionsColumn`

**EDS components used:** `Card`, `Button`, `Icon`, `ICONS`, `Tooltip`, `Modal`

**Usage context:** Eero detail page — ethernet ports section.

**Key Tailwind classes:** `flex flex-row flex-nowrap content-normal items-center justify-start`

**Code structure:**

```tsx
return (
    <div className="flex flex-row flex-nowrap content-normal items-center justify-start">
      <DropdownIconButton
        ref={dropdownRef}
        ariaLabel="actions"
        items={menuItems}
        name="actionsOverPortTable"
        onClick={handleMenuClick}
        type="text"
        disabled={items?.length === 0}
        placement="bottomRight"
        title={T("COMMON_ACTIONS")}
        loading={false}
      />
    </div>
  );
}

export default ActionsColumn;

```

---

### FleetActivation (ActivationsProvider) 🔵

**What it does:** Context provider for fleet activation data with polling queries for network activations and snapshots.

**Props:**

```ts
type Props = {
  children: ReactNode;
  initialPeriod?: PeriodKeys;
  initialNetworkTypes?: NetworkTypeValues[];
  skipNetworkSnapshotQuery?: boolean;
};
```

**EDS components used:** `AriaLiveRegion`, `useAriaLiveRegion`

**Key patterns:** Uses Apollo polling queries, context provider pattern, PeriodFilter and NetworkTypeFilter for filtering.

**Usage context:** Fleet summary / activations dashboard.

**Code structure:**

```tsx
return (
    <ActivationsSectionContext.Provider value={activationsContextValue}>
      <AriaLiveRegion
        announcement={announcement}
        screenReaderTitle={T("COMMON_ANNOUNCEMENT_REGION")}
      />
      {children}
    </ActivationsSectionContext.Provider>
  );
}

export default ActivationsProvider;

```

**Key Tailwind classes:** None — pure WDS wrapper, styling comes from the wrapped component.

---

### IPs 🟢

**What it does:** Displays a list of IP addresses with copy functionality and optional collapsible popover for multiple IPs.

**Props:**

```ts
interface IPsProps {
  ips: string[];
  collapsible?: boolean;
}
```

**EDS components used:** `CopyableText`, `Button`, `Popover`

**Usage context:** Used in network detail pages and eero detail pages to display IP addresses.

**Key Tailwind classes:** `!text-sm text-text-secondary`, `my-2 w-full`, `relative flex flex-col items-start`, `flex flex-col items-start`

**Code structure:**

```tsx
return (
      <div className="relative flex flex-col items-start">
        <Popover trigger="click" content={ipList} placement="bottomLeft">
          <Button type="link" label={T("EXPAND_ALL_IPS")} />
        </Popover>
      </div>
    );
  }

  return <div className="flex flex-col items-start">{ipList}</div>;
}

```

---

### JobList 🔵

**What it does:** Displays a list of background jobs (imports, exports) with status tracking, report viewing, and polling for updates.

**Sub-components:** `JobListCard`, `JobListItem`, `ReportModal`

**EDS components used:** `Card`, `Button`, `Modal`, `Loader`

**Usage context:** Organization pages for tracking bulk import/export jobs.

**Key Tailwind classes:** `flex w-full flex-col`, `flex w-full items-center justify-center`

**Code structure:**

```tsx
return (
  <div className="flex w-full flex-col">
    <InfiniteScroll
      fetchMore={fetchMoreData}
      compareParam="offset"
      paramsRange={paramsRange}
      previousParamsRange={previousParamsRange}
      loading={!!next && loading}
    >
      <JobListCard
        importJobType={importJobType}
        jobs={jobs}
        openImportModal={openImportModal}
        organizationId={organizationId}
        title={title}
        generateSummary={generateSummary}
      />
    </InfiniteScroll>
  </div>
);
```

---

### LinkToOwner 🔵

**What it does:** Modal form for linking a network to an owner via email or phone, with validation and rebranding support.

**Props:**

```ts
type LinkToOwnerProps = {
  onClose: () => void;
  onLink: (data: LinkToOwnerRequestData) => Promise<any>;
  network: LinkToOwnerNetwork | null;
  visible?: boolean;
  type?: string;
  openHoldingStateModal?: () => void;
  openNetworkLimitExceeded?: () => void;
  organizationId?: Maybe<string | number>;
};
```

**EDS components used:** `DatePicker`, `Modal`

**Usage context:** Network detail page — transfer ownership flow.

**Key Tailwind classes:** `link-to-owner-modal`, `font-medium`, `mb-4 mt-4`, `text-text-error`, `text-text-tertiary`, `border-t border-gray-300/[65] pt-4`, `mb-2 font-medium`, `rounded bg-gray-50 py-2 pe-2 ps-2`

**Code structure:**

```tsx
return (
    <Modal
      data-testid="link-to-owner-modal"
      onCancel={() => {
        onClose();
        if (focusPointRef) {
          focusPointRef?.current?.focus();
          setFocusPointRef(null);
        }
        setFirstRender(true);
      }}
      cancelText={T("COMMON_CANCEL")}
      okText={rebranding.okText}
      onOk={onSubmit}
      isOpen={visible}
      destroyOnClose
      className="link-to-owner-modal"
      title={rebranding.title}
      okButtonProps={{ loading }}
      focusTriggerAfterClose={false}
```

---

### MetricsAlerts 🔵

**What it does:** Displays organization-level metrics alerts with configurable thresholds and notification settings.

**EDS components used:** Various (Card, Button, Modal, Input, etc.)

**Usage context:** Organization settings — alerts configuration.

**Key Tailwind classes:** `items-top flex flex-1 justify-center pt-24`, `mt-6 flex flex-col items-center justify-center py-12`, `text-center text-text-secondary`, `mt-6 flex flex-col gap-6 pb-6`, `eo-mobile-container flex h-full flex-col`, `flex flex-1 items-start justify-center pt-24`, `max-w-8/12 my-4`, `mt-6 rounded-xl border bg-white p-4`

**Code structure:**

```tsx
return (
      <div
        className="items-top flex flex-1 justify-center pt-24"
        data-testid="alerts-empty-container"
      >
        <AlertsEmptyState
          onAddAlert={onAddAlert}
          canCreate={alertAbilities.canCreate}
        />
      </div>
    );
  }

  if (!hasFilteredAlerts) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12">
        <p className="text-center text-text-secondary">
          {T("NO_DATA_NO_RESULTS_FOUND")}
        </p>
      </div>
```

---

### MigrationProgress 🔵

**What it does:** Modal showing network migration progress with polling for status updates.

**EDS components used:** `Modal` (via sub-components)

**Usage context:** Triggered from Header during active migrations.

**Key Tailwind classes:** `text-text-primary`, `flex flex-col gap-4`, `rounded-lg bg-layer-page-hover p-4`, `mb-3 flex items-center justify-between`, `text-sm font-medium text-text-primary`, `flex h-4 w-full overflow-hidden rounded-full`, `mt-3 flex flex-wrap items-center gap-x-4 gap-y-1`, `flex items-center gap-1.5`

**Code structure:**

```tsx
return (
    <Modal
      open={isVisible}
      onCancel={closeModal}
      title={
        <span className="text-text-primary">Next.js Migration Progress</span>
      }
      footer={null}
      width={700}
    >
      <div className="flex flex-col gap-4">
        {/* Stacked progress bar */}
        <div className="rounded-lg bg-layer-page-hover p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">
              Overall Progress
            </p>
            <span className="text-sm font-medium text-text-primary">
              {uniqueMigrated} / {totalRoutes} ({overallPercentage}%)
            </span>
```

---

### MobileRoaming (MobileRoamingCard) 🔵

**What it does:** Card for managing Passpoint/Hotspot 2.0 mobile roaming configurations with table of configs and CRUD modals.

**Sub-components:** `MobileRoamingTable`, `MobileRoamingConfigModal`, `MobileRoamingDeleteModal`, `FormFields`, `FormRow`

**EDS components used:** `Button`, `useToast`, `ToastType`

**Usage context:** Organization settings — mobile roaming configuration.

**Key Tailwind classes:** `text-sm text-text-primary`, `mb-0`

**Code structure:**

```tsx
return (
    <div
      className={`${className} flex flex-col gap-2`}
      data-testid={`${testId}`}
    >
      {!hideLabel && (
        <span className="text-sm text-text-primary">
          {required && <RequiredMark />}
          {label}
        </span>
      )}
      <Form.Item name={name} rules={rules} className="mb-0">
        {type === InputType.PASSWORD ? (
          <InputPassword placeholder={placeholder} disabled={isLoading} />
        ) : (
          <CompleteInput
            validationRegex={validationRegex}
            type={type}
            placeholder={placeholder}
            required={required}
```

---

### MobileRoamingSettings (MobileRoamingSettingsCard) 🔵

**What it does:** Card for network-level mobile roaming settings with inline editing, configuration selection, and status toggle.

**Sub-components:** `MobileRoamingTitle`, `MobileRoamingSubtitle`, `ConfigurationSelectField`, `ConfigurationInfoButton`, `MobileRoamingStatusSwitch`

**EDS components used:** `Button`, `useToast`, `ToastType`

**Usage context:** Network settings page — mobile roaming section.

**Key Tailwind classes:** `flex flex-col items-start`, `font-medium text-text-primary`, `cursor-pointer self-start font-medium text-Link-text+icon-link-rest`

**Code structure:**

```tsx
return (
    <div className="flex flex-col items-start">
      {showLabel && (
        <p className="font-medium text-text-primary">
          {T("COMMON_CONFIGURATION")}
        </p>
      )}
      <Button
        type="link"
        className="cursor-pointer self-start font-medium text-Link-text+icon-link-rest"
        onClick={onClick}
        label={configName}
      />
    </div>
  );
}

```

---

### PPPoEV2 🔵

**What it does:** Card for viewing and editing PPPoE (Point-to-Point Protocol over Ethernet) settings with inline edit mode.

**Props:**

```ts
type PPPoEV2Props = {
  field?: string;
  readOnly: boolean;
  pppoeWan?: boolean;
  onUpdate: () => void;
  pppoeUsername?: string;
  organizationId?: string;
};
```

**EDS components used:** `Card`, `Button`, `Divider`, `Switch`, `Radio`, `Input`, `InputPassword`, `useToast`, `ToastType`

**Key patterns:** Uses EditableInline pattern, Form from antd, and custom sub-components (PPPoEValues, PPPoEInfo).

**Usage context:** Network settings page — PPPoE configuration.

**Key Tailwind classes:** `flex flex-row items-center gap-2`

**Code structure:**

```tsx
return <Loader type="horizontal" loadingMsg="" />;
  }

  return credentials ? (
    <div className="flex flex-row items-center gap-2">
      <span>{T("COMMON_ENABLED")}</span>
      <span>
        <Icon icon={ICONS.FUNCTIONAL16X16_SUCCESSSMALL} />
      </span>
    </div>
  ) : (
    T("COMMON_DISABLED")
  );
}

```

---

### Radius (RadiusCard) 🔵

**What it does:** Card for managing RADIUS authentication settings with certificate upload, configuration modals, and inline editing.

**Sub-components:** `RadiusConfigModal`, `RadiusBundleCaModal`, `FormFields`, `FormRow`, `HelpPopover`, `LoadingContent`, `BundleCaLoadingContent`

**EDS components used:** `Card`, `Button`, `Divider`, `Input`, `Switch`, `useToast`, `ToastType`

**Usage context:** Organization settings — RADIUS authentication configuration.

**Key Tailwind classes:** `flex flex-col gap-2`, `h-6 w-full animate-pulse rounded bg-gray-300`, `flex gap-2 overflow-y-auto rounded bg-gray-100 p-3`, `flex max-h-80 flex-1 flex-col gap-2`, `h-3 w-11/12 animate-pulse rounded bg-gray-300`

**Code structure:**

```tsx
return (
    <div className="flex flex-col gap-2" data-testid="bundle-ca-skeleton">
      <div className="h-6 w-full animate-pulse rounded bg-gray-300" />
      <div className="flex gap-2 overflow-y-auto rounded bg-gray-100 p-3">
        <div className="flex max-h-80 flex-1 flex-col gap-2">
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-300" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-300" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-300" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-300" />
        </div>
      </div>
    </div>
  );
}

export default BundleCaLoadingContent;

```

---

### VlanTaggingV2 🔵

**What it does:** Card for viewing and editing VLAN tagging settings at organization or network level with inline edit mode.

**Props:**

```ts
type VlanTaggingV2Props = {
  id?: string;
  vlanTag?: string;
  readOnly?: boolean;
  vlanTagLevel: LevelValues;
  customEmptyLabel?: string;
};
```

**EDS components used:** `Card`, `Button`, `Divider`, `Input`, `Loader`, `Icon`, `Switch`, `ICONS`, `useToast`, `ToastType`

**Usage context:** Network settings and organization settings — VLAN configuration.

**Key Tailwind classes:** `flex w-full items-center justify-between`, `ms-1 flex flex-row items-center gap-2`, `flex gap-2`, `eero-insight-vlan-tagging-container`, `flex flex-row items-center justify-between`, `flex flex-row phoneMax:flex-col`, `w-[244px]`, `text-base font-medium`

**Code structure:**

```tsx
return (
    <Card
      {...getEditControls}
      className="eero-insight-vlan-tagging-container"
      ref={cardRef}
    >
      {!edit ? (
        <section className="flex flex-row items-center justify-between">
          <div className="flex flex-row phoneMax:flex-col">
            <div className="w-[244px]">
              <div className="text-base font-medium">{T("VLAN_TAG_LABEL")}</div>
              <div className="text-sm font-normal text-text-secondary">
                <FeatureActivatedInfo loading={loading} vlanTag={vlanTag} />
              </div>
            </div>
            <Divider
              className="border-1 me-6 h-12 border-border-layer-page phoneMax:hidden"
              type="vertical"
            />
            <div className="phoneMax:mt-4">
```

---

### AssociatedOrganization 🔵

**What it does:** Displays the organization associated with a network, with modals for reassignment and viewing related organizations.

**Sub-components:** `CurrentlyAssignedTag`, `ReassignModal`, `RelatedOrganizationsModal`

**Usage context:** Network detail page — organization association section.

**Key Tailwind classes:** `flex flex-row items-center justify-between`, `flex w-full flex-row phoneMax:flex-col`, `flex w-[244px] items-center`, `text-base font-medium text-text-primary`, `border-1 me-6 h-12 border-border-layer-page phoneMax:hidden`, `border-1 mx-0 my-4 hidden border-border-layer-page phoneMax:block`, `associated-buttons flex flex-grow items-center justify-between phoneMax:w-auto`

**Code structure:**

```tsx
return (
    <>
      <Card data-testid="associated-organization-card">
        <section className="flex flex-row items-center justify-between">
          <div className="flex w-full flex-row phoneMax:flex-col">
            <div className="flex w-[244px] items-center">
              <div className="text-base font-medium text-text-primary">
                {organizationName}
              </div>
            </div>
            <Divider
              className="border-1 me-6 h-12 border-border-layer-page phoneMax:hidden"
              type="vertical"
            />
            <Divider
              className="border-1 mx-0 my-4 hidden border-border-layer-page phoneMax:block"
              type="horizontal"
            />
            <div className="associated-buttons flex flex-grow items-center justify-between phoneMax:w-auto">
              {relatedOrgsButton}
```

---

## Summary: EDS Componentization Candidates

The following Insight components are **generic enough** to be candidates for inclusion in the eero Design System:

| Priority | Component                                         | Reason                                                                             |
| -------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| High     | `EditableCard`                                    | Used in 50+ places, standard card-with-edit pattern                                |
| High     | `ExpandableCard`                                  | Used in all list views, standard expand/collapse pattern                           |
| High     | `SimpleData`                                      | The primary key-value display — used everywhere                                    |
| High     | `ExpandedCardContent`                             | Standard responsive grid for card details                                          |
| High     | `DataTable`                                       | Full-featured table with card/table toggle, pagination                             |
| High     | `PageSection`                                     | Standard page section with title and actions                                       |
| Medium   | `Chart`                                           | Universal charting wrapper (may stay as Insight-specific due to Recharts coupling) |
| Medium   | `PeriodFilter`                                    | Segmented + mobile dropdown pattern for time periods                               |
| Medium   | `PeriodSelector` / `PeriodSelectorWithDatePicker` | Time period selection with custom date range                                       |
| Medium   | `Copy`                                            | Copyable text wrapper with toast feedback                                          |
| Medium   | `ThreeDotsMenu`                                   | Standard contextual menu pattern                                                   |
| Medium   | `SortMenu`                                        | Sort dropdown with selected indicator                                              |
| Medium   | `TableSkeleton` / `CardSkeleton`                  | Loading skeleton patterns                                                          |
| Medium   | `FullScreenLoading`                               | Centered loading state                                                             |
| Medium   | `ErrorBoundary` / `PageErrorBoundary`             | Error boundary patterns                                                            |
| Medium   | `EditableInline`                                  | Inline edit card pattern                                                           |
| Medium   | `ColumnEditorPanel`                               | Column visibility/reorder panel                                                    |
| Low      | `BaseStatusDisplay`                               | Icon + label status display                                                        |
| Low      | `DotIcon`                                         | Colored dot indicator                                                              |
| Low      | `HintText`                                        | Text with info tooltip                                                             |
| Low      | `HiddenInfo`                                      | Masked text with show/hide toggle                                                  |
| Low      | `TextDivider`                                     | Horizontal rule with centered text                                                 |
| Low      | `TooltipContent`                                  | Structured tooltip content                                                         |
| Low      | `InfiniteScroll`                                  | Intersection Observer infinite scroll                                              |
| Low      | `SimplePagination`                                | Simple prev/next pagination                                                        |
| Low      | `TimeRangePaginator`                              | Time-based navigation                                                              |
| Low      | `AlertLevelIcon`                                  | Info/warning icon with tooltip                                                     |
| Low      | `FeatureOutageBanner`                             | Error banner with retry                                                            |
| Low      | `IPs`                                             | IP address list with copy                                                          |
| Low      | `KeyValuePairs`                                   | Responsive key-value grid                                                          |
| Low      | `DropdownActions`                                 | Single button or dropdown actions                                                  |
| Low      | `NetworkTypeFilter`                               | Multi-select network type filter                                                   |
| Low      | `PhoneInput`                                      | International phone input                                                          |
| Low      | `RadioSelectorModal`                              | Generic radio selection modal                                                      |
| Low      | `DataExportsModal`                                | CSV export modal pattern                                                           |

### Wrapper Components (already use EDS, just add i18n)

| Component              | Wraps                 |
| ---------------------- | --------------------- |
| `TableWithLocale`      | EDS `Table`           |
| `PageHeaderWithLocale` | EDS `PageHeader`      |
| `SegmentedControl`     | EDS `Segmented`       |
| `LocaleSelect`         | EDS `Modal` + `Radio` |
| `RangeDatePicker`      | EDS `RangePicker`     |

**Key Tailwind classes:** `flex h-full flex-row items-center ps-2 text-text-on-color`, `flex h-full items-center justify-center`, `wds-eero-layout`

**Code structure:**

```tsx
// Inline wrapper — not a standalone component file.
// Defined within LayoutWrapper, provides flex container for main content area.
<div className="flex h-full flex-row items-center ps-2 text-text-on-color">
  {children}
</div>
```
