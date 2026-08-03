---
inclusion: manual
description: "Cross-reference audit of components and patterns across Figma, EDS package, Storybook, Insight, and web-design-system."
---

# Component & Pattern Coverage Audit

Cross-reference of what exists across all five sources. Use this to identify gaps, duplication, and componentization opportunities.

**Sources:**

1. **Figma** — Design source of truth (⚠️ requires manual verification — Figma MCP available but not queried for full library)
2. **EDS Package** — `@amzn/eero-web-design-components` (npm)
3. **Storybook** — `apps/docsite/storybook/stories/` (this repo)
4. **Insight** — `web-eero-insight` production usage
5. **web-DS** — `web-design-system` engineering fork

---

## 1. EDS Components — Full Coverage Matrix

| Component                         | EDS Package | Storybook |     Insight Usage      | web-DS | Notes                                                       |
| --------------------------------- | :---------: | :-------: | :--------------------: | :----: | ----------------------------------------------------------- |
| AutoComplete                      |     ✅      |    ✅     |    ✅ (via Search)     |   ✅   |                                                             |
| Brush                             |     ✅      |    ✅     |           ✅           |   ✅   | Chart brush/zoom                                            |
| Button                            |     ✅      |    ✅     |    ✅ (154 imports)    |   ✅   | Most-used component                                         |
| Card                              |     ✅      |    ✅     |    ✅ (100 imports)    |   ✅   |                                                             |
| CardCarousel                      |     ✅      |    ✅     |           ❌           |   ✅   | Not used in Insight                                         |
| Checkbox                          |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| ConnectionStatus                  |     ✅      |    ✅     |     ✅ (4 imports)     |   ✅   |                                                             |
| CopyableText                      |     ✅      |    ✅     |     ✅ (9 imports)     |   ✅   |                                                             |
| DatePicker                        |     ✅      |    ✅     |           ✅           |   ✅   | Insight also has custom RangeDatePicker                     |
| Divider                           |     ✅      |    ✅     |    ✅ (26 imports)     |   ✅   |                                                             |
| EllipsisText                      |     ✅      |    ✅     |           ❌           |   ✅   | Not used in Insight                                         |
| EntityList                        |     ✅      |    ✅     |     ✅ (5 imports)     |   ✅   |                                                             |
| Icon / ICONS                      |     ✅      |    ✅     |  ✅ (204+139 imports)  |   ✅   | Heaviest usage after Button                                 |
| Input                             |     ✅      |    ✅     |    ✅ (50 imports)     |   ✅   | Includes InputNumber, InputPassword, TextArea               |
| InputMenu                         |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| IntervalSelector                  |     ✅      |    ✅     |     ✅ (3 imports)     |   ✅   |                                                             |
| Layout                            |     ✅      |    ✅     |     ✅ (app shell)     |   ✅   | Core shell component                                        |
| Loader                            |     ✅      |    ✅     |    ✅ (68 imports)     |   ✅   |                                                             |
| Menu (Sidebar/PanelMenu/IconMenu) |     ✅      |    ✅     | ✅ (Sidebar, IconMenu) |   ✅   |                                                             |
| Modal                             |     ✅      |    ✅     |    ✅ (103 imports)    |   ✅   |                                                             |
| MultiFieldTableV2                 |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| OverlayPanel                      |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| PageHeader                        |     ✅      |    ✅     |     ✅ (6 imports)     |   ✅   | Insight wraps as PageHeaderWithLocale                       |
| Panel                             |     ✅      |    ✅     |           ✅           |   ✅   | Includes MiniTable                                          |
| Popover                           |     ✅      |    ✅     |    ✅ (23 imports)     |   ✅   |                                                             |
| ProgressBar                       |     ✅      |    ✅     |     ✅ (3 imports)     |   ✅   |                                                             |
| Radio                             |     ✅      |    ✅     |    ✅ (14 imports)     |   ✅   |                                                             |
| Search                            |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| Segmented                         |     ✅      |    ✅     |     ✅ (3 imports)     |   ✅   |                                                             |
| Select                            |     ✅      |    ✅     |    ✅ (26 imports)     |   ✅   |                                                             |
| Slider                            |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| SortableList                      |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| SupportMessages                   |     ✅      |    ✅     |    ✅ (22 imports)     |   ✅   |                                                             |
| Switch                            |     ✅      |    ✅     |    ✅ (17 imports)     |   ✅   |                                                             |
| Table                             |     ✅      |    ✅     |     ✅ (6 imports)     |   ✅   | Insight wraps as TableWithLocale                            |
| TableV2                           |     ✅      |    ✅     |     ✅ (5 imports)     |   ✅   | Multiple stories (pagination, expandable, pinning, formats) |
| Tabs                              |     ✅      |    ✅     |     ✅ (5 imports)     |   ✅   |                                                             |
| Tag                               |     ✅      |    ✅     |    ✅ (38 imports)     |   ✅   |                                                             |
| Toast                             |     ✅      |    ✅     |    ✅ (70 useToast)    |   ✅   |                                                             |
| Tooltip                           |     ✅      |    ✅     |    ✅ (25 imports)     |   ✅   |                                                             |
| Tour                              |     ✅      |    ✅     |           ❌           |   ✅   | Not used in Insight                                         |
| Tree                              |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| TreeView                          |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |
| WifiQRCode                        |     ✅      |    ✅     |           ✅           |   ✅   |                                                             |

