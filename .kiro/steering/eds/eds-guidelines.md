---
inclusion: manual
description: Complete offline EDS design reference — components, patterns, foundations, accessibility. Manually regenerated from Contentful/docsite.
---

# eero UX Design System

> **Last synced:** 2026-05-16
> **Source:** Contentful (PE space) + EDS docsite
> **To regenerate:** Pull latest guidance from Contentful/KB and update this file.
> **Source priority:** Use EDS Knowledge Base (if configured) over this file. This is the offline fallback.

Comprehensive design system documentation for eero products. Use this to ensure consistency across Insight (web) and App (mobile) implementations.

## How to Use This File

When answering design system questions, cite the source and provide:

1. Specific token/class names when applicable
2. Code examples when helpful
3. Note any platform differences (Insight vs App)

## Component Name Mapping

Map WDS component names to their design guidance section below:

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

For code examples, query the KB or check Storybook: `apps/docsite/storybook/stories/`

## UX Tenets 🧭

**Version 1.0 | Date: 2-14-23**

1. **Built for efficiency** - Designs help customers solve problems quickly. Don't sacrifice efficiency when adding to or refreshing the experience.
2. **Just works** - Products provide reasonable defaults. Display additional functionality for customers with specific needs.
3. **Durable design** - Think long term, opt for well-understood components and patterns. Avoid one-time exceptions that create inconsistencies.
4. **Inform, don't overwhelm** - Simplify complicated features without compromising utility. Use progressive disclosure for complex problems.
5. **Reduce repetition** - Avoid unnecessary screens, repeating information, and looping navigation. Combine pages with same information.
6. **Innovate then validate** - Design and deliver fast using best judgment. Validate with customer data. Not afraid to go backward if wrong.

## Design Principles (Insight 2.0)

- **Simplicity** - Clean, clear, intuitive designs. Minimize complexity.
- **Consistency** - Uniform design elements, patterns, and behaviors throughout.
- **Usability** - User-friendly and efficient. Consider user goals.
- **Accessibility** - Inclusive design for all abilities. Adhere to accessibility standards.
- **Scalability** - System should grow as product evolves.
- **Flexibility** - Allow customization for different contexts.
- **Responsiveness** - Adapt to different screen sizes and devices.

---

## Insight Foundations

### Colors

Color plays an essential role in the UI of eero Insight. It helps to establish our brand identity, conveys hierarchy and meaning, and guides users through essential networking concepts.

_For documentation on how to update eero Insight’s production colors after making a design change, see: _[_Updating color variables_](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/edit-v2/4433281025?draftShareId=bf2d0382-8236-43a0-92b5-54e5aa02625f)

## Key concepts

[layout:2-col]

**Color** highlights important information and creates focal points. Too much color can confuse viewers and disrupt the visual hierarchy.

[col]

**Core colors** are ramps that use a single base tint with various shades and tints. eero Insight uses a 10-step ramp.

[/layout]

[layout:2-col]

**Semantic colors** apply to specific elements within the design system. In Insight, these take the form of variables that inherit a **core color** defined in our ramps.

[col]

**Themes** set the interface tone and are largely influenced by existing eero branding and products.

[/layout]

##

Colors in eero Insight 

### Core colors 

To make eero’s digital products feel like a family, eero Insight’s core color system was created by expanding the eero Mobile app’s palette. Note: mobile app colors diverge slightly from the eero brand colors for accessibility.

To account for the greater number of states, components, and variety of information on web, the “base tints” used on the app were translated into color ramps consisting of 10 steps, with the luminance values aligned for each step.

**Interface colors** form the primary colors used across the range of components, text, and pages in Insight. They're used in core UI, such as page backgrounds, card borders, button backgrounds, and messaging for errors and success.

---

**Supporting colors **are used primarily for data visualizations, tags, or other areas where the specific color is not essential to understanding the usage of the UI element. Examples include colors for visualizations, tags, and user account avatars. 

## Semantic colors