### Additional WDS Exports (in package + have Storybook stories)

These are exported from `@amzn/eero-web-design-components` and have their own stories. They're listed separately because they're variants or sub-components that aren't always obvious as standalone exports:

| Component             | Storybook | Notes                                            |
| --------------------- | :-------: | ------------------------------------------------ |
| CardFeature           |    ✅     | Card variant                                     |
| CheckableTag          |    ✅     | Selectable tag — acts as filter chip             |
| CheckableTagDropdown  |    ✅     | Dropdown with checkable tags                     |
| Container             |    ✅     | Layout helper                                    |
| CustomMenuContainer   |    ✅     | Menu variant                                     |
| DropdownButton        |    ✅     | Button variant (used in Insight: 11 imports)     |
| DropdownIconButton    |    ✅     | Button variant (used in Insight: 17 imports)     |
| IconAnimatedHamburger |    ✅     | Animated icon                                    |
| IconButton            |    ✅     | Button variant (used in Insight: 21 imports)     |
| IconMenu              |    ✅     | Menu variant (used in Insight header)            |
| LeftNavigation        |    ✅     | Used in docsite                                  |
| MiniTable             |    ✅     | Panel sub-component (used in Insight: 5 imports) |
| PanelMenu             |    ✅     | Menu variant                                     |
| SearchItem            |    ✅     | Search sub-component                             |
| Sidebar               |    ✅     | Used in Insight (6 imports)                      |
| SplitButton           |    ✅     | Button variant                                   |
| TinyIconButton        |    ✅     | Button variant (used in Insight: 23 imports)     |
| useLayoutDirection    |    ✅     | Hook (used in Insight: 21 imports)               |

---

## 2. Insight Custom Components — NOT in EDS

These are built directly in Insight and are candidates for componentization into EDS:

### High-Value Componentization Candidates

| Insight Component                | What It Does                              | EDS Candidate? |               Priority               |
| -------------------------------- | ----------------------------------------- | :------------: | :----------------------------------: |
| **EditableCard**                 | Card with edit button → modal flow        |    ✅ High     | Common pattern across settings pages |
| **ExpandableCard**               | Collapsible card with chevron toggle      |    ✅ High     |     Wraps EDS Card + IconButton      |
| **TableWithLocale**              | Table with i18n labels                    |    ✅ High     |   Every table in Insight uses this   |
| **TableWithBulkActions**         | Table with checkbox selection + bulk bar  |    ✅ High     |       Fleet management, users        |
| **TableWithVirtualList**         | Virtualized table for large datasets      |   ✅ Medium    |      Performance-critical lists      |
| **PageSection**                  | Section with title + action menu + border |   ✅ Medium    |  Used across detail/settings pages   |
| **PageHeaderWithLocale**         | PageHeader with i18n back/forward         |   ✅ Medium    |         Every page uses this         |
| **SimpleData**                   | Label/value display pair                  |   ✅ Medium    |     Settings cards, detail views     |
| **PeriodSelector**               | Time period dropdown with presets         |   ✅ Medium    |           Analytics pages            |
| **PeriodSelectorWithDatePicker** | Period selector + custom date range       |   ✅ Medium    |           Analytics pages            |
| **SimplePagination**             | Basic prev/next pagination                |     ✅ Low     |   Alternative to Table pagination    |
| **SegmentedControl**             | Custom segmented control                  |    ⚠️ Check    |    May overlap with EDS Segmented    |
| **NetworkTypeFilter**            | Network type filter dropdown              |   ❌ Domain    |         Too Insight-specific         |

### Domain-Specific Components (Insight-only, not EDS candidates)

| Component                                    | Purpose                                    |
| -------------------------------------------- | ------------------------------------------ |
| AccessoryStatus                              | Accessory connection status display        |
| AlertLevelIcon                               | Alert severity icon                        |
| AuditLogs                                    | Audit log viewer                           |
| BackupInternetStatus                         | Backup internet status indicator           |
| BaseStatusDisplay                            | Generic status display                     |
| Charts / MultiCharts                         | Chart wrappers (Recharts-based)            |
| Chatbot / ChatbotSidebar                     | Virtual agent integration                  |
| ConfirmCableCheckModal                       | Cable check confirmation                   |
| CopySnapshot                                 | Network snapshot copy                      |
| DataExportsModal                             | Data export dialog                         |
| DhcpOptions                                  | DHCP settings editor                       |
| DotIcon                                      | Colored dot indicator                      |
| DropdownActions                              | Action dropdown menu                       |
| EeroConnectedStatus                          | Eero connection status                     |
| EeroFirmware                                 | Firmware display/update                    |
| EeroInsightContainer                         | App container wrapper                      |
| EeroInsightLogo                              | Logo SVG                                   |
| EeroInternalAlerts                           | Internal alert banner                      |
| EeroPorts                                    | Port status display                        |
| FeatureOutageBanner                          | Outage notification banner                 |
| FileImportModal / FileUpload / FileUploadCsv | File upload flows                          |
| FleetActivation                              | Fleet activation widget                    |
| FullScreenLoading                            | Full-page loader                           |
| Header                                       | App header (uses EDS IconMenu, Icon)       |
| HomeSearchTips                               | Search tips widget                         |
| InfiniteScroll                               | Infinite scroll wrapper                    |
| InternalLoader                               | Internal tools loader                      |
| IPs                                          | IP address display                         |
| JobList                                      | Background job tracker                     |
| LayoutWrapper                                | App shell (uses EDS Layout)                |
| LinkToOwner                                  | Network ownership link                     |
| LocaleSelect                                 | Language selector                          |
| MetricsAlerts                                | Metrics alert configuration                |
| MigrationProgress                            | Migration status tracker                   |
| MobileRoaming / MobileRoamingSettings        | Mobile roaming config                      |
| ModalCustomerInfo                            | Customer info modal                        |
| ModalNetworkLimitExceeded                    | Limit exceeded warning                     |
| NetworkModeTag                               | Network mode label                         |
| PPPoEV2                                      | PPPoE settings                             |
| PhoneInput                                   | Phone number input                         |
| RadioSelectorModal                           | Radio selection modal                      |
| Radius                                       | RADIUS config                              |
| RangeDatePicker                              | Date range picker (extends EDS DatePicker) |
| ResponsiveChartContainer                     | Responsive chart wrapper                   |
| SchemaSelectorInput                          | Schema selector                            |
| SettingsSectionTitle                         | Settings section header                    |
| SortMenu                                     | Sort options menu                          |
| TableSkeleton / CardSkeleton                 | Loading skeletons                          |
| TextDivider                                  | Text with divider line                     |
| ThreeDotsMenu                                | Kebab menu                                 |
| TimeRangePaginator                           | Time-based pagination                      |
| TooltipContent                               | Custom tooltip content                     |
| UnsupportedModelCard                         | Unsupported device card                    |
| VlanTaggingV2                                | VLAN tagging config                        |
| WorldMap                                     | Geographic map visualization               |

---

## 3. Patterns — Cross-Source Coverage