In order to apply Insight’s core color ramp to specific elements, we use semantic [design tokens](https://www.contentful.com/blog/design-token-system/). 

Design tokens are variables that semantically define how the color ramp is used in the design system. They ensure consistent color use across elements and components, simplifying maintenance and updates. By modifying token values in a central location, designers and developers can efficiently change the color scheme, promoting consistency and improving user experience. 

Design tokens go beyond the color ramp, in that they define _how the color ramp is applied_. For example, the core color ramp includes 10 values for midnight blue: midnight-1 to midnight-10. However, it provides no guidance on how and where those colors are to be applied. To define the color token for primary text, we define a token **text-primary**, and assign the color ramp value **midnight-9** to it. 

This way, any updates to either the color ramp or the application of that color ramp to the designs are consistent.

### Example 1

If the hex value for **midnight-9** in the color ramp gets changed, the **$text-primary** variable will inherit this update automatically and all primary text will get updated

### Example 2 

If we decide to change the color of primary text from **midnight-9 **to **midnight-10 **for example, we will re-assign the **midnight-10 **color ramp value to the **$text-primary **token and all primary text will get updated.

The design tokens in Insight heavily reference [IBM Carbon’s](https://carbondesignsystem.com/guidelines/color/overview/#token-names) naming methodology. See [Figma guidance](https://uxdesign.cc/getting-started-with-native-design-tokens-in-figma-5d9c5fcdd9f7) on design tokens for reference as well.

## Colors with Insight specific meanings

eero Insight uses several colors to consistently convey meaning across the product.

### Connectivity status 

**Green**: Online, **Red:** Offline, **Orange:** Rebooting, **Ocean:** Backup internet. 

### Errors, warnings, and success 

**Red: **Alert, **Orange: **Warning, **Green:** Success, **Blue:** Info.

## Other Insight color decisions

### Text color

Text on light mode is based on the eero branded Midnight blue.

### Greyscale color

The greyscale ramp is uses a slight hint of blue in it to make eero Insight feel more branded and aesthetically pleasing. 

1. **Grayscale step without blue:** clashes with our eero blue brand.
2. **eero branded grayscale:** based on a subtle blue tint.

**Do:**

**Don't:**

---

### Corner radius

Corner radius defines the degree of rounding of the corners of an element, measured in pixels. It's an essential part of eero’s branding, giving both digital and hardware products a distinctive aesthetic.

## Usage

Compared with sharp, angular corners, corner radius creates a softer, organic look. This makes our elements more approachable and helps to distinguish important content or actions on the page.

Corner radius is also used to create a sense of depth and information hierarchy within the eero Insight design language, with larger corner radii used for primary interface elements like cards and tables, while smaller radii are used for secondary elements and affordances, such as buttons and tags.

## Corner radius scale

This radius scale ensures consistency across all design elements.

**Do:**

**Don't:**

---

### Elevation

Elevation is the perceived depth of elements in a layout or interface.

## Elevation scale

The effect of elevation is achieved through the use of shadows, highlights, and gradients that create the illusion of depth. Elevation levels are defined in the table below.

## Usage

Elevation helps users understand how elements relate to each other on the screen. It creates a visual hierarchy by making some elements appear closer and more important, while others seem farther away. Higher elevation is perceived as being closer to the user, guiding them to important information and actions, making the interface more intuitive and engaging.

In the eero Insight design language, elevation is primarily used in _transient UI_ - temporary elements such as modals, context menus, select menus, type-aheads, and pinned headers that sit permanently above scrolling content. It plays a supporting role in contexts where extra emphasis is needed to differentiate an element from its background. 

## Accessibility

### Contrast

When using elevation to create visual depth, ensure that there is sufficient contrast between the foreground and background elements. This helps users with visual impairments distinguish between different interface elements.

### Descriptions and labels

If your UI heavily relies on elevation, provide alternative ways for users to access the information. For example, provide text descriptions or audio descriptions for elements that are difficult to see or interact with.

When using elevation to indicate interactivity, use descriptive labels or text to help users understand the function of the element. This is particularly important for users with visual impairments who rely on assistive technology to navigate the interface.

### Navigation

Ensure that all elements with elevation can be accessed and interacted with using the keyboard alone. This is important for users with mobility impairments who are unable to use a mouse or touch screen.

**Do:**

**Don't:**

---

### Iconography

Icons are universal symbols representing actions, objects, or concepts in the UI. They help users quickly understand the purpose and function of various elements, such as buttons, menus and navigation.

## Usage

Common examples where icons are used in eero user interfaces include:

[spacer:20]

[layout:3-col]

**Navigation. **Icons are used to represent different sections or pages, making it easier for users to find what they're looking for.

[col]

**Action buttons.** Icons are used in action buttons, such as "save," "delete," "edit," "add," clarifying what action can be taken.

[col]

**Menu items.** Icons visually differentiate options, making it easier for users to scan and understand what is available.

[/layout]

[spacer:20]

[layout:3-col]

**Status indicators. **Icons are used to indicate the status of a particular task or action, such as a checkmark to indicate completion.

[col]

**Branding.** Icons are used to communicate features or services.

[/layout]

## Principles

[layout:3-col]

**Clarity.** Using a reductive approach, find the simplest expression of an object or idea to represent a single, concise message.

[col]

**Simplicity. **Use basic, elementary shapes (circle, square, triangle) while honoring the soft corner radii of our design language.

[col]

**Legibility. **Icons should be seen comfortably in dense content environments at defined compact sizes.

[/layout]

[spacer:20]

[layout:3-col]

**Consistency. **Use grid and construction lines, uniformed terminals, joints, stroke thickness (2px).

[col]

**Front facing. **Icons must always face forward on a single, flat plane. If depth is required, icons are to maintain a forced perspective in order to preserve visual clarity.

[/layout]

##

Details

eero Insight uses two types of icons:

- \*[layout:2-col]

  **1. Illustrative icon**

Borrowed from the app library, and not specific to eero Insight. These are larger icons, using a 32x32 grid and a 1px stroke weight. Illustrative icons are used to illustrate device types or other concepts to provide flavor to the UI, rather than action or status. They are not independently actionable, but may be contained inside a large clickable item such as a row (where they are typically used). They are **not** used inside buttons, navigation, or any core actionable components. \*As these icons are used across Insight and the mobile app, they are not covered in this documentation.

- [col]

  **2. Functional icon**

Custom for eero Insight. These icons are smaller and use a 24x24 or 16x16 grid and a 2px stroke weight. Functional icons are used to convey action or status. They're usually clickable, actionable, or part of the core UI. These icons appear in navigation, buttons, inputs, or alone as an affordance that triggers an action.

[/layout]

## Functional icon construction

**Grids.** Functional icons use two grids: 24x24px and 16x16px. Use grids provided in the assets library, accordingly.

\*\*
**[spacer:12]
**
Safe areas.\*\* Use a 2px safe area. For icons that don’t use circular or rectangular keylines, make sure the icon shape does not exceed the boundary box.

[spacer:12]

**Keylines.** Keylines (construction lines) create consistent yet flexible guidelines for icon size and placement. Use squares, circles, horizontal and vertical rectangles to define specific shapes of an icon.

[spacer:12]

**Style.** Use a 2px stroke for icon line weight. Use rounded joints and terminals with 3px external (1px internal) corner radius on squares and rectangles along keylines. Create 90° angles when possible.

##

Glossary

##

Resources

[Meridian Design System: Iconography](https://meridian.a2z.com/fundamentals/iconography/?platform=react-web&detailsTab=guidelines&siteTheme=blue-light&previewTheme=blue-light)

[Apple Human Interface Guidelines: Icons](https://developer.apple.com/design/human-interface-guidelines/foundations/icons)

[Material Design 3.0: Icons](https://m3.material.io/styles/icons/designing-icons)

---

### Spacing

Spacing is an essential part of the eero UI, creating rhythm and visual consistency and page balance.

## Grid

Grids are used to maintain consistent spacing, margins, and paddings throughout the interface. Use a 4px grid for all eero interface elements, as it allows for more flexibility and fine-grained control over element positioning.

Occasionally, the 4-pixel grid may need to be deviated from within smaller components to maintain visual harmony. However, the 4-pixel grid should be maintained between components on a page. 

Learn more about 4px grid: [Why we're using a 4-point grid in Webflow | Webflow Blog](https://webflow.com/blog/why-were-using-a-4-point-grid-in-webflow)

## White space

Whitespace, also known as negative or empty space, refers to the area around and between user interface elements. Whitespace is used to:

[spacer:20]

[layout:3-col]

**Distinguish** **content** types with consistent separation.

[col]

**Enhance readability** of text elements, such as paragraphs, headings, and lists.

[col]

**Provide hierarchy** on the page. For example, a call-to-action button can be surrounded by more whitespace to make it stand out and encourage interaction.

[/layout]

[layout:3-col]

**Guide** **users** through a page by creating a natural flow from one element to the next.

[col]

**Create elegance** and simplicity by giving UI elements "room to breathe," resulting in a clean and uncluttered aesthetic for eero products.

[/layout]

## Spacing scale

Use the spacing scale provided in the table below to create and position UI elements.

---

### Typography

Typography provides visual hierarchy and aesthetic treatments to written content.

## Typeface

**Centra No.2 **is eero’s official typeface. It has been chosen for its readability and modernist characteristics that fit with eero’s brand identity. This typeface provides clean and highly consistent headings, legible body paragraphs, clear labels, and simple input fields.

## Type scale

Centra No.2 comes in a variety of font weights and sizes. In eero UI, **Book** weight is used for longer content, like body text and captions, whereas **Medium** weight is used for headers, links, and button text. For more details use the table below.

**Do:**

**Don't:**

---

## Insight Components

### Breadcrumbs

A breadcrumb is a horizontal trail of links showing the user's navigational path from the home page to their current location.

## Usage

Breadcrumbs are providing users with a clear understanding of their current location within an application. By displaying a hierarchical trail of links, typically at the top of a page or screen, breadcrumbs visually depict the user's journey from the main page to the present location. This enables users to easily retrace their steps and navigate back to higher-level pages or sections with a simple click.

## Types

[layout:2-col]

[col]

1. **Default**
2. **With icons:** used to represent the pages visually.

[/layout]

## Anatomy

[layout:2-col]

[col]

1. **Container:** used to contain the Breadcrumb’s elements.
2. **Icon:** used to visually represent the page.
3. **Label:** used to provide the page’s name.
4. **Separator:** used to indicate pages relationships in the Breadcrumb.
5. **Current page:** used to indicate the current page.

[/layout]

**Do:**

**Don't:**

---

### Buttons

Buttons let users perform actions or make choices with a single tap or click.

## Usage

Buttons communicate actions that customers can take. They are typically placed throughout an interface in places like Modals, Forms, Boxes or Cards.

## Types

1. **Default styling:** for secondary actions on each page. Generally use for non-critical actions.
2. **Primary styling**: for the principal call to action on the page. Use only one primary button per screen.
3. **Ghost styling:** a tertiary style best for button groups where one action is less common or important.
4. **Link styling:** similar to Ghost but does not include a container or background. Can be used in height-restricted areas of the screen.

[layout:2-col]

[col]

1. **Icon.** Icons can be used in buttons to better communicate what the button does. Be sure to use the correct icon set with the proper size
2. **Tiny icon.** When space is constrained, and a smaller icon and containment can be used; on click, this displays a tooltip. Can also be used to open an input menu.
3. **Dropdown**. Shows a list of options that is revealed only when a user interacts with the menu, either by clicking it or hovering over it with their cursor.
4. **Split dropdown**. A variant of a button group that has primary and secondary actions where one of the actions is a Dropdown.

[/layout]

## Color

[layout:3-col]

**Periwinkle** is used for Primary buttons.

[col]

**Midnight blue** is used for Default and Ghost buttons.

[col]

**Red** is used for destructive actions and buttons.

[/layout]

## Anatomy

1. **Container:** a solid, outlined, or invisible rectangle that shows the clickable boundaries of the button—for Ghost buttons, the rectangle only appears while hovering.
2. **Label:** a text string that is centered in the container. When an icon is used, the label + icon are centered.
3. **Icon **(optional): An icon can be placed left or right of the label.

## Editorial

1. **Be specific. **Ideally, the customer should be able to predict what a button will do without having to read surrounding text. Do: "Confirm quantity"; Don't: "OK"
2. **If “Yes” and “No” button labels are needed, phrase the heading or text above the button as a question. **Use “Yes” and “No” together, not “Yes” and “Cancel.” Do: "Is the item missing?"_ - _"Yes"and"No"; Don’t: "Is the item missing?"_ - _"Yes"and"Cancel".
3. **Be concise and use no more than 3 words on a button. **Write in small, glanceable segments that allow the customer to quickly understand what will happen after the button is pressed.Do: “Report problem”; Don't: “Report a missing, unscannable or damaged item”
4. **Describe the immediate results of interacting with the button, not the results of subsequent steps. **Do: “Enter quantity”; Don't: “Press to enter quantity next.”
5. **Use action-oriented labels. **Do: “Report problem”; Don't: “Problem found.”
6. **Don’t include periods. **Do: "Report problem"; Don't: "Report problem."
7. **Use sentence case, where the first word is always capitalized. **Do: "Report problem", Don't: "Report Problem"
8. **Don’t include the word, “now” because all button actions should happen now. **Do: “Replace full tote”; Don't: “Replace full tote now”

**Do:**

**Don't:**

---

### Card

A card is a contained component that displays related content and typically includes images, titles, descriptions, and actions.

## Usage

Card is used to organize and present various types of content, including recent updates, relative features, events, etc. They provide a clear and concise way to present information in a visually appealing manner while maintaining consistency in the overall design.

## Types

1. **X-small** - used for cards containing smaller amount of information like events or alerts
2. **Small** - used under normal circumstances for cards containing information summaries like network devices, or alerts with a bigger amount of information
3. **Horizontal** - used for cards that required horizontal layout, like user/network owner cards and settings
4. **Horizontal-extendable **- used for cards with horizontal layout that required to contain more information like eero devices
5. **Data-viz** - used for cards containing visualization components
6. **Table** - used for cards containing tables

## Examples

**Do:**

**Don't:**

---

### Checkboxes

A Checkbox is a component that allows users to select or deselect single or multiple options from a set of choices

## Usage

A checkbox consists of a square box that can be checked (filled with a checkmark) or unchecked (empty), along with a label that describes the option or action associated with the checkbox. In cases where the system requires a feature to be neither enabled nor disabled by default, an indeterminate state can be used.

When a user clicks on a checkbox, it toggles between the checked and unchecked states, allowing them to make a selection or indicate a choice. Checkboxes are commonly used in forms, surveys, and other interactive applications to enable users to specify their preferences, indicate agreement to terms and conditions, or make multiple selections from a list of options.

## Types

A checkbox can be used with or without a label. The label can be aligned to the right or left of the checkbox. The label should clearly state the setting that the checkbox is controlling. It can be excluded when composing a checkbox into a larger pattern, such as indicating the selection of a row within a table.

## Anatomy

1. **Label** (optional)

**Do:**

**Don't:**

---

### Connection status

Connection status is a component that visually indicates a device's current network state — offline, rebooting, connected, or on backup internet

\*\*

## Types

### Size

1. **Large:** Used in the left navigation or in large elements that require extra focus.
2. **Small:** Used within the page on Insight.
3. **Ghost:** Used when a high number of networks are displayed in a grid or list, or when there isn’t space to use the large or small variants.

### Status

1. **Online **
2. **Offline **
3. **Rebooting **
4. **Backup internet **

### Collapsed state

1. **Expanded state:** used in the vast majority of cases.
2. **Collapsed state:** used in the collapsed state of the left navigation (see gif below).

## Anatomy

1. **Icon:** used to indicate the status in a visual form.
2. **Label:** used to provide information about the status.
3. **Container:** used to contain the connection status' “peel”.

**Do:**

**Don't:**

---

### DatePicker

A DatePicker is an element that allows users to select a date from a calendar or a set of predefined dates.

## Usage

The DatePicker displays a calendar widget that lets users navigate and visually select dates to simplify the process of entering or selecting dates accurately and efficiently.

## Types

### Size

1. **Default**: used in the vast majority of cases on web
2. **Large: **used for hero content on landing pages, sign up flows, and on mobile
3. **Small: **used in very rare cases where an extremely high information density is required (not currently used on eero insight at all)

### Single or range

1. **Single date:** used where only one date is needed.
2. **Date range:** used to select a range of dates.

### Label

1. **Default**
2. **Optional label mark:** when an input in a form is optional. Use this when most form items are required.
3. **Required label mark:** when an input is required. Use this when most form input items are optional.
4. **Label tooltip:** when a form item needs extra explanation.
5. **Label and cation hidden:** Also a very common state.

### Label layout

1. **Vertical:** default layout, used in the vast majority of cases.
2. **Horizontal:** used when form items are aligned horizontally, for example in settings cards.

## Anatomy

1. **Label**: Indicates the type of the DatePicker.
2. **DatePicker base**: Contains DatePicker field.
3. **Input caption**: Provides helper information about the field.
4. **Date icon**: Indicates the DatePicker field.
5. **Set date**: Indicates the picked date.
6. **Next/previous year**: Jumps to next/previous year (can be disabled)
7. **Next/previous month: **Jumps to next/previous month
8. **DatePicker container**: Contains a calendar view allowing user to pick the year, month, and date.
9. **Select current date**: selects today’s date
10. **Date selector**: allows selection of a date
11. **Current date**: shows today’s date in a blue outline
12. **Cancel button**: closes menu to previous state
13. **Apply button**: Sets the picked time.

**Do:**

**Don't:**

---

### Input

An input lets users enter text, numbers, or other data in short-form or multi-line fields.

## Usage

Inputs can be used for various purposes, such as collecting information, submitting search queries, or entering login credentials. They may also include features such as auto-complete, spell check, or validation to ensure that the Input is correct and meets specific requirements.

Additionally, Inputs for numerical values typically consist of a field where users can input numbers and buttons or arrows to increase or decrease the value. It’s preferably used in page sections and forms to input small values when increasing or decreasing them requires only a few clicks.

## Types

### Size

1. **Default:** used in the vast majority of cases on web.
2. **Large:** used for hero content on landing pages, sign up flows, and on mobile.
3. **Small:** used in very rare cases where an extremely high information density is required (not currently used on eero insight at all.)

### Input type

1. **Single line text:** used for inputting short text strings. Can be set to include a character count.
2. **InputNumber:** used when only numeric values are accepted.
3. **Multiline:** used for inputting longer text strings. Can be set to include a character count.

### Single line variants

1. **Default:** A default single line Input.
2. **Icon:** A single line Input with a left and/or right icon. Used wherever extra information is needed to help enter the right information via an icon, for example in a search field or when a tooltip is needed inside the text field.
3. **Prefix suffix:** used to show abbreviations or text that helps users enter the right type of information in an Input.

### Status

1. **Default:** used as a helper text.
2. **Error:** used to show an error when an Input is not accepted.
3. **Warning:** used to warn the user about possible problems but will allow them to proceed.
4. **Success:** used to show a successfully inputted entry into an Input field.

### Label

1. **Default**
2. **Optional label mark:** when an Input in a form is optional. Use this when most form items are required.
3. **Required label mark:** when an Input is required. Use this when most form Input items are optional.
4. **Label tooltip:** when a form item needs extra explanation.
5. **Label and cation hidden**

### Label layout

1. **Vertical:** default layout, used in the vast majority of cases.
2. **Horizontal:** used when form items are aligned horizontally, for example in settings cards.

## Anatomy

1. **Input label** (optional): a label for the Input field.
2. **Input placeholder text:** placeholder text before inputting text.
3. **Caption** (optional): caption below an Input field.
4. **Required** (optional): indicates whether a field is required or not.
5. **Tooltip** (optional): used to provide a description.
6. **Textarea resizer:** used to change the size of the text area.
7. **Left icon:** used if need to provide additional visual information.
8. **Right icon:** used if need to provide additional visual information.
9. **Status icon:** used to provide visual information about the status.

### Don’t

- Don't overwhelm users with many Input fields in a single form or application—use multiple screens or sections and group related Inputs.
- Don't use non-standard Input types that make it difficult to input or validate data.
- Don't use vague or ambiguous labels that do not clearly describe the type of information required in the Input field.
- Don't make Input fields too small to not make it difficult for users to Input data accurately, especially on mobile devices.
- Don't rely solely on validation to ensure data accuracy, as this can be frustrating for users and lead to errors in the data collected.

**Do:**

**Don't:**

---

### Input menus

An input menu lets users enter data or select from a list of options.

## Usage

The Menu prompts the user to provide input or select a value from a set of predefined options. It can come in different forms, such as text boxes, dropdown lists, checkboxes, radio buttons, and sliders. The choice of a menu element to use depends on the type of data or input required, as well as the context of use.

## Types

### Basic types

1. **Checkmark:** Used for basic Input menus where a small number of items are selected as part of a form.
2. **Checkbox:** Used when multiselect is required in an Input menu that triggers a change in the UI, such as in filtering or view controls.
3. **Radio:** Used when single select is required in an Input menu that triggers a change in the UI, such as filtering or view controls.
4. **Searchable+button group:** Used when an Input menu needs an included search menu, such as in filtering. NOTE: do not use with the search or select component, since these components already have search built in.
5. **Button group:** Used when an explicit confirmation is necessary after making a selection.

### Submenu

### Icons

### Danger

## Anatomy

1. **Label content:** used to provide information about the menu group items.
2. **Checkmark:** used to indicate the selection of an item.
3. **Destructive menu item:** used to indicate an item with destructive (irreversible) action.
4. **Submenu disclosure:** used to indicate a child menu.
5. **Embedded search component:** used to search for specific items inside the menu.
6. **Checkbox:** used to provide a Checkbox menu item.
7. **Divider line:** used to separate different menu sections.
8. **Secondary button** (typically cancel)
9. **Primary button** (typically apply changes)

**Do:**

**Don't:**

---

### Interval selector

The interval selector controls the data time range for an eero Insight page; use Date picker for simpler cases.

## Usage

The interval selector combines the functionality of a dropdown (for selecting the interval) and back/forward buttons (for going backward and forward to the previous period or the next period in a selected interval).

### Placement within the page header

The interval selector forms a core part of the page header in many dashboard pages in Insight. It allows users to adjust the content of the page to view smaller or larger intervals of data.

[spacer:24]

### When to use the interval selector

The interval selector is used when a page requires users to select from several preset intervals of time, and then go backwards or forwards in time to view that same interval in a different time period. This is often useful when a page contains a large volume of data that would be unfeasible to load in its entirety (e.g. event stream), or when a page has several different time intervals that would be useful to users who still need to view historical data (e.g network analytics pages).

[spacer:24]

### When not to use the interval selector

The interval selector should generally be a top-level component for a page and affect all of the contents on the page. As such, it should not be used in the following circumstances:

[layout:3-col]

- Within an individual card where the interval selector has no effect on the other components on the page.

[col]

- When a page is designed to load and display all available data in its entirety (e.g. audit logs). In this case, use a Date Picker component to filter down the data to the desired date range.

[col]

- On simple pages such as landing pages, where historical data is not needed. Instead, use a segmented control or other element to more easily switch between different time-frames.

[/layout]

[spacer:12]

### How to use the interval selector

As a best practice, the interval selector should have 3-5 available intervals for a user to choose from. Pick intervals that will be most useful for the page's use case and based on engineering and data constraints. The interval selector also has a pattern for custom and selected date ranges. However, due to the complexity custom intervals add, only use these options when there is a good user justification and when available with engineering limitations.

[spacer:24]

### General guidelines

1. The default interval is always a rolling period leading up to the current date and time
2. The default interval for the page should be the period most useful to the majority of users
3. A page should generally have 3-5 intervals available for selection.
4. Intervals should not overlap with each other.

## Anatomy

### Terminology

[layout:2-col]

**Interval**: The interval of time that the data on the page relates to. Examples: 12 hours, 24 hours, 3 months.

[col]

**Interval period**: The specific dates selected for a given interval. Users can go backwards to view previous intervals of a selected interval. For example, if the Interval is 1 day, and the current day is March 31, 2024, the current period is March 31, 2024, the Current-1 period is March 30, 2024, and the Current-2 period is March 29, 2024.

[/layout]

### Main elements

1. **Previous period** - Button that goes back to the immediately preceding interval of time
2. **Selected interval** - The interval of time that the data on the page is loaded for. These intervals are chosen from presets selected by the user on the page
3. **Interval start time** - The date and/or time that is the start of the currently displayed interval
4. **Interval end time** - The date and/or time that is the end of the currently displayed interval
5. **Next period** - Button that goes forward to the immediately succeeding interval of time
6. **Interval selector menu -** The menu where users can select from preset intervals. Usually displays 3-5 options that are the most useful to help users gain insights from a page
7. **Selected interval menu item** - The currently selected interval. Correlates to (2).

[spacer:16]

### Click targets

1. **Click target for previous period**
2. **Click target to open the interval selector menu**
3. **Click target for next period**

[spacer:16]

### Focus states

Keyboard focus states should be available for all elements in the interval selector component. The previous/next period buttons have focus states that are similar to those used on the _default_ styled button. The focus state for the interval selector menu opens the menu.

[spacer:16]

### Typical setup on a page

Interval selectors on a page should typically include 3-5 options. These options should be picked based on the customer need on the page being designed, and based on the anticipated quantity of data for each interval.

[spacer:16]

### Available intervals

To account for the wide range of pages in eero Insight, there are many different intervals available. Shorter intervals tend to be better for data-dense troubleshooting use cases, while longer intervals are better for high level identification of trends.

**Note:** Pick the 3-5 intervals that are most appropriate for the page you are designing. Do not include more than 5 intervals on a page, as a best practice.

Available intervals:

1. **1 hour**
2. **3 hours**
3. **6 hours**
4. **12 hours**
5. **24 hours**
6. **7 days**
7. **30 days**
8. **90 days**
9. **6 months**
10. **1 year**
11. **Select date and time** - Ability to select an exact date in the past to either view a full 24 hours of data on that date, or a narrower range of data on that date. This is currently used on event stream.
12. **Custom interval (Concept)** - Ability to select a custom interval of dates and times for a page. Note: this is not used on eero Insight right now, and should not be implemented until necessary.

## Select date and time

## Reference

**Do:**

**Don't:**

---

### Loaders

A loader is a visual element that indicates an action is being processed or that content is loading.

## Usage

The loader appears as a spinning graphic to manage user expectations and prevent frustration by providing feedback that the system is working as expected, especially in cases where loading times may be longer than usual.

## Types

1. **Loader:** used inline in filter dialogs, cards, topology maps, etc.
2. **Loader with label:** used in modals.
3. **Loader with bottom label:** used under normal circumstances.

## Anatomy

1. **Loader icon:** used to indicate the loading state.
2. **Label:** used to provide the loading state.

**Do:**

**Don't:**

---

### Modal

A modal is a dialog that overlays the main content to capture input, display information, or prompt decisions.

## Usage

The modal is commonly used for notifications, confirmations, forms, and media. Modals grab attention and ensure deliberate actions within a focused area.

## Anatomy

1. **Title info buttons:** used to provide more information about the title.
2. **Container:** used to contain the modal.
3. **Title:** used to provide the name of the modal.
4. **Subtitle:** used to provide additional information about the modal.
5. **Body:** used to contain the information and controls needed to complete the modal’s task, such as [Inputs](#/eero-design-system/insight/components/input), [Selects](#/eero-design-system/insight/components/select), [Checkbox groups](#/eero-design-system/insight/components/checkboxes), [Radio groups](#/eero-design-system/insight/components/radios), [TimePickers](#/eero-design-system/insight/components/timepicker), [DatePickers](#/eero-design-system/insight/components/datepicker), etc.
6. **Footer:** used to contain call-to-action buttons.
7. **Secondary button:** used to cancel the current action.
8. **Primary button:** used to apply the current settings.
9. **Close:** used to close (dismiss) the modal.
10. **Overlay:** used to obscure the content on the current page.

**Do:**

**Don't:**

---

### Pagination

Pagination lets users navigate between pages of content using page numbers, arrows, or other controls.

## Usage

Pagination is commonly used in cases where displaying all the content on a single page would be impractical or overwhelming. It also shows a current page and the total number of pages. The number of items displayed per page is usually configurable. Pagination can improve user experience by making it easier to find and consume content in manageable portions.

## Types

1. **Basic:** used under normal circumstances.
2. **Mini:** used in very rare cases where an extremely high information density is required (not currently used on eero insight at all.)

## Anatomy

1. **Pagination container:** used to contain interaction elements.
2. **Left arrow:** used to open the previous page.
3. **Active page:** used to indicate the current page number.
4. **Inactive page:** used to indicate an inactive page number and to open the page.
5. **More:** used to indicate more pages and open them.
6. **Right arrow:** used to open the next page.
7. **Number per page button:** used to select the number per page.
8. **Skip to input:** used to skip to the selected page.

**Do:**

**Don't:**

---

### Popover

A popover is a small overlay that appears near an element to provide contextual information or additional options.

## Usage

Popovers allow a convenient way for users to access supplementary content or functionality without leaving the current screen or context. Popovers often include text, small visualizations, or other interactive elements, and can be dismissed by clicking outside of the popover, hovering outside of the popover, or by pressing an associated "close" button.

## Types

1. **Visualization:** used to provide detailed information for visualization elements.
2. **Title with text:** used to provide additional information in use cases when the title is necessary.
3. **Text:** used to provide additional information under normal circumstances.

## Anatomy

1. **Container:** used to contain the popover.
2. **Title:** used to provide the title of the element.
3. **Content:** used to provide detailed information about the element.

**Do:**

**Don't:**

---

### Radios

A radio button lets users select one option from a set of mutually exclusive choices.

## Usage

Radio buttons are used in forms and dialog boxes for selecting preferences, settings, or categories, where only one option should be chosen at a time. When one Radio button is selected, any previously selected option is automatically deselected. This behavior ensures that only one option is chosen from the available set.

## Types

[layout:2-col]

[col]

1. **Radio input:** used without a label in cards/tables, etc.
2. **Radio button:** used under normal circumstances.

[/layout]

## Anatomy

[layout:2-col]

[col]

1. **Radio input:** used to interact with the radio button and to indicate its state.
2. **Label:** used to indicate the choice's name.

[/layout]

**Do:**

**Don't:**

---

### Segmented controls

Segmented controls let users choose one option from a set of mutually exclusive tabs arranged in a bar.

## Usage

Segmented controls are commonly used to present choices or filter options where users need to make a single selection from a predefined set. They are particularly useful when the number of options is limited and mutually exclusive. For example, segmented controls are often employed in settings panels, filtering mechanisms, and tabbed navigation.

Each segment in a segmented control is labeled with a specific option or category. When a user interacts with the control, they can choose a single segment by clicking or tapping on it. Once selected, the chosen segment appears visually distinct from the others, indicating the user's selection.

## Types

1. **Default:** used under normal circumstances.
2. **Icons:** used to visually represent segmented elements.

## Anatomy

[layout:2-col]

[col]

1. **Segmented container:** used to house segmented elements.
2. **Active label:** used to indicate the active segment.
3. **Icon segment:** used to visually represent the segment.
4. **Default label:** used to indicate the not active segment.

[/layout]

**Do:**

**Don't:**

---

### Select

A select (dropdown) lets users pick from a predefined list of options.

## Usage

The Select appears as a box-shaped component with an arrow or indicator to expand or collapse the list of options. When expanded, the Select element displays the available options in a scrollable list, and users can choose one option by clicking or tapping on it. The selected option is then displayed within the Select element when the list is collapsed. Select elements are commonly used in forms, filters, view controls, settings panels, and other user interfaces where users need to choose from a set of predetermined choices.

## Types

### Size

1. **Default:** used in the vast majority of cases on web.
2. **Large:** used for hero content on landing pages, sign up flows, and on mobile.
3. **Small:** used in very rare cases where an extremely high information density is required (not currently used on eero insight at all.)

### Type

1. **Single selection:** Used when the Select is used to make a single selection.
2. **Searchable: **Used for longer lists when the menu needs to be searchable.
3. **Multiselect: **Used for making multiple selections. The multiselect Select component can also be searchable.

### Label

1. **Default**
2. **Optional label mark:** when an input in a form is optional. Use this when most form items are required.
3. **Required label mark:** when an input is required. Use this when most form input items are optional.
4. **Label tooltip:** when a form item needs extra explanation.
5. **Label and cation hidden:** when an input is used outside of a form, for example as part of a filtering UX or a page view control.

### Label position

1. **Vertical:** default layout, used in the vast majority of cases.
2. **Horizontal:** used when form items are aligned horizontally, for example in settings cards.

## Anatomy

**Do:**

**Don't:**

---

### Sliders

Sliders let users adjust a value by dragging a handle along a track.

## Usage

Slider is used to provide an intuitive and interactive way for users to adjust values, such as volume, brightness, or zoom level. It consists of a horizontal bar, a draggable handle, and minimum and maximum values that define the range of the slider. The user can make a selection within the range using the handle, and it is reflected in real-time as a numeric value.

## Types

[layout:2-col]

[col]

1. **Basic:** used to select a range of values from 0 and up.
2. **Range:** used to select a range between two values.

[/layout]

## Anatomy

[layout:2-col]

[col]

1. **Container:** used to contain the slider elements.
2. **Min handle:** used to select the minimum value.
3. **Label:** used to provide the name of the slider.
4. **Min input:** used to provide information about the minimum value. Uses the inputNumber component.
5. **Number input buttons:** used to select the number value.
6. **Range container:** used to contain the value range.
7. **Max input:** used to provide information about the maximum value. Uses the inputNumber component.
8. **Tooltip:** used to provide the exact value of the handle. Only shown on drag and on hover.

[/layout]

**Do:**

**Don't:**

---

### Support messages

A support message displays important information, alerts, or feedback to the user.

## Usage

Message components can be used for various purposes, such as:

1. **Notifications:** displaying important information, warnings, or errors to the user.
2. **Alerts:** Notifying the user about critical events or urgent actions that require their attention.
3. **Progress updates:** showing the progress of a long-running operation or task to keep the user informed about its status.

## Types

1. **Info:** used to provide additional information related to an element or an action.
2. **Success:** used to confirm successful events or operations.
3. **Alert:** used to inform users that actions or processes might have unexpected results.
4. **Error:** used to inform users of an error or critical failure.
5. **Data alert:** used to inform users of a warning with data integration.
6. **Data error:** used to inform users of a critical error with data integration.

## Anatomy

1. **Container:** used to contain the messages' elements.
2. **Icon:** used to provide a visual support for the message.
3. **Message:** used to display the information.
4. **Button** (optional): used to provide additional functionality, like calls to action to resolve the issue being called out in the message.

**Do:**

**Don't:**

---

### Switch

A Switch is a control that allows users to toggle between two different states or options.

## Usage

A switch is used to provide a simple and intuitive way for users to toggle features on and off or make binary choices. It is typically represented by two distinct visual states, such as "on" and "off" or "open" and "closed." When the user interacts with the switch, it toggles between these states, indicating the current selection.

## Sizes

[layout:3-col]

**Large.** 50 x 30px

[col]

**Medium** (Default). 36 x 22px

[col]

**Small**. 24 x 16px

[/layout]

**Do:**

**Don't:**

---

### Tab

Tabs are used to navigate between groups of content within a single window.

## Usage

Tabs are represented by a row of clickable labels that allow users to switch between different views or sections of the interface. Each tab typically contains different content that is organized based on a common theme or category. They provide an efficient way to manage and navigate between multiple sections of content within a single interface, making it easier for users to find and access the information they need.

## Types

### Size

1. **Default:** used in the vast majority of cases on web.
2. **Large:** used for hero content on landing pages, sign up flows, and on mobile.
3. **Small:** used in very rare cases where an extremely high information density is required (not currently used on eero insight at all.)

### Icon

1. **Top icons:** used to visually represent the function of tabs in page headers.
2. **Default:** used to visually represent the function of tabs in page sections.

## Anatomy

[layout:2-col]

[col]

1. **Tab container:** used to house tab elements.
2. **Active label:** used to indicate the active tab name.
3. **Icon:** used to visually represent the function of the tab.
4. **Inactive label:** used to indicate the inactive tab name.

[/layout]

**Do:**

**Don't:**

---

### Tables

A table presents data in rows and columns, letting users view and interact with structured information.

## Usage

Tables are often used to organize and present large amounts of data in a structured and easy-to-read manner. Each row in a table represents a single record or item, and each column represents a particular attribute or feature of that record or item. Tables can be used to display a wide range of information, including text, numbers, images, and other multimedia elements. 

Tables are interactive and allow users to sort, filter, and perform various actions on individual cells, such as editing data and providing links to a different part of eero Insight.

## Types

### Basic

### Scrollable

### Editable

**Usage**

In situations where an item within a table requires configuration, the table may contain inputs or other interactive elements. These edits may occur on the cell or row level as needed.

Inline editable tables are preferable over using a modal when the configuration required can be more straightforward than the loss of context and interactions that occurs within a modal. If the configuration requires one or two input selections, an inline editable table is a viable alternative to a modal.

Filtering and sorting of table rows are possible but not typically recommended as the added functionality may lead to mixed states and editable rows that are hidden. Mixing dynamic views of table content with the ability to edit said content in the same UI can create friction and require high cognition from our users.

There are two types of Inline editable tables:

1. **Fixed rows**: the user may configure an item in its row:

1. **Editable rows**: in addition to configuring a row's item, the user can add and remove rows within the table.Rows can be added from an action button located at the top right of the table. Editable rows are added below the proceeding row, and populate within the table top to bottom. Rows may be removed by selecting the “x” icon button placed at the far right end of said row.

_An inline editable table with 3 columns and 2 rows. The second column input is used to fill out the parameters of the first’s selection input. The “x” icon located at the 3rd column will remove the row when selected._

_An example of an inline editable row being added, configured, and then removed._

### High density

High density tables are used in particularly space constrained environments, or where a high amount of data density is required for the relevant use case. As an example, a high density table can be used in a sidebar where the full sized version wouldn’t fit or on a log view where technical users require a high degree of density.

All behavior such as filtering, sorting, overflow scroll, and pinnable columns remain the same for high density tables.

The default row height of a high density row is 32px, and the height of the column header is 40px. Note that rows may expand in height to accommodate text wrapping or embedded components within a row.

## Anatomy

1. **Column:** used for cells storing a particular attribute or feature of that record or item.
2. **Action button:** used for various actions related to the table.
3. **Table name and count:** used to indicate title of the table and the number of rows in the current table.
4. **Table header:** used for column names, information buttons and sorting buttons.
5. **Row:** used for cells storing a single record or item.
6. **Table pagination:** used to interact with table pages.
7. **Back button:** used to go to the previous page.
8. **Current page:** used to indicate the current page.
9. **Forward button:** used to go to the next page.
10. **Page number select button:** used to select the number of pages.
11. **Sorting button:** used to sort cells in the column in an ascending or descending order.
12. **Information button:** used to provide description for a column label.
13. **Column label:** the name of the column.

### Don’t

- Don't use too many tables on a single page, as it can overwhelm the user and make the page cluttered.
- Don't use tables for non-tabular data, as it can make it harder to read and understand.
- Don't use tables with too many rows or columns, as it can make it harder to navigate and find the relevant information.
- Don't use tables for displaying data that requires real-time updates or interactivity, as it can be difficult to maintain and update.
- Don't use tables with long strings of text or images that can cause the table to become too wide or tall.

**Do:**

**Don't:**

---

### Tags

Tags are small labeled elements that organize, group, and filter content within an application.

## Usage

Tags are often employed to aid users in swiftly identifying and accessing pertinent content. By enabling easy navigation through vast quantities of information, tagging assists users in locating specific items of interest. Additionally, tagging serves to structure content, enhancing its discoverability for audiences.

## Types

1. **Basic:** used under regular circumstances.
2. **Colorful:** used to visually differentiate different tags.
3. **Checkable:** used to present a selection status.
4. **Status**: Indicates the status of the network.
5. **All caps:** used only in a combination with a page titles.
6. **Page header**: Indicates the type of the network.

## Tag variants

### **Non-semantic variants**

When tags are categorized by colors for differentiation, they utilize non-semantic colors based on the Insight color system.

### **Semantic variants**

When tags are intended to convey semantic meaning, the use of semantic colors is recommended. There are primary colors and secondary colors.

When tags serve as the main components in a design, primary colors can be utilized. Conversely, when tags are presented alongside various components on the same page, secondary colors should be employed to minimize visual clutter. For example, tag’s secondary colors can be used when displayed in conjunction with network status, which should take precedence over the tag.

## Anatomy

[layout:2-col]

[col]

1. **Container** - Contains a tag’s content.
2. **Label** - Provides a tag’s content.
3. **Close icon** - Dismisses tags.
4. **Status icon** - Indicates a status.

[/layout]

## Source

[Figma: Tag](<https://www.figma.com/file/iwAs4z0pClR30MlfchnfVk/%E2%9B%94%EF%B8%8F-eero-Insight-design-system-2.0-(do-not-use)?node-id=830%3A11773&t=o5zn5YSCWcTvFOHM-1>)

**Do:**

**Don't:**

---

### TimePicker

A TimePicker is an element that allows users to select a specific time.

## Usage

A TimePicker displays a control that allows users to select hours, minutes, and a part of a day (AM/PM). Users interact with the element by clicking or tapping the controls to adjust the time values. Depending on the specific use case, TimePicker UI elements can be customized to display different time formats, time zones, and ranges.

## Types

### Size

1. **Default:** used in the vast majority of cases on web.
2. **Large:** used for hero content on landing pages, sign up flows, and on mobile.
3. **Small:** used in very rare cases where an extremely high information density is required (not currently used on eero insight at all).

### Functionality

1. **Regular:** used to pick a single time.
2. **Range:** used to pick a time range.

### Label layout

1. **Vertical:** default layout, used in the vast majority of cases.
2. **Horizontal:** used when form items are aligned horizontally, for example in settings cards.

## Anatomy

1. **Label:** used to indicate the type of the TimePicker.
2. **Input base:** used to contain input field.
3. **Input caption:** used to provide helper information about the field.
4. **Time icon:** used to indicate the TimePicker field.
5. **Set time:** used to indicate the picked time.
6. **Time picker container:** used to contain a set of digits allowing users to pick the time.
7. **Set current time button:** used to set the current time.
8. **Hours column:** used to allow the selection of hours.
9. **Minutes column:** used to allow the selection of minutes.
10. **Seconds column:** used to allow the selection of seconds.
11. **Apply button:** used to set the selected time.
12. **Selected digits:** used to indicate selected Hours/Minutes/Seconds.
13. **Hours/Minutes/Seconds digits:** used to provide a range of Hours/Minutes/Seconds to select from

**Do:**

**Don't:**

---

### Toasts

Toasts are brief, non-intrusive notifications that appear above page content to provide feedback on actions, errors, or warnings.

## Usage

Toasts should primarily be used for relaying transient messages conveying status of a previous action taken by user. Toasts should not be used for messages with complex concepts or that require further actions by the user. Examples of toast messages include:

1. **Notifications:** Display information about successful actions, such as saving or submitting a form
2. **Alerts:** Notify users about errors encountered during form submission or other operations
3. **Updates:** Provide feedback on ongoing background tasks without disrupting user interaction.

## Types

1. **Info:** Used to provide time-sensitive FYI information related to a page or workflow
2. **Success:** Used to confirm successful events or operations. Unlike the other toast types, success messages will disappear without action from the user after 5 seconds.
3. **Warning:** Used to provide time-sensitive warnings about a page or workflow
4. **Error:** Used to inform users of errors or critical failure

## Anatomy

1. **Container:** the outer wrapper containing the toast message elements. The color of the container should reflect the toast type. Toast messages have a max-width of 400px, and are always 40px from the top of the screen.
2. **Icon:** used to indicate the type of toast message. The icon and color of the icon should reflect the toast type.
3. **Toast title:** used to convey the key information a user needs to know. Example: “Captive portal saved”.
4. **Additional details (optional):** used when additional information is needed to clarify the toast title
5. **Icon button:** Allows the user to dismiss the toast

**Do:**

**Don't:**

---

### Tooltip

A tooltip displays a brief description or hint when the user hovers over or taps an element.

## Usage

Tooltips are often used to provide additional context or clarification for a particular feature or functionality, and can help improve the user experience by reducing the need for the user to search for information or guess the purpose of a particular item. They can be triggered in a variety of ways, such as on hover, on click, or on focus.

1. **Icon button:** The tooltip provides the user with an explanation of the icon button's function.
2. **Informational icon:** The tooltip is utilized to provide additional details about an element.
3. **Value information:** The tooltip helps the user select the exact value on a slider component.

## Types

The types of tooltips can vary **based on the element’s placement**, with the beak pointing to the trigger element.

## Anatomy

[layout:2-col]

[col]

1. **Text label:** Provides helper text.
2. **Container:** Contains helper text.
3. **Beak:** Helps to associate a tooltip to a trigger element.

[/layout]

**Do:**

**Don't:**

---

## Insight Patterns

### Empty states

Empty states appear when a component has no data, explaining why it's blank and guiding users on how to resolve it.

## Usage

When data fails to load into a component, or the configuration is required by the user, we’ll serve an empty state. There are three types of empty states within Insight:

**No data**: for visualizations like graphs, or within tables this empty state simply states that no data is present for the graph or table to render.

Empty states within tables can be as specific as a table cell, or span the entirety of the table content area. For cells, since context is derived from a column title simply using two en dashes “––” is enough to communicate the empty state.

**Initial Empty**: For components such as tables and settings cards. This empty state is typically shown at the beginning of a configuration process. When well written it will communicate what action needs to be taken by the user.

**No results:** In situations where the contents of a component will not render due to incomplete or incorrect criteria. This can apply to a search that yielded no results, or content has been fully filtered out due to content/time filters.

**Good empty states often include:**

- A clear message
- Sometimes helpful tips or suggestions
- If an initial empty state, it will reference the action that needs to be taken by user. So if the empty state reads “No widgets added” then “add widgets” will be the copy in the action button.

**Do:**

**Don't:**

---

### Form

Forms collect information from users to complete tasks — this guide covers designing functional, accessible forms with Meridian components.

## Usage

[layout:3-col]

**Keep it short. **Be respectful of your customer’s time and only ask questions that are essential to the workflow.

[col]

**Order your Form in a way that makes sense to your customer.** Reduce cognitive load by following a predictive order and grouping similar information together.

[col]

**Use concise language. **Labels should be scannable. Using simple unambiguous language helps customers quickly understand what is being asked of them.

[/layout]

[layout:3-col]

**Only display a single primary action button on each page. **Reserve the primary action Button for the action that will get the customer closer to their goal. For additional actions, use secondary and tertiary Buttons.

[col]

**Provide feedback early and help customers recover from errors. **Aim for real-time validation when possible and if an error is detected, provide instructions to fix it.

[/layout]

## Guidelines

[layout:2-col]

### Only ask what’s necessary

Keep your Form short and to the point.

[col]

### Order questions logically

Put required, important, and easier-to-complete Form items first, more complex, advanced, and optional items last.

[/layout]

[layout:2-col]

### Group related fields

Group related fields to organize Forms and help users scan them at a high level.

[col]

### Progressively disclose Form fields

Only show additional information deemed advanced or rarely used to shorten Forms and create an easier user experience.

[/layout]

[layout:2-col]

### Keyboard navigation

Ensure that users can use the tab key to navigate and interact with every interactive component. Make sure to design keyboard focus states when designing new components.

[col]

### Align buttons on right, from most important to least

Right-most button is the primary button, followed by secondary or tertiary buttons. The visual prominence of a button should match the importance of the action

[/layout]

[layout:2-col]

### Concise labels

Form fields should usually be accompanied with a label (note fields alone, or as part of non-form experiences do not always require a label). Labels should be short and help users understand required information at a glance.

[col]

### Use masks to simplify input formatting (coming soon)

Take the burden of formatting off of users, and provide masking to ensure that the right information is inputted. For example, mask phone numbers and credit cards to the correct format.

[/layout]

[layout:2-col]

### Default values

Use a default value only when an overwhelmingly large portion of customers would choose that value. Otherwise, don’t provide a default, and leave the choice up to the user.

[col]

### Avoid disabling Form fields

Avoid showing disable fields, as they are difficult to read and get skipped by screen readers. If a field must be disabled, let the user know why the field is disabled, and provide a link or steps they can complete to be able to edit it.

[/layout]

### Selecting the right Form field

Input fields are the most common for inputting free-form text. Use Text area components for larger text. To collect date and times, use the DatePicker or TimePicker.

To use specific elements in Forms, follow the guidelines provided below:

GuideRadioCheckboxSwitchSelectSelect (multiselect)Select (Searchable)ExampleNumber of predetermined values to choose from2-51 or more2 (on/off)5-155-15Over 10Number of selections users can make1o-all11-all1-allIs there a default optionYesNoYesSometimesSometimesNoWhen will the selection take effectAfter Form submissionAfter Form submissionAfter Form submission (if in a Form) Immediately (if alone)After Form submissionAfter Form submissionAfter Form submissionUse caseMake a single selection from two or more mutually exclusive optionsA single checkbox can be used for make a yes/no choice.A group of checkboxes can be used to select multiple choices.On/off choice that takes place immediately (if alone)Capture a single choice from a menu when space efficiency is needed.Capture multiple choices from a menu when space efficiency is needed.Filterable list of options when there are 10 or more predefined values. Can be used for single or multi selects.

[layout:2-col]

### Helper text

When a concise label isn’t enough context for all your customers to understand what is being asked of them, offer additional explanations.

[col]

### Constraint text

Constraint text can be used if there are specific requirements for the input such as maximum character count, minimum character count.

[/layout]

[layout:2-col]

### Placeholder text

Placeholders disappear when customers interact with the field. Do not use placeholders as labels. Any information that’s critical to the customers’ knowledge or understanding of what is required of them should be displayed in the label, helper text, or constraint text.

[col]

### Tooltips

Use tooltips sparingly to provide additional information and help recognition of the element it’s attached to. For example, use tooltips to explain an advanced Form field or a button with an icon alone.

[/layout]

### Prevent accidental Form closure

If closing a Form would cause frustration for the customer due to loss of data, confirm their intention to leave.

[spacer:8]

### Errors and validation

[layout:2-col]

Error messages help customers see that something has gone wrong. When customers encounter this hurdle we must help them recover from it. According to the Nielsen Norman Group’s article [How to Report Errors in Forms: 10 Design Guidelines](https://www.nngroup.com/articles/errors-forms-design-guidelines/), there are three main principles that should be followed for error-correction flows:

- The error message should be easy to notice and understand
- The field(s) in error should be easy to locate
- Users shouldn’t have to memorize the instructions for fixing the error

[col]

When it comes to writing error messages, we recommend using a passive voice so customers don’t feel like they’re being blamed. Make sure the message is specific and provides enough information for the customer to return to the happy path. For example:

- Do: We couldn’t find an account using this email and password.
- Don’t: You didn’t enter a correct email/password combination.
- Don’t: Something went wrong.

[/layout]

## Application

Forms are used inside Modals within settings, or on the eero setup flow.

## Editorial

- Be concise
- Use sentence casing for all copy. 
- When writing error messages, take the blame
- Make button labels specific to the task

## References 

[Meridian: Forms](https://meridian.a2z.com/patterns/forms/?platform=react-web&siteTheme=blue-light&previewTheme=blue-light)

**Do:**

**Don't:**

---

### Navigation

Navigation lets eero Insight users switch pages, search, access settings, get help, and view at-a-glance network status.

## Usage

[layout:3-col]

**Group features and content.** Content should be grouped into high-level main pages with subsections that customers can dig deeper into.

[col]

**Display clear wayfinding.** Visually indicate a customer's current location.

[col]

**Be scalable.** Assume that content and functional offerings will continue to grow.

[/layout]

[layout:3-col]

**Strive for flat navigation.** To create a “flat navigation,” design your content in a way the customer can access the deepest nested page in the site within two or three clicks.

[col]

**Collapsable side menu navigation. **Use the hamburger menu icon to denote a menu that can be expanded or collapsed.

[col]

**Combine pages where possible. **Create an IA that contains as little redundant information as possible, and optimize for as few pages as possible.

[/layout]

## Anatomy and Examples

### Overall Navigation Behavior

The navigation contains a status area that allows customer support agents and other users to get at-a-glance information about a network no matter what page they are on. They can navigate between pages and sub-pages, which are grouped by relevance and how they are used together.

### Collapse & Expand Navigation

The left navigation can be collapsed and expanded via a hamburger menu to afford more space on small screen sizes or when viewing data that requires more screen real estate. All functionality and clickability are maintained in the collapsed state.

### Anatomy - Overall

1. **Status area:** shows top information about a network that is useful across different page types.
2. **Network name:** The name of the network. Truncates with a tooltip.
3. **Customer name:** The name of the customer who is the owner of the network. This is useful for CX agents during support calls.
4. **Collection status:** see connection status page for more details.
5. **Scrollbar:** used when vertical space requires it.
6. **Selected page and sub-pages:** Shows the current parent page and any sub-pages.
7. **Collapse caret:** click target to expand and collapse a page with subpages.
8. **Selected sub-page:** the currently selected sub-page.
9. **Hover tooltip:** used on the collapsed navigation to display the page name.

### Anatomy - Recommendations section

1. **Recommendations** - clickable link that leads user to the recommendations section on the internet summary page

### Anatomy - Collapsed navigation details

1. **Collapsed status area:** shows connection status about a network.
2. **Collapsed page:** shows a concise menu when it’s collapsed.
3. **Collapsed status area on hover:** Expands upon hover.
4. **Collapsed page on hover: **shows sub-pages.
5. **Page title tooltip on hover and selection: **shows a tooltip of each menu.
6. **Selected subpage: **the currently selected sub-page.
7. **Unselected subpage:** the currently unselected sub-page.

### Top navigation

1. **Collapse left navigation**
2. **eero Insight logo **
3. **Search bar:** see Navigation search for more details.
4. **Help menu**
5. **User profile**

#### Click targets and focus states

All clickable elements in the top menu should include hover states and keyboard focus states. This includes the hamburger menu to collapse/expand the menu, the Insight logo, the search bar, the help menu, and the user profile menu.

## Editorial

- Use sentence casing for all copy. 
- Use short, concise names for pages
- Provide clear helper text before running a search 
- Use consistent date/time displays (see [editorial guidelines](https://docs.google.com/document/d/1GwmldgORj3LMHQ1o7cbYWShqmRjOE-GmYUUuU9YVNFc/edit?usp=sharing)) 

## References 

[https://lucidworks.com/post/best-practices-to-convert-autocomplete/](https://lucidworks.com/post/best-practices-to-convert-autocomplete/)

[https://www.freshconsulting.com/insights/blog/autocomplete-benefits-ux-best-practices/](https://www.freshconsulting.com/insights/blog/autocomplete-benefits-ux-best-practices/)

**Do:**

**Don't:**

---

### Navigation search

Navigation search is a typeahead component in eero Insight's top nav that lets agents search for networks, eeros, or users with live result previews.

## Usage

Use the Navigation search only as an embedded component within the top Navigation in eero Insight. It used primarily to navigate between different networks in Insight, and includes a fuzzy search typeahead experience that provides attributes of a network, user, or eero such as network name, network type, network status, recommendations associated with a network, and the network creation date. The typeahead can be used to navigate directly to the desired page, or the user can run the search to navigate to a more complete search results page.  

## Anatomy

### States

1. **Rest**
2. **Hover**
3. **Expanded:** search bar animates outwards to and increases in height to span the available length of the top Navigation.
4. **Typing:** the search bar transforms into a search typeahead which offers fuzzy search matching to allow searching for, among other things: networks, users, and eeros based on fields we define and allow to be indexed.

Note: this list is only meant to convey the core behavior of the search typeahead component. For a full list of all states, refer to Figma: [Navigation search](<https://www.figma.com/file/iwAs4z0pClR30MlfchnfVk/%E2%9B%94%EF%B8%8F-Insight-2.0-components-(WIP)?type=design&node-id=715-10392&mode=design>). Exact engineering implementation of fuzzy matching is not covered in this documentation.

### Typeahead components

1. **User input in the search bar:** displays a user’s search query.
2. **Educational prompt:** keyboard shortcut to clear search.
3. **Run a general search:** will run a search which leads to the eero Insight search results page.
4. **Educational prompt:** keyboard shortcut to view results (or navigate to network or user.)
5. **Network typeahead items:** will navigate the user directly to the displayed network.
6. **User typeahead item:** will navigate the user directly to the displayed user.
7. **Word match:** shows the user how their input matches with the displayed result.
8. **Network connection status:** shows [Connection Status](https://eds.harmony.a2z.com/#/eero-design-system/insight/patterns/navigation-search) of each network.
9. **Recommendations:** Only shown if the network has recommendations.
10. **Icon:** displays what type of entity the typeahead suggestion is.
11. **Badge:** displays the user type when displaying users.
12. **Additionalinformation:** displays information that is configured to show up below the title of the typeahead item.
13. **Word match in additional information:** used when word matching occurs outside of the typeahead title.

## Application

The Navigation search is used as an embedded component within the top Navigation bar, across both the fleet and network view in Insight. 

## Editorial

- Use sentence casing for all copy. 
- Provide clear helper text before running a search 
- Use consistent date/time displays (see [editorial guidelines](https://eds.harmony.a2z.com/#/eero-design-system/guides/editorial)) 

## References 

[https://lucidworks.com/post/best-practices-to-convert-autocomplete/](https://lucidworks.com/post/best-practices-to-convert-autocomplete/)

[https://www.freshconsulting.com/insights/blog/autocomplete-benefits-ux-best-practices/](https://www.freshconsulting.com/insights/blog/autocomplete-benefits-ux-best-practices/)

**Do:**

**Don't:**

---

### Page

A page pattern defines how components, visualizations, and data are organized in eero Insight to help users accomplish tasks.

## Usage

Pages are built using flexible frameworks that provide consistent design elements across eero Insight, while allowing the flexibility to modify the page to suit the specific user journey being solved. Before using the page framework, it is important to always think about Insight’s [UX tenets](https://eds.harmony.a2z.com/#/eero-design-system/ux-tenets), and consider the following: 

1. What customer problem am I solving? 
2. What is the most important task a user needs to complete on this page? 
3. “So what?” - what is the takeaway from the page I am designing?

## Types & anatomy

### Landing page 

The landing page is the first page a user sees when they see eero Insight. It should provide the top, most important information and actions that a user needs to perform in Insight and provide easy access to relevant information.

1. **eero Insight header** (without search)
2. **Personalized welcome message**
3. **Branded blue background layer**
4. **Content layer **
5. **Search or graph **- optional as needed
6. **Quick actions and links** - optional as needed
7. **Card grouping**
8. **Card grouping header **
9. **Card**

### Full-width page 

Similar to the landing page, the full-width page has no left navigation. It is used when a very tailored experience is required outside of the standard eero Insight fleet or network view, such as for property portal manager.

The content of the page itself follows the same patterns in terms of spacing and allowed components as a standard overview/generic page, but the content is centered in the middle of the page. 

1. **eero Insight header** (without search)
2. **Header section: **can be title alone, without cards or content below.
3. **Flexible section**
4. **Flexible section**

### Overview/generic page 

The overview/generic page framework should be used for summary pages that contain lots of diverse information. It provides the key information necessary to diagnose network problems and/or perform actions and adjust settings for the majority of networks. It can also serve as a jumping point for access to other more detailed pages.

The overview/generic page types can contain many different sections with different types of content. 

1. **eero Insight header**
2. **Status area**
3. **Page navigation**
4. **Page title bar**
5. **Key page action:** the single most used action on the page.
6. **Overflow page actions:** additional actions that affect the whole page.
7. **Top section:** contains key, most important information about the page as well as a title and actions.
8. **Hero card:** can be expandable. Contains most important information about the page.
9. **Section:** flexible areas that can be filled with different types of content.
10. **Section title with count **
11. **Section actions:** actions pertaining to a whole section.
12. **Entity actions:** actions pertaining to a single item or entity within a section.
13. **Section tabs with count**
14. **Section search**
15. **Section content **

### Dashboard overview page 

The dashboard overview page provides a high-level summary of multiple different fleet or network visualizations within a single time interval.

The purpose of the page is to:

1. Provide relevant graphs and visualizations for fleet/network
2. Provide key statistics
3. Indicate whether each dashboard needs further attention 
4. Like the dashboard detail page, the dashboard overview page comes with an interval selector that affects all content on the page uniformly. 

Like the dashboard detail page, the dashboard overview page comes with an interval selector that affects all content on the page uniformly. 

1. **Collapsible page header:** shows the title of the page and view controls the affect the ENTIRE page, such as time intervals or preset filters.
2. **Interval selector:** selects the timer interval to be displayed for all contents on the page.
3. **Dashboard card**
4. **Dashboard title**
5. **Card view control **
6. **Top dashboard statistic **
7. **Dashboard visualization **
8. **Messaging:** does this dashboard need attention or not?
9. **Scrollable content** (alternative to graph)

10. **Collapsible page header:** shows the title of the page and view controls the affect the ENTIRE page, such as time intervals or preset filters.
11. **Interval selector:** selects the timer interval to be displayed for all contents on the page.

### Dashboard detail page 

The dashboard detail page gives in-depth detail about a specific metric. These pages are typically sub-pages of an overview page, and have a back button to easily navigate back to the previous page.

The page should always contain the following:

1. Collapsible title area with view controls and back button if necessary

The page is also flexible, and can contain some or all of the following additional elements:

1. Messaging for alerting when a dashboard needs more attention
2. Top dashboard statistics
3. Visualization(s)
4. Table 

5. **Collapsible page header:** shows the title of the page and view controls the affect the ENTIRE page, such as time intervals or preset filters.
6. **Back button:** navigates back to the previous page, usually the dashboard overview page.
7. **Page interval selector**
8. **Optional additional page controls**
9. **Top dashboard statistics** (or other flexible space)
10. **Dashboard visualization**
11. **Visualization view control**
12. **Table**

13. **Collapsible page header:** shows the title of the page and view controls the affect the ENTIRE page, such as time intervals or preset filters.
14. **Back button:** navigates back to the previous page, usually the dashboard overview page.

## Editorial

- Use sentence casing for all copy, including page titles and navigation items
- Use consistent date/time displays (see [editorial guidelines](https://eds.harmony.a2z.com/#/eero-design-system/guides/editorial)) 

**Do:**

**Don't:**

---

### Page header

Page header provides consistent labeling, actions, and view controls across all eero Insight pages.

## Usage

The page header is meant to be a flexible framework that provides consistency to page titles, actions, and controls. Not all page headers will be alike, and certain elements may be present in some, and absent from others. In addition to the page header titles, page headers can contain elements that affect the _entire page_, such as view controls like [interval selectors](https://eds.harmony.a2z.com/#/eero-design-system/insight/components/interval-selector) or elements that change the data being displayed.

When view controls are present on a page, the page header becomes pinned to the top of the page on scroll.

When view controls are not present on the page, the page header scrolls along with the rest of the page content.

## Anatomy

### Animation

When the page header contains a view control, the view control section becomes pinned on scroll. This includes a small animation as the user scrolls down the page. The page header returns to the default, unscrolled state when the user scrolls back to the top of the page.

### Elements

1. **Page name** - The name of the page.
2. **Page tag (optional) **- Tag associated with the page.
3. **Page information (optional)** - Additional information related to the page
4. **Page actions (optional)** - Up to 3 actions that affect the entire page
5. **View controls toolbar (optional) **- Pinnable toolbar that houses view controls - these are controls that change the *view *of the entire page, but do not perform any changes or actions.

_The following are examples of the view controls that can be used in the toolbar: _

1. **Interval selector - **Custom component for selecting a date/time interval for viewing analytics pages in Insight. Affects the entire page, including all charts and tables.
2. **Additional view control component** - customizable component that controls the view of the entire page
3. **Additional view control component** - customizable component that controls the view of the entire page.

### Types

1. **Toolbar: None **- Used for pages do not require any sort of view controls, i.e. controls that affect the entire page. This header scrolls with the main content of the page.
2. **Toolbar: Interval selector - **Used when a basic interval selector is required, but no other view controls on the page.
3. **Toolbar: Interval selector + Presets **- Used when preset filters that affect the view of the entire page are required. Note: only use this variant when the presets form a core part of the page’s usage. Preset filters typically act as shortcuts for filtering tables.
4. **Toolbar: Interval selector + Additional components** - Used when other components that affect the view of the entire page are required. These components could be selects, segmented toggles, or switches.
5. **Toolbar: Search **Used when an entire page must be searchable. Shown here with preset filters, but presets do not always need to be present.
6. **Toolbar: Preset filters + Viz - **Used when a pinnable visualization is needed to help control the view of the page. Currently only used on Event stream phase 3.

#### Special considerations for the **Preset filters + Viz **variant:

The _preset filters+viz_ variant is a special page header type that includes a built-in visualization to help aid in filtering down the page. This variant is best suited for large, tabular data sets such as that found on event stream. The page is first scoped to a specified timeframe via the [interval selector](https://eds.harmony.a2z.com/#/eero-design-system/insight/components/interval-selector), then further scoped by the presets and brush component. Note that presets and brush both act as filters on the table

## Application

The page header appears at the top of every page in Insight. It can either be used with or without the pinnable view control section, which can have components contained within it such as the Interval selector or other elements.

## Editorial

- Use sentence casing for all copy. 
- Provide clear helper text before running a search 
- Use consistent date/time displays (see [editorial guidelines](https://eds.harmony.a2z.com/#/eero-design-system/guides/editorial)) 

## References 

**Do:**

**Don't:**

---

### Panel

Panels are used to provide access to secondary information or controls while still providing access to the screen's primary information.

## Usage

Panels can hold arbitrary content and components. Panels can display a wide variety of content and layouts, ranging from a list of actions to supplemental content in a tabular layout. As of 2023, Panels are only used for Recommendations and Topology.

\*\*

## Anatomy

1. **Title area** - The pinned section at the top of the panel. Contains key information and
2. **Panel title **- Title of the panel
3. **Panel subtitle (optional)** - Additional information below the title
4. **Next/previous buttons (optional) **- Used for navigating between different panels.
5. **Close button (optional) - **For closing panels that are not permanently opened.
6. **Panel header ** - The header component that contains 2,3,4, and 5
7. **Tabs** - Tabs for switching between multiple views in the panel.
8. **Flexible content area **- Used for displaying a variety of different elements within the panel.

## Application

Panels are used specifically for recommendations and topology in insight as of 2023. Their usage could expand to things like support and feedback or other features in the future.

Standard panels should always be triggered from a user action. Persistent panels are triggered on page load.

## Editorial

- Panels should contain content and actions about the single subject that it pertains to
- Don’t overload users with a wall of text.
- Use sentence casing for all copy. 

## References 

**Do:**

**Don't:**

---

### Setting card

The Setting card pattern forms the core framework for how setting information is organized and edited.

## Usage

The setting card is primary used in the Network settings page but not limited to other pages with editing capabilities, such as the eero page, Organization settings, and MDU settings.

## Types

1. **Default (full-width)**: used for most settings
2. **Single item (half-width)**: used for settings that contain a single editable action / information (e.g., simple setting toggle).

## Anatomy

### Static state

The static state is the default state of a setting card. Here, users can view setting information at a glance. The card can expand to view more details that does not fit in the top header portion of the card.

1. **Container **
2. **Setting header title **
3. **Setting header subtitle (optional) **
4. **Setting detail title **
5. **Setting detail subtitle **
6. **Edit button **
7. **Expand / collapse button (optional)**

### Editing state 

The setting card changes to its editing state when the Edit button is clicked.

1. **Container**
2. **Setting header title**
3. **Control that affect the rest of the setting card at the highest level** (correlates to Setting header subtitle).
4. **Editable components title** (usually correlates with Setting detail titles)
5. **Editable components**
6. **Cancel and Save button**
7. **Delete button **(optional)
8. **Message **(optional).

### Padding and spacing

The setting card is primarily made up of 24px padding and spacing, with the exception of the border to the expanded portion of the card.

It’s important to know that the information at the** top header portion does not have a fixed width**, while if the card is expandable with more information, the **below section has a fixed width.**

This is to maximize the information visible when the setting card is closed while also maximize scannability and organization when there is more information expanded.

## Responsive design

### Static state

When the card is resized to smaller widths, the setting detail that can no longer fit in the top portion of the card moves down to the bottom expandable section at the **top most left **side in sequential order.

Since the information at the top header portion of the card does not have a fixed width and instead wraps to the content, there may be instances where the detail title or subtitle is exceptionally long (_ex. Information TWO and THREE_).

When the card is resized down to a smaller size and the detail moves from the top header to the **bottom expanded portion**, the long text must fit into a **fixed width**. The text may wrap into multiple lines like shown.

### Editing state

When the card is resized to smaller widths, the text and components wrap in the following order.

## Disabled / view only rules

There are a 4 notes cases in which the setting card is not able to be edited.

### Case 1

In the cases where:

- The user has permission to edit in Insight but another selection is limiting their access (e.g., Bridge mode)
- The action is temporarily unavailable (i.e. the system broke and the action isn't available for anyone)

The Edit button is in its disabled state with a tooltip describing the situation + what (if anything) the user can do to gain access to the action again when hovered.

### Case 2

If a setting that is normally **editable only in the app** and not in Insight, there is an info icon in place of the Edit button with a tooltip when hovered.

### Case 3

If the setting is an **informative, view-only\*\***setting\*\* that is never editable in Insight or the app, there is no Edit button.

### Case 4

If the setting is **not relevant to a given user or network type**, hide the setting card for that user/network type

---

### Setting patterns

## Overview

### What are ‘Settings’ in Insight?

Settings are the* view* (sort, filtration), _adjustment_, and _saving_ of various network or user configurations. Settings enable users to manipulate these configurations. Insight uses a variety of interaction patterns and components to help users in different contexts.

#### What are NOT settings?

- Actions or commands that trigger an event (like “restart device” or “run speed test”) but don’t configure a parameter.
- Creation or onboarding: Account, org, or network creation

## Considerations

[layout:3-col]

### Complexity

Lower-complexity settings typically affect a single variable, require minimal explanation, and are quick to complete. Higher-complexity settings often involve many complicated or interdependent changes. These settings may require more context and space.

[col]

### Impact & Reversibility

Settings that are low-risk or easily reversible should introduce less friction, allowing users to make quick adjustments. Conversely, settings that carry significant consequences or are difficult to reverse should introduce more friction to confirm intentionality (e.g., deleting a network).

[col]

### Altitude

Low-altitude settings affect the immediate task and should be placed near the primary workflow. High-altitude settings have broad impact—affecting multiple areas across the product—should be placed at a higher level (e.g., page-level controls, fleet-wide settings).

[/layout]

[layout:3-col]

### One change vs. many

Single changes require granular control to support occasional and targeted adjustments. Applying changes across multiple items at once demands efficiency, enabling users to make many updates quickly.

[col]

### Frequency of use

Settings that users adjust often, especially in time-sensitive contexts, should be easily accessible and surfaced close to the primary workflow. Less frequently used settings can be placed deeper in the product or tucked away—for example, in the expanded portion of a card.

[col]

### Unique vs. standard

Unique settings are tailored to a specific item, which may look different from item to item. Standardized settings apply the same structure or controls across multiple items. They often use repeatable patterns such as tables or lists, which support scalability, filtering, and easier comparison.

[/layout]

## Component usage

Settings are created using compound components assembled in specific ways: [**setting cards**](https://eds.beta.harmony.a2z.com/#/eero-design-system/insight/patterns/setting-card), [**tables**](https://eds.beta.harmony.a2z.com/#/eero-design-system/insight/components/tables), and [**modals**](https://eds.beta.harmony.a2z.com/#/eero-design-system/insight/components/modal).

## Setting cards

Setting cards provide inline editing functionality to users so they don’t lose context. Because many settings can have disruptive effects on networks, setting cards require an explicit action to enter into an edit mode and to save changes.

### Usage

Setting cards are primarily used on pages that must house diverse information types together. Their standardized formatting creates a common editing pattern for diverse settings with different parameters. Additionally, they have affordances for both a view and edit mode, allowing users to scan a compact view mode without the space required for editing.

### Sub-types

**Full-width**

Full-width setting cards are used in the majority of cases where there are multiple editable parameters

**Half-width**

Half-width setting cards are used for settings that only have 1-2 parameters (such as enabled/disabled). They are used alongside other half-width setting cards and organized into sections based on theme.

### Don’t 

- _Don’t_ use setting cards for highly repetitive settings that exclusively contain the same parameters across multiple items. Instead, consider using a table.
- _Don’t_ use full-width setting cards for settings that contain a single control. Instead, use half-width cards
- _Don’t_ use inline editing on setting cards. These cards are designed with a separate edit and view mode, and require explicit confirmation when saving

See [full guidance](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3757703170/Setting+card?atlOrigin=eyJpIjoiZDExNTRmMGIzYjJjNDY2ODkzYzAyY2Q5NTE1MjgxNDUiLCJwIjoiYyJ9) on setting card layout and responsiveness.

## Tables

Tables are used for settings that contain multiple repetitive, elements that share a common format. They allow easy comparison between common configurations across entities, and allow for a dense information layout.

### Usage

In Insight, tables are used settings of that are standardized in content. Tables make it easier to scan, compare, and manage multiple settings at once, while also supporting sorting and filtering to quickly find and act on specific items.

### Sub-types

**Inline editable by default **

These tables are designed for use on pages or use cases where editing is the primary intent, and are used in scenarios where bulk editing, or editing in rapid succession, is required.

Because many elements in these tables may be edited in rapid succession (bulk edit), users are required to make an explicit confirmation to save their changes. This save confirmation may be in the page header (when an inline editable table is on a page), or within the header of a setting card (when an inline editable table is embedded within a card)

**Inline editable on demand **

These tables are designed for use on pages or use cases with viewas the primary intent, or where quick, single-setting editsare required (as opposed to bulk edits).

Because the edits happen one at a time, there does not need to be a page or card level save confirmation for these tables.

### Don’t 

- _Don’t_ use tables when the number of expected settings is below 7. Instead, use setting cards
- *Don’t *use tables as a setting pattern for content with diverse controls
- Don’t use lazy loading on tables that appear above other content, as this will push the other content down

See [full table UX guidance](https://eds.beta.harmony.a2z.com/#/eero-design-system/insight/components/tables).

## Modals

Modals are focused UI elements that appear on top of the main screen and require interaction before returning to the underlying content.

### Usage

When used for settings, modals are used for: (1) specialized, focused flows that require more screen real estate and/or multiple screens (i.e. task-based flow), (2) global settings invoked from multiple pages that must have a common pattern, and (3) confirmations for sensitive or destructive actions.

### Sub-types

**Large**

Large modals are used in specialized use cases that require a full page, focused experience to complete a specific task.

**Small**

Small modals are used when standardized setting configurations need to be invoked from multiple locations without breaking context, or as a confirmation when a setting triggers a sensitive or destructive action

### Don’t 

- _Don’t_ use modals for simple, single field edits. Instead, use an inline field
- Don’t use modals when other content on the page needs to be visible for context

See [general guidance](https://eds.beta.harmony.a2z.com/#/eero-design-system/insight/components/modal) on modals.

## Editing

### Individual fields vs. Batch

#### Individual fields

Used when an individual field is editable and placed among non-editable content. This pattern is used when an editable value benefits from quick access in context, without requiring the user to navigate away to a dedicated settings screen.

#### Batch

Batch editing is the ability to apply changes to multiple settings in rapid succession or at once, rather than updating them individually. Batch editing can take the form of going through a table of settings to define each, or applying one setting to multiple items at once.

### Inline vs. Edit mode

#### Inline

Inline settings are controls that appear directly within the main page, rather than opening a modal, setting card, or separate page. They let users adjust values in place without breaking context.

Inline settings are frequently used in tables. and either require an edit mode (used for quick edits) or are in an edit mode by default (used for bulk configuration)

#### Edit mode

Used when multiple parameters are edited together, or when changes may disrupt network connectivity, settings require an explicit edit mode. All configurations are saved at once after the user chooses to save, with options to cancel, discard, or sometimes revert to defaults.

Edit mode also supports a denser read-only view by default, while switching into edit mode provides more editing real estate.

## Saving

### Auto-save

Automatically saved changes are reserved for instances where the updates are lighter and non-disruptive to network performance, such as editing **individual fields** or **in-line** editing.

### Manual

Manual saving is required for **edit mode **and **bulk configurations**, when multiple edits are made for a given object. Manual saving generally provides an extra layer of security for important, potentially disruptive changes.

## Application examples

### Network settings

Network settings use setting cards to support both viewing and editing, which are critical for CX agents. Setting cards provide inline editing without losing context, with explicit actions required to enter edit mode and save changes.

### Captive portal

The captive portal is an example of a specialized network setting that requires more screen real estate. It uses a modal to group multiple editing fields and saves all changes at once.

### Radio settings

Radio settings are an example of **view-intent pages **with secondary editing needs. Individual cells become editable when selected, with changes saved immediately. This preserves a clean viewing experience while supporting quick, single-setting edits, rather than bulk operations.

### Alerts

Alerts are an example of **edit-intent pages **that require bulk operations. Fields are **inline editable by default** to support rapid, sequential edits across multiple items, with explicit save confirmation to prevent accidental changes.

### Masthead settings

Some settings are available from the masthead, allowing users to access them from anywhere in the app.

**Do:**

**Don't:**

---

### Skeleton

A shimmer (skeleton) loading pattern shows animated placeholder shapes mimicking the incoming content layout instead of traditional spinners.

Shimmer loading patterns have many advantages over traditional loading indicators, including:

- Improving the perceived performance of the application
- Reducing cognitive load by providing visual cues into the eventual page layout
- Eliminating surprises and confusion by showing a predictable UI before content loads
- Enhancing the aesthetic appeal of the application and loading content in a more modern way

## Usage

### When to use shimmer

Shimmer should be used for entire pages or large experiences where load time is typically under 10 seconds. Examples of when to use shimmer include: an entire page, a large module on a page such as a table or visualization, or an element where it is important to give users a sense of the eventual layout.

### When to use traditional loader

Traditional loaders are better suited for smaller modules or individual components. Examples of when to use a traditional loader include: within an individual button after the user takes action, within a small dialog or popover, or connected to a particular action on a page such as a user running a speed test.

When loading time is expected to be over 10 seconds, a determinate loader should be used instead of either shimmer or a traditional loader.

## Anatomy

Shimmer comes in a few different shades and variants that are used depending on the background color of the element they appear on.

1. **Shade = Light -** used for elements that appear on `layer-page` (`white` in light mode) colored backgrounds. For example, this would be used to block in text appearing on a card.
2. **Shade = Dark -** used for elements that appear on `background-page` (`gray-1` in light mode) colored backgrounds. For example, this would be used to block in text appearing directly on the page background.
3. **Shade = Brand -** used for elements that appear on the `background-midnight` branded surfaces such as the left and top navigation. For example, this would be used to block in contents in the network status area before it loads in the left navigation.

## References 

[https://medium.com/lattice-what-is/shimmer-ui-a-better-way-to-show-loading-states-aa1f4e563d17](https://medium.com/lattice-what-is/shimmer-ui-a-better-way-to-show-loading-states-aa1f4e563d17)

[https://www.nngroup.com/articles/skeleton-screens/](https://www.nngroup.com/articles/skeleton-screens/)

**Do:**

**Don't:**

---

### Table filtering

Table filtering provides a consistent affordance to narrow data in eero Insight tables.

## Usage

Table filtering uses a pattern similar to Excel or Google Sheets to allow filtering and sorting based columns in a table. The filter system is modular, meaning that filters and sorting can be enabled or disabled on individual columns in a table based on what the expected user need is. When multiple filters are applied to different columns, an AND operation is performed, allowing users to stack filters

## Anatomy

### Types

1. **Sort alone** - Used for columns that typically have a very large number of distinct values, such as dates
2. **Filter checkboxes alone **- Used for columns that will only ever have 6 or fewer distinct values
3. **Sort and filter checkboxes ** - Used for columns that will only ever have 6 or fewer distinct values and where sorting is desired
4. **Sort, search, and filter checkboxes **- Used when a relatively large number of distinct values are expected, requiring search as well as sorting.
5. **Search and filter checkboxes - **Used when a relatively large number of distinct values are expected, requiring search.

### Anatomy

1. **Count** - Number of rows in the table. Updates after filters are applied
2. **Sort indicator** - Shows when column has been sorted (different icons used for sort ascending and sort descending)
3. **Filter indicator** - Shows when a column has been filtered
4. **Reset filters button** - Shows up after a column is filtered. Resets all filters
5. F**ilter and sort dropdown button **- button that triggers the filter and sort dialog. Uses the tiny icon button component.
6. **Filter and sort dropdown** - the dialog where filters and sort options are applied
7. **Sort options** - Allows the column to be sorted ascending, descending, or with no sort. No two columns may be sorted at the same time.
8. **Search in filters** - searches the values shown in the filters for the column being filtered
9. **Filter checkboxes** - Shows up for every *unique *value within a column in the *entire *table, including in columns outside of displayed page within the table. Does not show up outside the selected interval for the page.
10. **All checkbox** - allows all checkboxes to be either selected or deselected
11. **Menu button group**
12. **Filter button**
13. **Cancel button**
14. **Reset button** - resets filters for the current column

### Don’t 

- Don’t allow filtering on columns that contain more than one type of data
- Don’t place important columns that will require frequent filtering too far to the right

## Application

Table filtering is used on all tables within eero Insight 2.0. Note that the tables often only show data within a specific *interval, *defined by the *interval selector *at the top of the page.

## Editorial

- Filter checkboxes should match the data in the column.
- Use sentence casing for all copy. 

## References 

**Do:**

**Don't:**

---

### Toolbars

## Overview of toolbars

Toolbars contain affordances to adjust information viewed below. They can filter and focus table data or entire pages in Insight.

As we expand our product offering to address enterprise applications, Insight will need to manage larger datasets and more complexity in lists and tables. At the same time, existing Insight affordance patterns need more consistency for both page level controls and table controls.

Here we propose updates to our existing toolbars (currently a sub-component of the [Page header](#/eero-design-system/insight/patterns/page-header)), and a new application for toolbars in [Table filtering](#/eero-design-system/insight/patterns/table-filtering).

## Toolbar improvements in page headers

When control bars act as page-level controls, they pin to the top of the page on scroll and collect critical page header affordances that users need to manipulate views as they progress down the page. Our current page headers feature this behavior but abandon the action buttons when scrolled. We should improve page header toolbars with intentional rules about collecting and compressing necessary affordances.

### Proposal: include action menu on scroll

Retain action button functionality when the page header scrolls

\*\*

## Toolbars for table controls

Table affordances lack consistency in Insight today. Introducing toolbars above tables will provide an affordance pattern that simplifies our UI and scales to more complex tables in the future.

### Proposal: unify table affordances within local toolbars

Bring all table affordances into a toolbar at the head of the table. Introduce “presets” as faster, redundant way to filter (does not replace column header filters).

## Examples

## Table toolbars as page headers

For future designs that call for complex, table-oriented pages, a toolbar can serve both as a page header element and a table control. In these cases, it should match page header behavior and stick on scroll.

### Example: Network list

\*\*

---

### Visualization

Visualization transforms raw data into interactive charts, graphs, and other visual elements within eero's UI.

## Goal

The primary goal of visualization is to communicate complex data and patterns effectively to users, allowing them to comprehend and interpret the information more easily. By using visual elements, data visualization helps users identify trends, patterns, correlations, and outliers within the data, enabling them to make informed decisions and gain valuable insights.

## Principles

[layout:2-col]

### Simplify complexity

The visual representation should simplify complex data, making it easier for users to understand and interpret. Avoid clutter and unnecessary details, focusing on the essential information.

[col]

### Clear communication

Data visualization should effectively communicate the intended message to users. Use appropriate labels, titles, and annotations to provide context and guide users in interpreting the visuals correctly.

[/layout]

[layout:2-col]

### User-centric 

Ensure that the visuals align with their knowledge level and goals, providing relevant insights and actionable information.

[col]

### Visual hierarchy 

Establish a clear visual hierarchy to guide user attention and highlight the most important data points. Use size, color, and placement to emphasize key elements and facilitate quick comprehension.

[/layout]

[layout:2-col]

### Consistency 

Maintain consistency in the design elements, such as colors, fonts, and styles, across different visualizations within the user interface. This fosters familiarity and ease of use, enhancing the overall user experience.

[col]

### Accuracy

Guarantee the accuracy and integrity of the data presented in the visualizations. Perform thorough data validation and ensure that the visual representation reflects the underlying data accurately.

[/layout]

## Types

### Line

Line charts are used to depict how a particular variable or a set of variables changes over time or along a continuous axis, where all data points are connected by lines. Each data point represents a specific value at a given point in time or along the defined axis. The line's trajectory provides a visual depiction of the data's behavior, allowing users to identify trends, patterns, and changes more easily.

[layout:2-col]

#### Low density

[col]

#### Step density

[/layout]

[layout:2-col]

#### High density

[col]

#### High density multi-line

[/layout]

#### Tips:

- Use for displaying up to 5 categories or data variables
- Use a single color’s scale when displaying change over time
- Use a legend when displaying a line chart containing 2 or more lines

### Bar

Bar charts are used to compare values across different categories or groups and highlight variations or relationships in the data, where rectangular bars display categorical or numerical data. Each category or group is represented by a separate bar, with the length or height of the bar indicating the value or magnitude of the data it represents. 

In the case of numerical data, bar visualizations can also be used to represent ranges or intervals by using stacked bars or grouped bars. Stacked bars show the composition of the total value for each category, while grouped bars allow direct comparison of values within each category.

[layout:2-col]

#### Single bar

[col]

#### Grouped bar

[/layout]

#### Tips:

- Use up to 5 categories or variables
- Use multiple colors when comparing categories
- Use single color ramp when displaying change over time
- Use a legend when comparing 2 or more categories

### Mixed bar

Mixed charts are a combination of both bar charts and line charts into a single visual representation. It incorporates both rectangular bars and continuous lines to display and compare different types of data simultaneously. In these charts, the bars are typically used to represent categorical or discrete data, while the line(s) are used to represent continuous or sequential data. 

#### Tips:

- Use for displaying up to 5 categories or variables
- Use multiple colors when comparing categories
- Use single color ramp when displaying change over time
- Use a legend when comparing 2 or more categories

### Brushes

In some of our visualizations, a brush can be added as an interactive tool that lets users select a specific region of a visualization by clicking and dragging over part of it to filter or highlight data within that selected area. Brushes within visualizations can be used to filter other parts of the page, such as a table. An example of this can be found in the Client device details page.

Brushes can be used in line and timeline components, as well as on their own in select circumstances, such as in the page header.

### Circular and semicircular gauges

**Circular** gauge charts are used to illustrate the amount of a numeric value within a known maximum value or a percentage. The data is displayed by the fill within the gauge and accompanied by a numeric value in the center of the chart. The circular shape of the gauge allows for a more compact display compared to linear or bar charts, making it suitable for small spaces or dashboards where multiple data points need to be presented together.

**Semicircular gauge** charts are similar to Radial ones but recommended to use in scenarios when it requires more prominent representation of the data.

#### Tips:

- Use to highlight a single metric
- Use when a specified range is defined
- Use categorical color scale
- Don’t use to highlight a trend
- Don’t use to indicate part-to-whole
- Don’t use sequential or diverging color scales

### Progress bar

Progress bar charts are used to illustrate a percentage. It typically consists of a horizontal bar that is segmented or filled to indicate the degree of completion or progress. The progress bar can be divided into discrete sections or filled gradually, representing the proportion of the task or process that has been completed. As the task progresses, the bar fills up from one end to the other, visually indicating the advancing completion. The length of the progress bar represents the total duration or quantity of the task or process, while the filled portion represents the completed portion. Note: The progress bar is sometimes typically used as a static visualization on dashboards, rather than a loader that updates dynamically.

#### Tips:

- Use to highlight a single metric
- Use when a specified range is defined

### Donut

Donut charts are used to illustrate the distribution of categorical data within a whole. They are particularly useful for showcasing relative proportions or comparing different groups to the total. Users can easily grasp the relationship between each category and the total value by comparing the sizes of the sectors. The size of each categorical sector corresponds to the proportion or percentage of the whole it represents.

#### Tips:

- Use up to 5 data points
- Use simplified data when possible
- Use with part-to-whole data sets
- Don’t display donut slices less than 10%
- Don’t use to indicate a set range

### Area

Area charts depict quantitative data as a series of data points connected by a line, with the area between the line and the horizontal axis being filled. The filled area visually emphasizes the magnitude of the data and helps users perceive the overall pattern or trend more easily. It is commonly used to display trends and patterns over time or along a continuous axis. Area charts are particularly effective in showing the cumulative or aggregated values of multiple variables over time. By stacking multiple areas on top of each other, each representing a different variable, users can compare the contribution of each variable to the overall trend.

[layout:2-col]

#### Single series

[col]

#### Multi series

[/layout]

#### Tips:

- Use for displaying up to 5 categories or variables
- Use a single color’s scale when displaying change over time
- Use a legend when displaying 2 or more areas

## Editorial

- Select the most appropriate visualization type that effectively represents the data and supports the intended message. Consider factors such as the nature of the data, the relationships to be portrayed, and the target audience. 
- Simplify the visualization by eliminating unnecessary elements and reducing visual clutter. Remove any distracting elements that do not contribute to the understanding of the data. 
- Ensure the data used in the visualization is accurate, reliable, and relevant to the editorial context.
- Provide sufficient context and annotations to help the audience interpret the visualization correctly. Include informative titles, axis labels, legends, and explanatory notes that clarify the meaning of the data and provide necessary background information.
- Use consistent and intuitive color schemes that enhance clarity and comprehension. Color choices should support the data hierarchy, highlight important elements, and enable users to distinguish between different categories or data points easily. Consider color blindness and ensure accessibility by using color combinations with sufficient contrast.
- Maintain visual consistency throughout the visualization and across related visualizations within the editorial content. Consistent use of types, colors, and layouts helps establish a cohesive visual language and fosters better recognition and understanding for the audience.

---

## App Foundations

### Colors

Color is an essential component of the eero app’s UI. It helps to establish our brand identity, convey emotions and mood, bring consistency, and guides users through essential networking concepts.

## Key concepts

[layout:2-col]

**Color **highlights important information and creates focal points. However, too much color can confuse viewers and disrupt the visual hierarchy.

[col]

**Color ramps** modify a single base tint to create various shades.

[/layout]

[layout:2-col]

**Themes** set the interface tone and are largely influenced by existing eero branding and products.

[col]

**Color tokens** define _how_ color themes are applied to specific elements within the design system

[/layout]

## Colors in the eero app 

### Core color ramp 

To account for the greater number of states, components, and variety of information on web, the “base tints” used on the app were translated into color ramps, each consisting of 10 steps:

_For all current and exact HEX value refer to Figma: App variables._

## Usage

In order to apply the app’s core color ramp to specific elements, we use **design tokens**, or **semantic variables**. Design tokens go beyond the color ramp, in that they **semantically** define how the color ramp is used in the design system.

Our app design tokens mainly follow a **foreground (fg)** and** background (bg)** naming pattern (read more about it [here](https://uxdesign.cc/how-to-define-color-usage-through-semantic-sets-for-design-systems-99445804233d)).

[spacer:40]

[layout:2-col]

**Foregrounds (fg)** are defined as text, icons, and any elements that sit on top of a background.

[col]

**Backgrounds (bg) **are defined as the background color of individual UI elements and whole sections or bodies of content.

[/layout]

[spacer:40]

Periwinkle example:

_For all current semantic variables, refer to Figma: App variables._

This way, any updates to either the color ramp or the application of that color ramp to the designs are consistent.

For example, if we decide to change the color of **label-periwinkle-primary** from **periwinkle-6 **to **periwinkle-5**, we simply re-assign the** periwinkle-5 **color ramp value to the **label-periwinkle-primary** token, and all components and screens with green text will get updated.

Or, if we decided to tweak **Periwinkle-6 **slightly, all components that use design tokens attached to Periwinkle-6 will be automatically updates.

### Interface and supporting colors 

**Interface colors** form the primary colors used across the range of components, text, and pages in Insight. They form the core of the UI, from page backgrounds, card borders, button backgrounds, and messaging for errors and success. Examples include colors for button fills, page backgrounds, and connectivity status. 

**Supporting colors **are used primarily for data visualizations, illustrations, premium features, etc. 

### Specific colors to convey connectivity status 

The app has several specific device or network statuses that have consistent colors. **Green**: Online / active, **Red:** Offline / critical, **Orange:** eero offline / warning**, Turquoise:** Backup internet, **Gray: **Paused, disabled, or inactive. For more guidance on status, see Connection status (App and Insight).

### Specific colors to convey errors, warnings, and success 

**Red: **Alert, **Orange: **Warning, **Green:** Success, **Periwinkle:** Info.

### Text color

Text on** light mode** is based on the eero branded Midnight blue ramp.

\*\*

Text on **dark mode **does _not_ attach to the core color ramp and is based on #FFFFFF white’s opacity.

[layout:2-col]

**label-primary **is the most prominent and important content on the app. It usually includes titles, headers, and the main content.

[col]

**label-secondary** is for content that is important but not as critical as primary text. It is mainly used for the body text on a screen. It is also the color used for inactive or disabled status.

[/layout]

[layout:2-col]

**label-tertiary **is used for additional information like section headers, row subtitles, footnotes, and icons.

[col]

**label-quaternary **is primarily used for disabled states that users are not able to interact with and icons.

[/layout]

**Do:**

**Don't:**

---

### Corner radius

A corner radius determines the degree to which a corner of an element is rounded, typically measured in pixels.

## Usage

The human brain is naturally wired to perceive sharp objects as potential threats (e.g., baby-proofing a house). Rounded corners give a sense of safety and approachability, encouraging users to interact with the app.

Corner radius is also used to guide the user's eyes towards important content or actions on the screen by creating a sense of depth and information hierarchy. Larger corner radii are used for primary interface elements, and smaller radii are used for secondary elements.

##

Corner radius scale

To ensure that the corner radii are consistent across all design elements, use appropriate treatment according to the table below.

**Do:**

**Don't:**

---

### Dynamic type

Dynamic Type is a feature in iOS that allows users to adjust the size of text throughout apps to enhance readability and accessibility. Similarily, Android has accessibility settings that increases text size. These guidelines ensure users can comfortably read and navigate through the eero app, regardless of device settings.

## Maintain proportionality

As text size increases, line height and spacing should increase proportionally. A design that works at smaller text sizes can become cramped and unreadable when scaled up, leading to a poor user experience. Use** relative units **to keep the layout fluid.

Exception: navigation and tab bars should maintain a consistent size to avoid usability issues.

## Avoid truncation – use multi-lines instead

As the eero app relies heavily on important information and data, truncating content can severely impact the user experience. For example, if a device's IP address gets cut off due to larger font settings, users may struggle to read and resolve issues effectively.

When text is too large to fit in the single line the text should wrap to the next line. We should **avoid truncating** in most situations, and never truncate information that can only be found in one place.

However, in situations where text wrapping isn't feasible, it’s important to prioritize the key information and provide alternative ways to access the full content.

## Scrolling for Overflow Content

Every screen in the app should be a scrolling view. As text grows, it will naturally require more space. Imagine a customer who has a small phone size and a larger Dynamic Type size chosen. Without scrolling, important content will get cut off.

It’s important to note that screens with limited content, such as the "Create an Account" screen, might lead developers to overlook the need for scrolling functionality. However, if we increase the text size by 200%, information is cut off without a scrolling feature in place.

Ensure vertical scrolling is enabled across all screens and avoid hard-coded heights. Rely on auto-layout and responsive constraints so that content can expand as text grows, with scrolling acting as a fallback.

## Icons

Dynamic text does not apply to icons or visuals with the exception of icons that are relied on to convey important information.

## References

[https://developer.apple.com/design/human-interface-guidelines/typography](https://developer.apple.com/design/human-interface-guidelines/typography)

[https://developer.apple.com/documentation/uikit/uifont/scaling_fonts_automatically/](https://developer.apple.com/documentation/uikit/uifont/scaling_fonts_automatically/)

[https://uxdesign.cc/designing-for-scalable-dynamic-type-in-ios-5d3e2ae554eb](https://uxdesign.cc/designing-for-scalable-dynamic-type-in-ios-5d3e2ae554eb)

[https://medium.com/airbnb-engineering/supporting-dynamic-type-at-airbnb-b47c68b0c998](https://medium.com/airbnb-engineering/supporting-dynamic-type-at-airbnb-b47c68b0c998)

[https://www.blog.kevin-hirsch.com/dynamic-type-adaptable-layouts/](https://www.blog.kevin-hirsch.com/dynamic-type-adaptable-layouts/)

[https://lickability.com/blog/every-screen-in-your-app-should-be-a-scrolling-view/](https://lickability.com/blog/every-screen-in-your-app-should-be-a-scrolling-view/)

[https://pspdfkit.com/blog/2018/improving-dynamic-type-support/](https://pspdfkit.com/blog/2018/improving-dynamic-type-support/)

**Do:**

**Don't:**

---

### Iconography

Icons are visual representations of actions, objects, or concepts and are a means of efficient communication. These universal symbols help users quickly understand the purpose and function of various elements without relying on text labels.

## Usage

Common examples where icons are used include:

[layout:3-col]

**Navigation – **Icons are used to represent different sections or pages, making it easier for users to find what they are looking for.

[col]

**Action buttons –** Icons are used in action buttons, such as "save," "delete," "edit," "add," etc. to make it clear what will happen when a user clicks on the button.

[col]

**Menu items – **Icons visually represent different menu options, making it easier for users to scan and understand what is available to them.

[/layout]

[spacer:12]

[layout:3-col]

**Status indicators – **Icons can also be used to indicate the status of a particular task or action, such as a progress bar or a checkmark to indicate completion.

[col]

**Branding –** Icons can be used as a company's branding or as a visual element associated with premium features and services.

[/layout]

## Principles

[layout:3-col]

**Clarity –** Keep it clear and useful. Using a reductive approach, find the simplest expression of an object or idea to represent a single, concise message.

[col]

**Simplicity – **Use basic, elementary shapes (circle, square, triangle) to elicit eero devices' rounded forms as a foundation of our design language.

[col]

**Legibility – **Icons should be seen comfortably in dense content environments at defined compact sizes.

[/layout]

[spacer:12]

[layout:3-col]

**Consistency – **Use grid and construction lines, uniformed terminals, joints, stroke thickness, and the level of details across the whole set.

[col]

**Front facing – **Icons must always face forward on a single, flat plane. If depth is required, icons are to maintain a forced perspective in order to preserve visual clarity.

[/layout]

## Types

[layout:3-col]

**1. Interactive**

[col]

**2.** **Informative
**
[col]

**3. Illustrative
**
[/layout]

## Construction

### Grids

Icons come in three sizes: 44px, 32px or 28px. All icons occupy a square art board. It is recommended that designers use icons at their original sizes.

[layout:3-col]

**44px:** Controls and status

[col]

**32px: **Illustrative

[col]

**28px: **Navigation and tab bar

[/layout]

### Safe area

Use a 3px safe area for icons that don’t use the circular or rectangular keylines.

### Style

For** functional icons** (types 1 and 2), use a 2px stroke for icon line weight. Use rounded joints and terminals. Use 2px corner radius on squares and rectangles along keylines.

For** illustrative icons**, use a 1px stroke for icon line weight. Use rounded joints and terminals. Use 1px corner radius on squares and rectangles along keylines.

\*\*

## Glossary

Note: This is a high-level overview of our most used icons. For a complete, up-to-date glossary of iconography, including dark mode, please see Figma link at the bottom of this page.

### Interactive

### Informative

### Illustrative

\*\*

\*\*

\*\*

\*\*

## Resources

[Meridian Design System: Iconography](https://meridian.a2z.com/fundamentals/iconography/?platform=react-web&detailsTab=guidelines&siteTheme=blue-light&previewTheme=blue-light)

[Apple Human Interface Guidelines: Icons](https://developer.apple.com/design/human-interface-guidelines/foundations/icons)

[Material Design 3.0: Icons](https://m3.material.io/styles/icons/designing-icons)

---

### Spacing

Spacing refers to the deliberate and strategic arrangement of empty or "white" space between various elements, components, and content within the user interface. It's a crucial aspect of the design that directly influences the visual appearance, readability, and overall user experience of the mobile application or website.

## White space

Whitespace, also known as negative or empty space, refers to the area around and between user interface elements. Whitespace can be effectively used to:

[spacer:24]

[layout:3-col]

Enhance readability by providing a clear visual separation between text elements, such as paragraphs, headings, and lists. It also makes text easier to read by reducing clutter and improving visual hierarchy.

[col]

Highlight important elements, drawing attention to key features on the page. For example, a call-to-action button can be surrounded by more whitespace to make it stand out and encourage user interaction.

[col]

Create a sense of elegance and simplicity by giving UI elements room to breathe, resulting in a clean and uncluttered look and feel for the eero app.

[/layout]
[spacer:12]
[layout:3-col]

Separate elements on a page, making it easier for users to distinguish between different types of content.

[col]

Guide users through a page by creating a natural flow from one element to the next.

[/layout]

## Types

### Internal Spacing (Padding)

Internal spacing, also known as padding, refers to the space between the content and the edges of its containing element (e.g., between text and the border of a button). It provides breathing room and prevents content from feeling cramped, making it easier for users to read and interact with the elements.

### External Spacing (Margins)

External spacing, or margins, refers to the space between adjacent elements or components. It creates separation between different UI elements, establishing a sense of order and visual hierarchy. Margins help users distinguish different sections or actions on the screen and aid in reducing accidental taps or clicks.

## Grid

Grids are used to maintain consistent spacing between elements, margins, and paddings throughout the interface. Use a 4px grid for all eero interface elements, as it allows for more flexibility and fine-grained control over their positioning.

Use a 4px grid to separate UI elements. Occasionally, the 4-pixel grid may need to be deviated from within smaller components to maintain visual harmony. However, the 4-pixel grid should be maintained between components on a page. More about [Why we're using a 4-point grid | Webflow](https://webflow.com/blog/why-were-using-a-4-point-grid-in-webflow).

## iOS specific

### Safe areas

The safe area refers to the portion of a view that remains visible and unaffected by the presence of a navigation bar, tab bar, toolbar, or any other views that might be provided by a view controller.

---

### Typography

Typography is an essential component to make text in the app legible and visually pleasing.

## Typeface

**Centra No.2** is eero’s official typeface. It has been chosen for its readability and modernist characteristics that fit with eero’s brand identity. This typeface provides clear and highly consistent headings, legible body paragraphs, clear labels, and simple input fields.

## Usage

Centra No.2 comes in a variety of font weights and sizes. In the app, **Book** is used for content, like body text and captions, whereas **Medium** is used for headers, links, and button text.

## Dynamic text for iOS

iOS supports “Dynamic text“ to support accessibility, this allows the user to scale the text size up or down on their iOS device.

## Behavior

Wrapping vs Truncating text. As a rule of thumb we maintain the text visibility in all cases and hence wrap the text rather than truncate. Additionally we aim to use copy that fits the allocated space, keeping text as succinct as possible. Keeping in mind that our text is translated to many languages which may appear longer or shorter than the designed string.

Excepts where truncation is accepted is when the text can be found elsewhere in the app. For example we may truncate a device name in row, if the user can then tap the device to view device details and see the entire device name without truncation. Another example would be a button, As a button is taking an action the entirety of the text should always be visible and wrap, not truncate.

**Do:**

**Don't:**

---

## App Components

### Action buttons

An action button is an icon that opens a bottom sheet with supplementary actions.

## Usage

Action buttons can be placed at the top navigation bar or a row component depending on the context. Action buttons should always be placed on the right of its parent frame.

When an action button is clicked, a[ bottom sheet](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3177480227/Bottom+sheet+App) appears with actions to take regarding the content. In the context of action buttons, we use the native action sheets for iOS and Android rather than a custom bottom sheet.

## Types

1. Used in top navigation bar
2. Used in [rows](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3060695161/Rows+App)

## iOS vs Android

There is no difference between iOS and Android.

## Behavior

**Do:**

**Don't:**

---

### Buttons

Buttons are tappable components that trigger actions, initiate processes, or navigate within the app.

## Usage

Buttons represent actions that customers can take. They are placed throughout the screen in places such as modals and cards.

## Types

1. **Primary:** used for the principal call-to-action on the page. Use only one primary button per screen.
2. **Secondary:** used for secondary actions on each page. Generally use for non-critical actions.
3. **Tertiary:** used as a tertiary style. Best for button groups where one action is less common or important.
4. **Destructive:** used for irreversible actions with significant impact.
5. **Disabled:** used for inactive elements in a user interface. They can't be clicked due to specific conditions not being met, helping manage user expectations.

### Special cases

In some use cases, buttons can be used in the [Row](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/edit-v2/3060695161?draftShareId=a195c85d-9694-4893-8e50-5cbad9e7d310) format inside Sections.

If it’s necessary, a text-button with a very long string can be wrapped.

Sticky buttons are placed at the bottom of the screen and stay at the same location during scrolling.

## Anatomy

1. **Container**
2. **Label**

## iOS vs. Android

There is no difference between iOS and Android.

**Do:**

**Don't:**

---

### Checkboxes

A checkbox lets users select or deselect one or more options from a set of choices.

## Usage

A checkbox consists of a square box that can be checked (filled with a checkmark) or unchecked (empty), along with a label that describes the option or action associated with the checkbox.The eero app uses a styled version of the [Android](https://developer.android.com/develop/ui/views/components/checkbox) native component for both iOS and Android.

When a user clicks on a checkbox, it toggles between the checked and unchecked states, allowing them to make a selection or indicate a choice. Checkboxes are commonly used to multi-select devices( e.g., selecting devices to add to a profile) and specify user preferences.

## Anatomy

1. **Title **(optional)
2. **Details **(optional)
3. **Selected checkbox**
4. **Unselected checkbox**

## iOS vs. Android

There is no difference between iOS and Android.

**Do:**

**Don't:**

---

### Chips

Chips help filter content by serving as categories, labels, status tags, and product attributes.

## Usage

Chips can be used as a button to display sort and filter options as well as indicate which sort and filter options have been selected. A user can select and deselect a chip to arrange the content on the page accordingly.

## Types

1. Filter by clicking on chip options
2. Filter by dropdown chip

## Anatomy

1. **Unselected chip container **
2. **Selected chip container **
3. **Icon (optional)**
4. **Chip label**
5. **Dropdown icon (optional)**

## iOS vs. Android

There is no difference between iOS and Android

## Behavior

[layout:2-col]

- \*[col]

- \*[/layout]

  **Do:**

  **Don't:**

  ***

### Expandable rows

Expandable rows let users tap a chevron to reveal additional details inline without leaving the current screen.

## Usage

Expandable rows can be utilized to display additional information in an expanded view, thereby helping users maintain context within the same page. For example, expandable rows are employed in the streamlined setup process. They assist users by show the number of tasks they need to complete in order and allow quick access to a set of tasks.

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

### Row expander

1. **Parent row: **The parent row can contain an icon, a title, a subtitle, and controls. When expanded, the color of the parent row changes to #FFFFFF (10%) to provide differentiation from a child view.
2. **Child row**: The child row can contain additional details related to the parent row.
3. Heading
4. Text
5. Media
6. Indicator
7. Button
8. **Icon (optional): **Utilizing [progress tracker icons](https://www.figma.com/file/YNVcxdqDZQcDrdZgfe0NSW/App-Iconography?type=design&node-id=5282-110&mode=design&t=N3fvTaGcWDPxPhAa-4) within the row can represent the progress of multiple sequenced items effectively.
9. **Title**
10. **Subtitle (optional)**
11. **Chevron**

## Behavior

[layout:2-col]

Row expander can be expanded and collapsed by tapping the parent row, with a 320ms ease-in effect. Note the transition chevron also animates.
[col]

When using multiple rows for sequential tasks, the rows can be automatically expanded and collapsed once the task is competed. Additionally only a single row can be open at a time.

[/layout]

The transition should be in 400ms and Natural declaration: cubic Bezier (0.00, 0.00, 0.00, 1.00)

## External Resources

[https://developer.apple.com/design/human-interface-guidelines/lists-and-tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)

[https://m2.material.io/components/lists](https://m2.material.io/components/lists)

[https://meridian.a2z.com/components/expander/](https://meridian.a2z.com/components/expander/?platform=react-web&exampleId=section)

**Do:**

**Don't:**

---

### Loaders

A loading and progress indicator is a visual element indicating that an action is being processed.

## Usage

The loading and progress indicator appears as a spinning graphic to manage user expectations and prevent frustration by providing feedback that the system is working as expected, especially in cases where it needs time to process information.

## Types

1. **Large (at the bottom)** used on onboarding screens to indicate the status of the setup process.
2. **In-row (small):** used in row components to indicate the status of the system.
3. **Large (middle overlay):** used as an overlay to indicate that the action is being processed.

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

1. **Loader**

**Do:**

**Don't:**

---

### Menus

Menus display a list of choices depending on a picker category.

## Usage

In the app, menus are most often used to select a time, time range, or location. One usage example is specifying an update time window. Another example is selecting a location for the VPN.

We use native components with a few styling modifications for both [iOS](https://developer.apple.com/design/human-interface-guidelines/context-menus#Best-practices) and [Android](https://m3.material.io/components/menus/specs).

## Behavior and best practices

Learn more about menus in the eero app, as outlined by the dedicated platform guidelines:

**iOS:** [https://developer.apple.com/design/human-interface-guidelines/context-menus#Best-practices](https://developer.apple.com/design/human-interface-guidelines/context-menus#Best-practices)

**Android:** [https://m3.material.io/components/menus/specs](https://m3.material.io/components/menus/specs)

**Do:**

**Don't:**

---

### Pickers

Pickers are used to select values such as time and location.

## Usage

Pickers are used mainly in setting schedules and update times in the app. We use native components with a few styling modifications for both [iOS](https://developer.apple.com/design/human-interface-guidelines/pickers) and [Android](https://m3.material.io/components/date-pickers/specs).

## iOS vs Android

iOS
[layout:2-col]

[col]

[/layout]

### Android

## Behavior and best practices

Learn more about pickers in the eero app, as outlined by the dedicated platform guidelines:

**iOS**:

[https://developer.apple.com/design/human-interface-guidelines/pickers](https://developer.apple.com/design/human-interface-guidelines/pickers)| [https://developer.apple.com/design/human-interface-guidelines/context-menus#Best-practices](https://developer.apple.com/design/human-interface-guidelines/context-menus#Best-practices)

**Android**:

[https://m3.material.io/components/time-pickers/overview](https://m3.material.io/components/time-pickers/overview) | [https://m3.material.io/components/date-pickers/specs](https://m3.material.io/components/date-pickers/specs)| [https://m3.material.io/components/menus/specs](https://m3.material.io/components/menus/specs)

[center]

[/center]

**Do:**

**Don't:**

---

### Radios

A radio allows users to make a single selection from a group of mutually exclusive options.

## Usage

Radios are typically represented as a circular button or icon accompanied by a label describing the choice.

Users can select one radio at a time within a specific group. Selecting a new option automatically deselects the previously chosen one. They provide a clear and visually distinct way for users to make choices without ambiguity, ensuring a straightforward and effective selection process.

## Anatomy

1. **Title**
2. **Details (optional)**
3. **Radio (unselected)**
4. **Radio (selected)**

## iOS vs Android

We use styled versions of the native components for iOS and Android accordingly.

[layout:2-col]

[col]

_[\**/layout]_

**Do:**

**Don't:**

---

### Rows

Rows group related content like text, images, and actions, and can stand alone or form sections.

## Usage

Rows are used across the app, such as in the Home, Discover, and Settings pages. Rows may be static or interactive, and screens may have a combination of static and interactive rows.

For example, an interactive row is used to provide the user with basic information about their device. When tapped, the user is navigated to a screen where they can edit the device and view information such as connection type and activity.

## Types

1. **Interactive**: depending on the buttons on the row, the user is able interact and take actions with the row.
2. **Static**: the row is purely informational, and the user is not able to take actions with the row.

## Examples

1. Feature switch
2. Row with a link
3. Row with multiple icons for representing status and a disclosure button to navigate to another screen
4. Static row

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

1. **Container**
2. **Icon (optional)**
3. **Title**
4. **Tag (optional)**
5. **Detail (optional)**
6. **Controls (optional): **rows often contain a disclosure icon to indicate that it is tappable, but can also present other actionable buttons.

Behavior
[center]

[/center]
For interactive rows with a disclosure icon, the user is taken to another page with further details regarding the row’s contents.

For static rows, the user is not able to click or interact with the row.

## External Resources

[https://developer.apple.com/design/human-interface-guidelines/lists-and-tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)

[https://m2.material.io/components/lists](https://m2.material.io/components/lists)

[https://meridian.a2z.com/components/list](https://meridian.a2z.com/components/list)

**Do:**

**Don't:**

---

### Sections

Sections are used to group multiple Rows together on a screen.

## Usage

Using sections to group content allows users to quickly identify the structure and available content on a screen, providing better navigation within the app. Sections may be static or expandable allowing rows to be persistent or only shown when needed.

\*\*

## Types

1. **Section**
2. **Expand/collapse section:** used to reduce the amount of space for sections with a vast amount of content.

## iOS vs. Android

There is no difference between iOS and Android.

## Anatomy

1. **Header**
2. **Informational button (optional): **used to provide additional information
3. **Label (optional):** used to provide information about new items, usually a number, and it's only shown in a combination with the expand/collapse control, when the section is collapsed.
4. **Expand/collapse control (optional)**

## Behavior

[center]

[/center]

Expandable sections collapse when the collapse icon is clicked and expand when the expand icon is clicked.

Sections with many rows will expand to show all rows within the section and the page will scroll accordingly. Rows should not be paginated or rely on lazy-loading.

For row behavior see [rows](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3060695161/Rows+App).

**Do:**

**Don't:**

---

### Segmented controls

Segmented controls are a horizontal bar of tabs representing distinct options that switch between different views on a single screen.

The app uses a styled version of the [iOS](https://developer.apple.com/design/human-interface-guidelines/segmented-controls) and [Android](https://m2.material.io/components/tabs/android) native component.

## Usage

Segmented controls are commonly used to present choices or filter options where users need to make a single selection from a predefined set. They are particularly useful when the number of options is limited and mutually exclusive.

## Types

1. **Two segments**
2. **Three segments**

## Anatomy

1. **Segmented container:** used to house the segments.
2. **Selected container:** used to show the active segment.
3. **Label text**

## iOS vs. Android

For iOS, we use the styled version of the [iOS](https://developer.apple.com/design/human-interface-guidelines/segmented-controls) component and for Android, we use the styled version of the [Android](https://m2.material.io/components/tabs/android) native component.

## Behavior

[layout:2-col]

[col]

[/layout]

**Do:**

**Don't:**

---

### Sliders

Sliders are controls that allow users to adjust a value within a specified range by sliding an element along a track.

## Usage

Sliders are commonly used to provide a visually interactive way for users to modify settings, parameters, or numerical values, such as volume, brightness, time, or any other continuous data.

## iOS vs Android

The size of the handle and color of the scale differ between iOS and Android.

[layout:2-col]

[col]

[/layout]

## Anatomy

1. **Handle:** used to select the value.
2. **Scale**
3. **Min value icon**
4. **Max value icon**

**Do:**

**Don't:**

---

### Steppers

A stepper increases or decreases an incremental value.

## Component

[https://www.figma.com/design/mjRq9BJG2iGlqyS2jncMpm/%F0%9F%A7%A9-App-Components?node-id=15698-35592&t=cv2o3ri8tTmMWPlr-11](https://www.figma.com/design/mjRq9BJG2iGlqyS2jncMpm/%F0%9F%A7%A9-App-Components?node-id=15698-35592&t=cv2o3ri8tTmMWPlr-11)

## Platforms

[https://developer.apple.com/design/human-interface-guidelines/steppers](https://developer.apple.com/design/human-interface-guidelines/steppers)

[https://m3.material.io/components/icon-buttons/overview](https://m3.material.io/components/icon-buttons/overview)

---

### Switches

Switches are controls that allows users to toggle between two different states or options.

## Usage

A switch is used to provide a simple and intuitive way for users to toggle features on and off or make binary choices.

## iOS vs. Android

[layout:2-col]

[col]

[/layout]

## Anatomy

1. **Track**
2. **Thumb**

## Behavior

A successful switch toggling occurs when the user's interaction causes the switch thumb to smoothly slide to the opposite side of the track.

## States

When active, the Switch has two main states: On and Off. An additional color variation is used to represent the loading state of a switch set to be On or Off, both on Light and Dark modes. When disabled (not interactive), the entire row component is displayed in 50% opacity.

Switch states

## Error Handling

When a toggle fails to update, an error alert is presented on the top of the screen.

**Do:**

**Don't:**

---

### Tags

Tags categorize, identify, or highlight specific items, content, or functionalities within the app.

## Usage

Tags are used to give quick visual cues and aid in the organization and understanding of the content. In the app, tags employ labels and color to convey meaning, where each color represents a different category of content.

## Types

- **Midnight: **used if a neutral status is needed.
- **Orange**: used to indicate beta features.
- **Blue**: used to indicate new items or features.
- **Green**: used to indicate the active status.

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

1. **Container**
2. **Label**: used to provide the tag’s content

**Do:**

**Don't:**

---

### Text fields

Text fields are elements that allow users to enter text.

## Usage

Text fields can be used for various purposes, such as collecting information or entering login credentials. In the eero app, text fields are frequently used to specify network name, passwords, and profile information.

## Types

1. **Default:** used as the default size in vast majority of cases.
2. **Large: **used for onboarding flows(example above).

## iOS vs. Android

There is no difference between iOS and Android.

## Anatomy

1. **Label** (optional)
2. **Field container**
3. **Placeholder text**
4. **Field text**
5. **Clear icon **(activated once there is field text)
6. **Error message** (optional)

## Behavior

[center]

[/center]

Once a user clicks on a text field, the keyboard appears and a blinking caret replaces the placeholder text. When the user begins typing, a clear icon appears on the right side of the container. When the user clicks “Done” or clicks outside the text field, the keyboard and caret disappear.

An error message appears at the bottom of the field for field errors and disappears when the error is cleared.

**Do:**

**Don't:**

---

### Toasts and snackbars

Toasts and snackbars are temporary brief in-app notifications that provide immediate feedback on user actions.

## Usage

Toasts and snackbars are often used to communicate alerts or messages that are minimally interruptive and have quick success. The result and feedback can be positive, neutral, require attention or negative. Icons can be added to help differentiate the type of alert.

For iOS, we use a customized toast component, and for Android, we use its[ native snackbar ](https://m3.material.io/components/snackbar/overview)component for quick feedback.

## Types

1. **Success toast**
2. **Attention toast**
3. **Failure toast**

## iOS vs Android

iOS uses the customized toast and Android uses its native snackbar component.

[layout:2-col]

[col]

[/layout]

## Anatomy

1. **Container**
2. **Icon**
3. **Text**
4. **Action button (optional)**

## Behavior

For iOS, the toast appears from and stays at the top of the screen, while the Android snackbar comes from and stays at the bottom.

**Do:**

**Don't:**

---

## App Patterns

### Alerts and notifications

Alerts and in-app notifications inform users, warn about data loss, or confirm decisions

## Types

### **In-line input error message**

In-line alerts are used to communicate feedback related to a specific input field. They appear underneath the input component and disappear when the error is resolved. See[ text input](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3147137038/Text+inputs+App).

### **Alert card**

Alert cards are typically persistent and are used to communicate information about an entire screen, or a specific element on a screen. The most common uses are the informational, warning, and critical alert types. See [cards](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3147071519/Card+App).

### **Toast or snackbar**

Toasts or snackbars are in-app notifications which disappear after a few seconds and are used to give users immediate feedback on an action they’ve performed. Toasts and snackbars can be positive, neutral, require attention, or negative. See[ toasts and snackbars](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3102015489/Toasts+and+snackbars+App).

### **System alert**

System alerts are used when an action (usually destructive) needs confirmation from the user, and are persistent until the user takes action. We use the native [iOS](https://developer.apple.com/design/human-interface-guidelines/alerts) and [Android](https://m2.material.io/components/dialogs#usage) components for their respective platforms.

### **Bottom sheet**

Bottom sheets are used when we need to provide more information to the user about an important action or decision. They can be used in place of a system alert. See [bottom sheet](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3177480227/Bottom+sheet+App).

---

### Bottom navigation bar

A bottom navigation bar is fixed at the screen's base, providing icon-and-label links to key pages or actions.

## Usage

The bottom navigation bar is primarily used to facilitate quick navigation to the most important or frequently used sections of the app. By placing navigation options at the bottom, it ensures that key destinations are consistently visible and easily reachable, and in a predictable location across the app.

The eero app currently has 4 destinations in the bottom navigation bar:

1. **Home** – network status and messages, eeros, devices and profiles.
2. **Activity** – data such as download and upload speeds.
3. **Discover** –eero features such as eero Plus and Amazon connected home.
4. **Settings** – account and network settings.

## iOS vs. Android

There is no difference between iOS and Android.

## Anatomy

1. **Container**
2. **Active icon**
3. **Inactive icon**
4. **Active text label**
5. **Inactive text label**
6. **Horizontal separator**

## Behavior

[center]

[/center]

When an icon in the bottom navigation is selected, the icon and text label turns into its active state and takes users to its corresponding destination in the app.

**Do:**

**Don't:**

---

### Bottom sheet

A bottom sheet is an overlay fixed to the bottom of the screen displaying contextual information or actions.

## Usage

Bottom sheets provide supplementary content or functionality without leaving the current screen or context. Bottom sheets often slide up from the bottom of the screen, partially covering the main content. A user must swipe down or otherwise dismiss the sheet to return to the screen underneath.

Bottom sheets minimize the necessity to repeatedly switch between screens. The eero app uses both native sheets for iOS and Android as well as a customized bottom sheet.

## Types

1. **Native action sheet:** used for [actions](https://eeroinc.atlassian.net/l/cp/qkzjVi1P).
2. **Customized bottom sheet:** used when a full screen modal is not necessary.

## iOS vs. Android

Native action sheets differ between between iOS and Android, due to OS differences. However, when we use customized bottom sheets, there is no difference between iOS and Android.

[layout:2-col]

[col]

[/layout]

## Anatomy

1. **Container**
2. **Title**
3. **Message**
4. **Action button**
5. **Dismissal button **- The user may also swipe down to dismiss the bottom sheet

## Behavior

[center]

[/center]

A bottom sheet moves into the screen from the bottom to up with a 300ms ease out effect, and it resides at the bottom center of the screen.

There is an overlay that cover the background of 40% black (000000). The bottom sheet closes when either the dismissal button is clicked, the user clicks outside the bottom sheet, or swipes the sheet away.

**Do:**

**Don't:**

---

### Card

Cards display content and actions for a single subject, typically combining an image or icon, title, description, and interactive elements.

## Usage

Cards are used to organize and present various types of content, including recent updates, relative features, events, persistent alerts, and more. Using cards creates structure on pages and consistency throughout the app.

Cards can be used for profiles, activity, discovery, promotions, and alerts (see types below).

## Types

1. **Profile card**
2. **Activity card**
3. **Discovery card**
4. **Promotion card**
5. **Alert card**

## iOS vs. Android

There is no difference between Android and iOS cards.

## Anatomy

### Profile card

1. **Container**
2. **Icon**
3. **Title**
4. **Subtitle (optional)**

### Activity card

1. **Container**
2. **Title**
3. **Detail**
4. **Chart (optional)**

### Discoverable card

1. **Container**
2. **Title**
3. **Icon**
4. **Push disclosure**
5. **Feature title**
6. **Beta tag (optional)**
7. **Discoverable status**
8. **Status indicator**

### Promotion card

1. **Container**
2. **Tag**
3. **Title**
4. **Detail**
5. **Clear disclosure**

### Alert card

1. **Container**
2. **Icon**
3. **Alert title**
4. **Alert subtitle**
5. **Disclosure**

**iOS vs Android**

[layout:2-col]

[col]

[/layout]

## Behavior

Depending on the card’s usage, clicking on a card can lead to a bottom sheet, modal, or another screen.

**Do:**

**Don't:**

---

### Empty state

An empty state appears when no content is available to display in a page, section, or component.

## Usage

Empty state screens serve various purposes, including introducing first-time users to a feature, indicating data absence, handling errors, and communicating search results.

Effective empty states are informative, visually appealing, and offer actionable steps, enhancing the user experience by reducing confusion and helping users understand what to do next in situations where content is lacking.

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

1. **Image (optional)**
2. **Header**
3. **Text**
4. **Action button (optional)**

**Do:**

**Don't:**

---

### Expander

An expander lets users tap a trigger to reveal additional details inline without leaving the page.

## Usage

Expander can be utilized to display additional information in an expanded view, thereby helping users maintain context within the same page. Rows, lists, and sections can be expanded. For example, row expanders are employed in the streamlined setup process. They assist technicians by enabling quick access to a set of tasks and simplifying the process of completing setup within the expanded view.

## Types

1. **Row expander**: Displays that there is additional and related content associated with a parent row. Utilizing [progress tracker icons](https://www.figma.com/file/YNVcxdqDZQcDrdZgfe0NSW/App-Iconography?type=design&node-id=5282-110&mode=design&t=N3fvTaGcWDPxPhAa-4) within the row can represent the progress of multiple sequenced items effectively.
2. **List expander**: Used to show additional information beneath a parent item.
3. **Section expander:** Used to reduce the amount of space for sections with a vast amount of content.

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

### Row expander

1. **Parent row: **The parent row can contain an icon, a title, a subtitle, and controls. When expanded, the color of the parent row changes to #FFFFFF (10%) to provide differentiation from a child view.
2. **Child row**: The child row can contain additional details related to the parent row.
3. **Icon (optional): **Utilizing [progress tracker icons](https://www.figma.com/file/YNVcxdqDZQcDrdZgfe0NSW/App-Iconography?type=design&node-id=5282-110&mode=design&t=N3fvTaGcWDPxPhAa-4) within the row can represent the progress of multiple sequenced items effectively.
4. **Title**
5. **Subtitle (optional)**
6. **Chevron**

### List expander

1. **Parent list: **The parent list can contain a title and a chevron.
2. **Child list**: The child list can contain additional details related to the parent list.

### **Section expander**

1. **Parent section**
2. **Child section**
3. **Title**
4. **Indicator**: The number of items in the child section
5. **Chevron**

## Behavior

[layout:2-col]

[col]

[/layout]

## External Resources

[https://developer.apple.com/design/human-interface-guidelines/lists-and-tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)

[https://m2.material.io/components/lists](https://m2.material.io/components/lists)

[https://meridian.a2z.com/components/expander/](https://meridian.a2z.com/components/expander/?platform=react-web&exampleId=section)

**Do:**

**Don't:**

---

### Graphs and charts

Graphs and charts are used to visually present large amounts of data in a succinct way.

## Usage

Graphs and charts are mainly used in the activity section of the eero app. They provide users with a visualization of their data usage and more, depending on whether they have an eero Plus subscription.

## Types

### Bar

Bar charts use vertical or horizontal bars with lengths proportional to the values they represent, in order to compare data across a consistent X/Y axis. One axis of the chart shows the specific categories being compared, and the other axis represents a discrete value.

[layout:2-col]

[col]

[/layout]

### Area

Area charts show large amounts of data over time, with the filled area below emphasizing data magnitude. They're ideal for displaying trends and multiple variable values can be stacked for easy comparison.

[layout:2-col]

[col]

[/layout]

### Density

Density refers to how much information is shown in a given chart or graph at one time. High density visualizations typically show large amounts of data (such as 24 hours worth of bandwidth utilization) in a condensed way to highlight trends as well as individual comparison. Low density visualizations provide more white space to allow the user to focus on one category or compare between a small number of categories, such as days of the week.[layout:2-col]

[col]

[/layout]

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

1. **Title**
2. **Subtitle**
3. **Left arrow:** used to open the previous page.
4. **Bar graph**
5. **X-axis values: **used to provide x-axis values.
6. **Threshold (optional): **used to represent a threshold value.
7. **Line graph**
8. **Right arrow:** used to open the next page.
9. **Y-axis values: **used to provide x-axis values.

## Behavior

[center]

[/center]

When a user clicks a part of the graph or chart, a bubble should appear that labels the colors and gives specific numbers for each color.

**Do:**

**Don't:**

---

### Modal

A modal is an overlay that appears over the main content, disabling interaction with the page behind it.

## Usage

In the eero app, we use modals to provide additional information or context, helping users to understand specific features or options without the need to navigate to a different page.

Modals are used for long-form content. For shorter content or functionality, use a Bottom sheet instead.

## Types

1. **Single screen: **includes a close button
2. **Multi-screen:** includes a back button

## iOS vs Android

There is no difference between iOS and Android.

## Anatomy

1. **Nav button (Close or Back):** used to navigate the Modal.
2. **Header**
3. **Image (optional)**
4. **Image caption: **used to provide an additional context.
5. **Text**
6. **Sub-header: **used to provide a sub-header for subsections.

## Behavior

[center]

[/center]

When a modal is triggered, the modal slides up from the bottom of the screen and resides in the bottom center of the screen.

The modal may be scrollable or have additional actions such as buttons.

**Do:**

**Don't:**

---

### Sort and filter

Sort and filter help users refine and organize information, independently or together.

## Usage

Filters establish constraints on search outcomes, excluding anything that doesn't match the selected categories. Filters are used to narrow down a search in long lists of items.

Conversely, sorting imposes a more flexible structure by altering the order in which items appear. Sorting can reorder data based on specific attributes or parameters, such as alphabetical or chronological order.

## iOS vs. Android

There is no difference between iOS and Android sort and filter

## Anatomy

1. **Container**
2. **Close icon**
3. **Option label**
4. **Title**
5. **Reset button**
6. **Radio button or **[**checkbox**](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3163226363/Checkbox+App)

## Behavior

The sort and filter sheet slides up from the bottom of the screen and reside at the bottom center of the screen. See bottom sheet behavior.

When an option is selected, the radio button or [checkbox](https://eeroinc.atlassian.net/wiki/spaces/PE/pages/3163226363/Checkbox+App) turns into its active state (see respective articles for behavior) and the page is sorted or filtered accordingly.

**Do:**

**Don't:**

---

### Top navigation bar

The top navigation bar is a persistent component that sits at the top level of the app.

## Usage

The top navigation should reside at the top of the screen and be the top-most layer of the UI. This serves as a natural location for navigating through a hierarchy of content, screen titles, branding, and – where applicable – take actions, such as ‘save.'

## iOS vs Android

[layout:2-col]

### iOS

[col]

### Android

[/layout]

## Anatomy

1. **Container**
2. **Navigation button**
3. **Screen title**
4. **Subtitle (optional)**
5. **Information icon button(optional)**
6. **Save or action button (optional)**

## Behavior

[center]

[/center]
When navigating between screens, the next slides in from the right with a 300ms ease in affect.

If the back arrow exists from the screen prior, the arrow remains fixed while the content slides in.

## Additional Resources

[https://developer.apple.com/design/human-interface-guidelines/components/navigation-and-search/navigation-bars](https://developer.apple.com/design/human-interface-guidelines/components/navigation-and-search/navigation-bars)

[https://m2.material.io/components/app-bars-top](https://m2.material.io/components/app-bars-top)

**Do:**

**Don't:**

---

### Unavailable features

Bridge mode hides unavailable features with an explanatory note to distinguish them from disabled ones.

## Usage

The note should use the footnote style, but since the information is related to the screen and not a specific section/row, it should use additional spacing from the top.

**Do:**

**Don't:**

---

### Upsell and badging

Premium features are accessible in context with other free features throughout the app.

## Usage

### Unsubscribed

To sinalize **a feature is premium** and not yet available for a customer, thus it will lead to an upsell flow, we use a combination of a different color background for the feature entry point’s row and include the Plus badging next to the feature name. We also use a subtitle to describe and/or promote the feature benefits. If multiple premium features are supposed to be presented in a single screen we should group them into a category or benefit to not overload the screen with upsells. If that is not possible, prioritize highlighting the most important feature.

### Subscribed

When a customer is subscribed to Plus or EB we also badge features.

_Note: Features are not badged features for customers subscribed to Secure._

They can follow 2 styles:

1. **Individual feature**

If the feature is presented individually, the subscription logo or icon is presented inside the row (either next to the feature name or on top of it.

1. **Premium section**

If there are multiple feature or cards being presented in a screen, they should be grouped into a section which will use each subscription logo as its title. The section should be placed at the bottom of the screen.

\*\*

**Do:**

**Don't:**

---