| Pattern                                | Figma |         EDS         |            Insight             | Notes                          |
| -------------------------------------- | :---: | :-----------------: | :----------------------------: | ------------------------------ |
| App Shell (header + sidebar + content) |  ⚠️   |      ✅ Layout      |        ✅ LayoutWrapper        |                                |
| Collapsible Sidebar                    |  ⚠️   |     ✅ Sidebar      |           ✅ Sidenav           |                                |
| Page Header with Actions               |  ⚠️   |    ✅ PageHeader    |    ✅ PageHeaderWithLocale     |                                |
| Editable Card (view → edit modal)      |  ⚠️   |         ❌          |        ✅ EditableCard         | Gap: not in EDS                |
| Expandable/Collapsible Card            |  ⚠️   |         ❌          |       ✅ ExpandableCard        | Gap: not in EDS                |
| Data Table with i18n                   |  ⚠️   |      ✅ Table       |       ✅ TableWithLocale       | Insight wraps EDS              |
| Table with Bulk Actions                |  ⚠️   |         ❌          |    ✅ TableWithBulkActions     | Gap: not in EDS                |
| Form in Modal                          |  ⚠️   |  ✅ Modal + Input   |      ✅ (settings pages)       | Pattern, not component         |
| Toast Notifications                    |  ⚠️   |      ✅ Toast       |          ✅ useToast           |                                |
| Loading States                         |  ⚠️   |      ✅ Loader      |      ✅ FullScreenLoading      | Insight adds full-page variant |
| Empty States                           |  ⚠️   |         ❌          |          ✅ (inline)           | No EDS empty state component   |
| Error Boundaries                       |  ❌   |         ❌          |        ✅ ErrorBoundary        | React-level, not design        |
| Permission Gates                       |  ❌   |         ❌          |           ✅ `<Can>`           | Auth pattern, not design       |
| Period/Time Selector                   |  ⚠️   | ✅ IntervalSelector |       ✅ PeriodSelector        | Insight has its own            |
| Search with Autocomplete               |  ⚠️   |      ✅ Search      |        ✅ HeaderSearch         |                                |
| Skeleton Loading                       |  ⚠️   |         ❌          | ✅ TableSkeleton, CardSkeleton | Gap: not in EDS                |
| Status Indicators                      |  ⚠️   | ✅ ConnectionStatus |       ✅ Multiple custom       | Insight extends beyond EDS     |
| Label/Value Display                    |  ⚠️   |         ❌          |         ✅ SimpleData          | Gap: not in EDS                |
| Section with Action Menu               |  ⚠️   |         ❌          |         ✅ PageSection         | Gap: not in EDS                |
| Infinite Scroll                        |  ❌   |         ❌          |       ✅ InfiniteScroll        | Gap: not in EDS                |
| File Upload                            |  ⚠️   |         ❌          |  ✅ FileUpload/FileUploadCsv   | Gap: not in EDS                |
| Chart Containers                       |  ⚠️   |         ❌          |     ✅ Charts/MultiCharts      | Domain-specific                |

**Legend:** ✅ = exists, ❌ = doesn't exist, ⚠️ = likely exists in Figma but needs manual verification

---

## 4. Gaps Summary

### Storybook Gaps (in EDS but no story)

All previously missing stories have been added. Full Storybook coverage is now achieved for all EDS package components.

### EDS Gaps (patterns used in Insight but not componentized)

**High priority:**

- EditableCard — Card + edit button + modal pattern
- ExpandableCard — Collapsible card pattern
- TableWithLocale — i18n table wrapper
- TableWithBulkActions — Bulk selection pattern
- Skeleton loading (TableSkeleton, CardSkeleton)

**Medium priority:**

- SimpleData — Label/value pair display
- PageSection — Section with title + action menu
- PageHeaderWithLocale — i18n PageHeader wrapper
- PeriodSelector — Time period filter
- Empty state component

**Low priority:**

- SimplePagination
- TextDivider
- ThreeDotsMenu (kebab menu)
- HintText (label + help tooltip)

### Figma Verification Needed

All Figma columns marked ⚠️ need manual verification against the Figma component library. Share the Figma file key and I can query it via MCP.
