# Requirements — CBM SP Asset Management System

> Living document to guide the prototype's evolution and the development of the production application. Update decisions and requirements as they are confirmed.
>
> Status: draft · Updated on 2026-11-03 — global unit scope, responsive tables, multiple filters, local templates, configurable tables, official visual identity, and guidelines for porting the web experience to React Native.
>
> Incremental code organization and cleanup plan: [PLANO_REFATORACAO_CODIGO.md](PLANO_REFATORACAO_CODIGO.md).

### Maintaining this document

- This is the living record of the application's features, business rules, technical decisions, and responsive experience requirements.
- Update this file in the same change that introduces or changes a feature, permission, data rule, workflow, technical dependency, or compatibility decision. Do not wait until the mobile phase to update it.
- Identify what already exists in the prototype, what is defined for the production application, and what is still undecided. Do not describe something as implemented if it is only planned.
- When proposing a solution, consider both the web version and the future React Native port from the start. Share behavior and domain logic where possible; document any required adaptations to navigation, interface, storage, keyboard, printing, and device features.

## 1. Objective

Provide an application for looking up and managing assets, monitoring their condition and operational status, recording changes, and reviewing entries that require approval.

## 2. Known scope

The current prototype includes:

- An overview with indicators, pending items, and recent changes.
- Asset lookup with search, filters, grouping by description, and access to individual items; clicking any cell in a grouped row opens its details, and the row can also be activated with the keyboard.
- Local, per-user templates for saving and restoring lookup filters and columns.
- Grouped and individual tables with controls to show, hide, reorder, and sort columns; in the individual table, the actions column stays fixed at the end.
- Tables with neutral headers, alternating rows, subtle dividers, and a discreet hover highlight, using Troi's semantic Tailwind classes and the CBM SP theme color tokens.
- Below 1280 px, lookup tables display records as labeled cards; on larger screens, they retain the tabular layout.
- The official CBM SP logo in brand areas, the browser icon, and the installed app identity; component corners use a more restrained radius.
- Asset creation and editing.
- Administrative approval and rejection.
- An administrative user list and access profile editing.
- A personal profile for each user, with the ability to edit their own identification and contact details.
- A global unit selector in the side navigation, applied to asset, indicator, pending item, user, and export screens.
- A change history for each asset.
- CSV exports and reports for printing or saving as PDF.
- Reader, storekeeper, and administrator profiles.

The prototype uses in-memory demonstration data and simulated authentication. It is not the official source of data and does not provide persistence, authentication, or authorization suitable for production.

## 3. Initial profiles and permissions

| Profile | Need | Rule observed in the prototype |
|---|---|---|
| Reader | Look up active assets and generate reports. | Sees active assets only; cannot create or edit records. |
| Storekeeper | Register individual assets and maintain operational data. | Sees active and pending assets; can create records and update condition, operational status, and unit. New entries await approval unless an approved entry with the same description already exists. |
| Administrator/manager | Review entries and manage information. | Sees all records, edits administrative and operational fields, and approves or rejects pending entries. |

Permissions in the production application must be enforced and validated on the server. Hiding actions in the interface is not sufficient access control.

## 4. Client requirements

### CR-01 — Authentication and profile

Users must sign in with an identity recognized by the organization and receive the permissions associated with their profile.

### CR-02 — Overview

The system must present indicators and work lists appropriate to the user's profile, including items awaiting review and recent changes where applicable.

### CR-03 — Lookup and discovery

Users must be able to find assets by description and asset number, filter results by type, condition, operational status, and administrative status, and clear applied filters. Each filter must support multiple checkbox selections; selections within the same filter are combined with OR, while filters from different categories are combined with AND. Applied filters must appear in the web URL and be restored when that address is opened or reloaded.

On the asset lookup screen, keep the **Fazer resumo** action visible in the **Bens cadastrados** header row, in place of the **Dados locais** indicator. Disable it when no search or filter criterion is active; enable it when at least one criterion is active. Activating it with no matching records must show an empty-summary state. Place PDF export with the page-level actions beside templates and item creation.

### CR-04 — Grouping and details

Results may be grouped by description to show totals. Users must be able to open a group by selecting any point in its row or by using the keyboard, and look up each individual item by its asset number. The item name uses the neutral text color; interaction is indicated by the entire row and its focus/hover highlight, and the color does not represent asset status.

### CR-05 — Registration

Authorized users must be able to register an individual item with its description, type, asset number, unit, condition, operational status, and estimated value, subject to validation and approval rules.

### CR-06 — Editing and movement

Authorized users must be able to update the fields allowed for their profile. Changes to the unit and administrative status must be recorded in the history.

### CR-07 — Approval

Administrators must be able to view pending records and approve or reject them. The decision and the person who made it must be recorded.

### CR-08 — History

Each asset must show events for creation, editing, approval, rejection, unit changes, and deactivation, with the date, author, and a summary of the change.

### CR-09 — Export

Users must be able to export the data their profile allows them to view. CSV must be downloaded as a file. PDF must include a title, the name and email address of the user who generated the report, the date and time of generation, a readable table, and suitable pagination.

### CR-10 — Responsive use

The web application must work on small and large screens. The smallest supported layout is 375 × 667 CSS px; validation must account for browser bars reducing the actually visible area. Below 1280 px, lookup tables must reflow into cards with a label for each field to avoid horizontal page scrolling; larger screens retain tables and may scroll horizontally when the user enables many columns. The mobile version must provide equivalent workflows suited to field use.

### CR-11 — Accessibility and language

The interface and reports must use Brazilian Portuguese, clear labels, keyboard navigation, visible focus, accessible controls, and readable contrast.

### CR-12 — User management

Administrators must be able to open a list of all registered users, select an account, and change its access profile. At this stage, the profile is the only editable field. In the prototype, the change lasts for the session and is not persisted.

### CR-13 — Personal profile

All authenticated users must have access to the **Perfil** button in the navigation and be able to edit their own details: rank, unit, contact phone, first name, and last name. Users cannot change their own email address or access profile from the personal profile screen. In the prototype, changes are kept only for the session.

### CR-14 — Lookup templates

Users must be able to save a named lookup locally with its filters and selected columns for both grouped and individual tables, apply a saved template, update it, rename it, and delete it. Applying a template restores filters and both table configurations; on the web, restored filters must also be reflected in the URL. A per-user default template must be applied automatically when opening the lookup if the URL does not specify filters; the first saved template becomes the default, and applying another template changes the default. Templates must be kept separate by user and include a schema version to support future data changes. They must not store asset data or credentials.

### CR-15 — Configurable tables

In the grouped and individual item tables, users must be able to show or hide available columns, change their order, and sort rows in ascending or descending order by a column's value. Each column definition must support horizontal alignment for both its header and body cells, using logical values `start`, `center`, or `end`; the default is `center`. Long description columns should use `start`. Desktop tables must show vertical separators between adjacent columns, and row hover must have a clear, slightly stronger background highlight. Tables must paginate their rows, default to 10 rows per page, and let users choose 10, 25, or 50 rows per page. Sorting applies to the full result set before pagination; changing the data set or page size returns the table to its first page. Description is required in the grouped table; Asset number is required in the individual item table. The grouped table defaults to **Item** (required description), **Total**, and **Operacional**; other status breakdown columns are available but hidden by default. Users can enable optional grouped columns and save that configuration in a template. On the grouped asset lookup screen, place the column control first on the left beside the filters, and place **Limpar**, when available, last on the right. Keep search and filters directly on the page without a surrounding card. Place the **Bens cadastrados** heading and summary action above and outside the bordered table; the border should enclose the table grid only. Place pagination in a separate, unboxed row below the table. Clicking or focusing a grouped row opens the individual items for that description. On compact screens, the same fields must appear in labeled cards with an accessible sorting control and honor each column's alignment. The last column in both tables contains a three-dot button: in the grouped table, it opens the individual items for that description; in the individual item table, it opens the actions available for that record, subject to the user's profile. The actions column remains visible and is always last. The individual table's column order must be used in exports and included in lookup templates.

### CR-16 — Visual identity and mobile adaptation

The interface must use the official `cbmsp.svg` vector file without changing its colors or proportions. Cards, fields, buttons, menus, and dialogs must use only the shared `sm` (2 px) or `md` (4 px) radii; circles are reserved for indicators, circular controls, and avatars. The React Native version must reuse the same vector through a platform-compatible SVG renderer and map the same radius tokens.

### CR-17 — Global unit scope

Users must be able to select their unit through the side navigation. The selection limits indicators, changes, pending items, asset lookup, users, and exports to records associated with the selected unit, and remains active while navigating between screens. The unit assigned to a profile is the initial scope; when a profile has no unit, the prototype starts at **Todas as unidades**. On the web, the selection must be serialized in the URL's `unit` parameter (`unit=<unit>` or `unit=all`) and restored when the address is opened or reloaded. The production application's API must provide the permitted units and enforce the scope on the server; the prototype's visual filter does not replace authorization.

### CR-18 — Operational documentation for primitives, components, and views

Every UI primitive, reusable component, and application view must have a discoverable operational document. The document must give developers enough context to implement, use, review, and extend that unit consistently. It must cover its purpose and scope; requirements and consumer responsibilities; public contract (such as props, events, required and optional inputs, defaults, and generated values); behavior and states; UI, responsive, and accessibility expectations; data or service dependencies and side effects; examples and important constraints; and relevant tests.

Document meaningful implementation choices and why they were made, including valid alternatives and their tradeoffs. For example, an input may generate a unique `id` internally or require its consumer to provide one. Either approach can be valid; the operational document must state which contract is chosen, why, and what the consumer must do. This example illustrates the level of decision detail expected and does not prescribe an ID strategy.

Keep the operational document aligned with the implementation and update it when the contract, behavior, UI, service dependencies, or rationale changes. A primitive, component, or view is not complete until its operational document exists and reflects the accepted behavior. The repository-wide location and format for these documents are a planning decision to confirm.

## 5. User workflows

### Reader — look up an asset

1. Sign in with a reader profile.
2. Open the active asset lookup.
3. Search by description or asset number and apply filters if needed.
4. Open a grouped description to view its individual items.
5. Export permitted results as CSV or open the report to save it as PDF.

### Storekeeper — register an item

1. Sign in and open the inventory area.
2. Start a registration and fill in the item and unit details.
3. Receive confirmation that the record is active or pending, according to the approval rule.
4. Track the record and view its history.

### Storekeeper — update condition or unit

1. Find and open an individual item.
2. Change the allowed operational fields.
3. Save and view the corresponding history event.

### Administrator — review a pending item

1. Sign in and view the pending items list.
2. Open the asset and review its details.
3. Approve or reject the record.
4. View the decision in the history and check whether the record is available under its new status.

### Administrator — change a user's profile

1. Open **Usuários** in the side navigation.
2. View the list of accounts, their names, email addresses, and current profiles.
3. Select an account and choose a different access profile.
4. Save the change and verify the updated profile in the list and in the demonstration access.

### All profiles — update personal details

1. Open **Perfil** in the side navigation.
2. Update rank, unit, contact phone, first name, or last name.
3. Save and check the updated details in the header, navigation, and future reports.

### All profiles — save and apply a lookup

1. Search and combine filters and columns for the task.
2. Save the configuration with a recognizable name.
3. The first saved template becomes the automatic default; when opening the lookup without explicit URL filters, it restores the filters and columns.
4. Applying another template also makes it the default. Users can choose a different default from the templates menu.
5. Rename, update, or delete templates as needed.

## 6. Technical requirements and guidelines

### Future React Native port

- Develop the web version first as the functional reference for a future React Native version. The goal is to minimize duplication without requiring the web and native interfaces to use the same visual components.
- Keep domain rules, types, validations, permissions, filter combinations, lookup state serialization, and the template model independent of the DOM, CSS, browser, and native APIs.
- Define shared service contracts and implement platform-specific adapters for features that differ: local storage, navigation/deep links, printing and PDF, sharing, screen dimensions, safe areas, and the virtual keyboard.
- Build the web interface to be responsive and accessible from the start. In the native version, adapt presentation and interaction to mobile controls and conventions while preserving the same workflows and business rules. Do not assume HTML, CSS, or DOM components can be reused directly in React Native.
- Preserve the configurable table model and data across platforms. On the web, table rows become labeled cards on smaller screens; in React Native, use an equivalent native presentation.
- Keep color, spacing, typography, and interaction state tokens documented so the visual identity can be reproduced on both platforms.

### Architecture and code

- Use TypeScript for the domain, interface, and contracts between layers.
- Prefer shared `enum` declarations for finite sets of domain values — for example, profile, status, condition, operational status, and history actions. Define each enum once in a central domain module and import its members into components and services; avoid repeating string union types or status literals in screen files. This reduces typos and improves autocomplete. Use `type`/`interface` for structures and contracts that are not enumerations.
- Keep components granular, reusable, and clearly scoped. Compose pages from smaller components instead of concentrating logic in a single file.
- Keep shared visual components in the project's UI library, with consistent variants for buttons, fields, cards, indicators, and states.
- Maintain an operational document for every UI primitive, reusable component, and application view. Make each document discoverable from the implementation and record the unit's contract, behavior, states, UI and accessibility requirements, data/service dependencies, examples, tests, and the rationale and tradeoffs for important choices. Update it alongside implementation changes; do not leave required behavior or consumer obligations implicit in code.
- Separate the interface from business rules and services. Expected services include authentication, inventory, approvals, history, and export; define API contracts and implementations once the real infrastructure is chosen.
- Share types, domain rules, formatting, and report models between web and mobile wherever they are platform-independent.
- Isolate platform-dependent features in web and React Native adapters.
- Implement filters and templates with shareable TypeScript models and services. A template should store stable filter values and column keys, not translated labels or component state.
- Keep global unit selection in a domain rule independent of the interface. In the web version, navigation serializes the unit in the URL; in React Native, a navigation adapter must preserve the same scope across routes and deep links.
- Define an asynchronous local storage interface (list, save, update, and delete templates) and provide web and native adapters. `@react-native-async-storage/async-storage` is a candidate for React Native and Web; confirm compatibility with the selected bundler before adopting it in the current web app as well. Components must not depend directly on the storage library.
- Associate local templates with the user and version their format. Local storage does not automatically synchronize templates between browsers or devices; future synchronization requires a backend service.
- Persist the default template reference per user. When the lookup starts without filter parameters in the URL, restore the default template; explicit URL parameters take precedence. Applying a selected template updates the default reference.

### Styles and recurring values

- Use Tailwind CSS for web interface styles, prioritizing existing classes and tokens defined in the Tailwind configuration.
- When a visual or functional value recurs and no suitable Tailwind class or token exists, declare it as a constant, theme token, or named CSS variable instead of scattering literals.
- Keep report print styles in their own CSS, with named variables for colors and other recurring tokens. This HTML must also be usable by the mobile PDF generation adapter.
- Avoid magic numbers and duplicated rules for permissions, labels, date and currency formats, and statuses.

### Shell and responsive dimensions

- Render the entire application inside a shared root shell, including login, authenticated pages, modals, drawers, and messages.
- At runtime, the shell must calculate the CSS dimensions available to the application, accounting for the browser's visual viewport and browser bars. Pass the calculated height in pixels to the shell (for example, `height: 667px` when that is the usable height) instead of relying on `height: 100%`.
- Update the calculated dimensions when the window, device orientation, visual viewport, or virtual keyboard changes the available area.
- The shell must use `display: flex` and `flex-direction: column`. Content areas must scroll when needed; the actions area must use `margin-top: auto` to stay at the bottom of the column when there is room, without covering or blocking access to content.
- Check the minimum layout at 375 × 667 CSS px, accounting for browser bars, and on larger screens. Respect mobile device safe areas.
- Do not couple business rules to browser measurements. In React Native, get dimensions and orientation changes from platform APIs and apply the same layout constraints, with native handling for safe areas and the keyboard.

### PDF reports and mobile

- On the web, generate a dedicated HTML document and use the browser's native print/save dialog.
- Keep data assembly and HTML generation independent of external conversion services.
- For the future React Native version, evaluate Expo Print to generate the same HTML report as a local PDF; evaluate Expo Sharing for operating system sharing.
- Preserve a shared layer for report data and content, and use different adapters for web printing and mobile generation.
- Validate pagination, fonts, accented characters, and readability in browsers, iOS, and Android.

### Data, security, and operations

- Replace demonstration data with official persistence before real-world use.
- Define authentication, authorization policy, storage, auditing, synchronization, and failure recovery before production.
- Validate data in both the interface and the server, and keep an auditable record of relevant changes.
- Define the organization's access, retention, and asset data protection policies.

## 7. Open decisions for the production application

- Which backend, database, and authentication service will be used?
- What is the final approval rule: approve only the selected item or all items under a description/registration?
- In the production application, what rules should restrict profile changes (for example, changing one's own profile or removing the last administrator)?
- Should production user management also create, deactivate, or invite accounts, or only change profiles?
- Which fields are required, unique, and editable by each profile? How should assets without an estimated value or a defined unit be handled?
- Which units, organizations, and access scopes should exist?
- Will the mobile version use Expo or bare React Native? Must it support offline use and later synchronization?
- Which local storage adapter will be used in the web app and native version? Should templates remain device-local or eventually sync between devices?
- Should web PDF open the browser's print dialog, or must it also offer a direct download without a dialog?
- Which official reports, fields, signatures, crests, and visual standards are required?
- What are the policies for data retention, deletion, auditing, and export?

## 8. Planning draft for review

The sections below organize the work for review. They are planning proposals, not approval of new business rules. Items marked **Open** need a decision before dependent production behavior is implemented. The prototype descriptions in this document are not evidence that a feature has been independently verified against the code.

### 8.1 Product scope and planning assumptions

**Current prototype, as described above:** a web application with demonstration data, simulated authentication, session-only edits for some features, local lookup templates, asset lookup and registration, approval flows, user/profile screens, unit scoping, history, and exports.

**Production outcome required by this document:** a web application backed by an organization-approved source of data, real authentication, server-enforced authorization and unit scope, persistent records, and an auditable history. The production infrastructure and policies remain open decisions.

**Planning assumptions for review:**

- Treat production web delivery as the first release target. Treat React Native as a later, separately approved project; do not let mobile implementation block the production web foundation.
- Preserve the prototype's documented user workflows where they do not conflict with a decision the organization later makes.
- Do not use demonstration credentials, in-memory data, or client-side role checks as production security or persistence.
- Do not treat a question in Section 7 or a field marked **Open** as permission to choose a business rule. Record the decision and update this document first.

### 8.2 Delivery plan (proposed sequence)

No dates or effort estimates are assigned. Review the order and scope before treating it as a committed roadmap.

| Phase | Goal and main deliverables | Exit condition |
|---|---|---|
| 0. Product decisions | Review the open decisions; confirm roles, asset lifecycle, required fields, unit scope, reports, and first-release scope. | Decisions needed for the first production release are recorded in this document. Remaining questions are explicitly deferred. |
| 1. Production foundation | Select the backend, database, and identity provider; define domain/API contracts, persistence, server-side authorization, audit events, environments, and the operational-document convention/template. | A signed-in user can access the server through an agreed contract, the server enforces identity, permissions, and unit scope, and the documentation convention is recorded. |
| 2. Inventory workflows | Implement lookup, individual asset details, registration, permitted edits, unit scoping, validation, and history against persistent data. | The agreed reader and storekeeper workflows pass their acceptance criteria with server-backed data. |
| 3. Review and administration | Implement pending-item review, approval/rejection, user/profile administration, and personal profile updates according to confirmed rules. | The agreed administrator workflows pass their acceptance criteria and decisions are recorded in history. |
| 4. Reports and release readiness | Complete exports, responsive states, accessibility checks, error handling, operational logging, and release documentation. | Quality gates in Section 8.7 pass for the agreed browser/device matrix and no production flow depends on demo data or client-only authorization. |
| 5. React Native discovery/build | Decide whether mobile is required, whether offline use is needed, and whether to use Expo or bare React Native; then plan a native release separately. | A separate approved scope, platform architecture, and release plan exist. |

**Dependencies to confirm:** Phase 1 depends on the decisions about backend, identity, data ownership, and authorization. Phases 2–4 depend on the resulting API and domain contracts. Phase 5 depends on an explicit mobile decision.

### 8.3 Requirement status and traceability

Use these status labels when reviewing requirements and implementation:

- **Prototype described** — this document or the README says the behavior exists in the prototype; verify it against the code before relying on it.
- **Production required** — the behavior is required for the production application but may not exist yet.
- **Open** — a product or technical decision is needed before implementation can be finalized.
- **Deferred** — explicitly outside the agreed release scope; record who agreed and when.

| Requirement | Current planning status | Evidence needed before production sign-off |
|---|---|---|
| CR-01 Authentication and profile | Simulated in the prototype; production required. | Identity provider, account lifecycle, server session/token behavior, and role source are decided and verified. |
| CR-02 Overview | Prototype described; production required. | Role-specific content, unit scoping, and empty/error behavior are verified. |
| CR-03 Lookup and discovery | Prototype behavior described; production required. | Search, filter combinations, URL restoration, and authorization scope pass acceptance checks. |
| CR-04 Grouping and details | Prototype behavior described; production required. | Pointer and keyboard interaction, totals, and individual item navigation are verified. |
| CR-05 Registration | Prototype behavior described; production required. | Required fields, validation, duplicate handling, and approval outcome are decided and tested. |
| CR-06 Editing and movement | Prototype behavior described; production required. | Field-level permissions and history behavior are enforced by the server. |
| CR-07 Approval | Prototype behavior described; production required. | Approval scope, rejection behavior, actor, timestamp, and resulting status are decided and tested. |
| CR-08 History | Prototype behavior described; production required. | Required event types, immutable/auditable storage, and displayed details are agreed. |
| CR-09 Export | Prototype behavior described; production required. | Export scope, report content, formatting, and file behavior are verified. |
| CR-10 Responsive use | Prototype behavior described; production validation required. | The agreed viewport and device/browser checks pass, including 375 × 667 CSS px. |
| CR-11 Accessibility and language | Requirement defined; conformance target and verification are open. | Accessibility target, language review, keyboard path, focus, labels, and contrast checks are agreed. |
| CR-12 User management | Prototype session behavior described; production required. | Account lifecycle and permitted profile changes are decided and server-enforced. |
| CR-13 Personal profile | Prototype session behavior described; production required. | Editable fields, unit semantics, and persistence are verified. |
| CR-14 Lookup templates | Prototype local behavior described; grouped-column persistence added to the planning scope. | URL/template precedence, both table configurations, default behavior, schema migration, and storage scope are verified. |
| CR-15 Configurable tables | Prototype behavior described; grouped defaults and pagination defined for review. | Required columns, grouped defaults, page-size choices, page boundaries, action permissions, saved order, and export order are verified. |
| CR-16 Visual identity and mobile adaptation | Web visual rules are defined; native approach is future work. | Web assets/tokens are checked; native support is separately scoped before implementation. |
| CR-17 Global unit scope | Prototype behavior described; production server enforcement required. | Permitted units, URL behavior, cross-screen scope, and server filtering are verified. |
| CR-18 Operational component documentation | New requirement; current documentation coverage has not been inventoried. | Every primitive, reusable component, and view has a discoverable, current operational document. |

### 8.4 Acceptance criteria draft

These criteria turn CR-01–CR-18 into reviewable outcomes. They are a first draft; add or change criteria during product review. **Open** decisions remain unresolved even when a criterion describes the desired check.

| ID | Draft acceptance criteria |
|---|---|
| CR-01 | A valid organization identity signs in and receives the server-authorized profile. Invalid or expired authentication does not expose protected data. The production identity provider and account lifecycle are **Open**. |
| CR-02 | The overview shows only information the signed-in profile may access and respects the selected unit. Users can distinguish loading, no results, and failure states. The exact indicators and role-specific lists are **Open**. |
| CR-03 | Search finds records by description and asset number. Multiple selected values within one filter use OR; different filter categories use AND. Clearing filters resets the result state. Opening/reloading a URL restores its explicit filters. **Fazer resumo** always remains visible in the **Bens cadastrados** header row; it is disabled with no active search/filter and enabled when a criterion is active. If there are no matches, activating it opens an empty-summary state. PDF export is in the page-level actions beside templates and item creation. |
| CR-04 | A grouped result shows its item total. Clicking anywhere in the row or activating it by keyboard opens the individual items for that description. Each individual item can be identified by its asset number. |
| CR-05 | An authorized user can submit a record with the agreed fields. Invalid data is explained next to the relevant field and is not saved. The requiredness of estimated value, duplicate-number behavior, and approval exception for an existing approved description are **Open** for production confirmation. |
| CR-06 | A user can change only fields allowed by their profile. A successful unit or administrative-status change creates a history event with actor, time, and a useful change summary. Unauthorized server requests are rejected. |
| CR-07 | An authorized administrator can review a pending record and submit an approval or rejection. The resulting status, decision maker, and time are recorded. Whether a decision applies to one item or a group is **Open**. |
| CR-08 | An asset's history shows the agreed event types in a readable chronological order with date/time, author, and change summary. Users cannot rewrite an audit event through the ordinary asset-edit flow. Retention policy is **Open**. |
| CR-09 | An export contains only records the user is authorized to see and that match the active filters and unit scope. CSV downloads as a file. PDF includes the required report identity, generation time, readable columns, and usable pagination. Official report format is **Open**. |
| CR-10 | At 375 × 667 CSS px, the usable content remains reachable with browser bars and the virtual keyboard considered. Below 1280 px, lookup records use labeled cards and do not cause horizontal page overflow. At 1280 px and above, the table layout remains available. |
| CR-11 | The interface and reports use Brazilian Portuguese. Core flows can be completed by keyboard, focus is visible, controls have accessible names, and text meets the agreed contrast target. The WCAG version/level and automated tooling are **Open**. |
| CR-12 | An administrator can view registered users and change only fields permitted by the confirmed user-management policy. A non-administrator cannot perform the same change through either the interface or a direct server request. Account creation/deactivation/invitation policy is **Open**. |
| CR-13 | An authenticated user can update only their own agreed profile fields. They cannot change their own email or access profile through the personal profile flow. Saved values persist according to the selected production policy. The meaning of profile unit versus active unit scope is **Open**. |
| CR-14 | A user can save, apply, update, rename, and delete their own lookup template. Applying it restores filters plus grouped and individual table columns and updates the web URL. A lookup without explicit filter parameters uses the chosen default. Existing version 1 templates retain filters and individual columns and receive the default grouped columns during migration. Whether applying a template automatically makes it the default needs confirmation. |
| CR-15 | Users can show/hide optional columns, reorder and sort columns, while the required column and final actions column remain in their specified positions. Actions are permission-aware. Each data column's `align` setting (`start`, `center`, or `end`) applies to its header and body cells and defaults to `center`; long descriptions use `start`. Desktop tables have vertical column separators and a clear row-hover highlight. Tables page the sorted result set with a default of 10 rows and page-size choices of 10, 25, or 50; changing the data set or page size returns to page 1. The grouped table defaults to required **Item**, **Total**, and **Operacional**; other status breakdown columns are optional and hidden initially. Optional grouped columns can be saved in templates. In grouped lookup, the column control is first on the left beside the filters, and **Limpar** is last on the right when shown. Search and filters have no surrounding card; the **Bens cadastrados** heading and summary action sit above the table; the table border encloses the table grid only; pagination is an unboxed row below it. The configured individual-column order is used in exports and templates. |
| CR-16 | The web app uses the supplied logo without changing its colors or proportions and uses only the documented `sm`/`md` radii for the listed components. A native SVG implementation is selected and verified only if mobile is approved. |
| CR-17 | Changing the selected unit updates the visible scope across all listed screens and exports; the selection survives navigation and URL reload. The server independently limits results to units the user is permitted to access. The allowed-unit policy is **Open**. |
| CR-18 | Each UI primitive, reusable component, and view has an operational document that is discoverable from its implementation and covers its accepted contract, behavior, states, UI/accessibility requirements, dependencies, examples, and relevant tests. Significant choices include their rationale and tradeoffs. The repository-wide document location and format are **Open**. |

### 8.5 Draft permissions matrix

This matrix captures the prototype rules described in Section 3 and the personal-profile requirements. It is a review aid, not a final production authorization policy. **Open** means the production rule must be confirmed and enforced on the server.

| Capability | Reader | Storekeeper | Administrator/manager | Review note |
|---|---|---|---|---|
| View assets | Active assets | Active and pending assets | All statuses | Confirm whether scope differs by organization/unit. |
| Create asset | No | Yes; normally pending, with the documented approved-description exception | Yes; prototype README describes direct active creation | Confirm duplicate and approval rules. |
| Edit operational fields | No | Condition, operational status, and unit | Operational and administrative fields | Confirm field-level rules for production. |
| Approve/reject pending item | No | No | Yes | Approval scope and rejection effects are **Open**. |
| Manage another user's access profile | No | No | Yes in the prototype | Restrictions such as self-change and last administrator are **Open**. |
| Edit own profile | Yes, except email and access profile | Yes, except email and access profile | Yes, except email and access profile | Confirm which profile fields persist and whether unit is editable. |
| Export | Data the profile is authorized to view | Data the profile is authorized to view | Data the profile is authorized to view | Exports must use the same server authorization and unit scope as lookup. |

### 8.6 Domain, lifecycle, screen, and data drafts

#### Conceptual domain model

The following is a starting vocabulary inferred from the requirements, not a final database schema:

- **Asset item:** an individually tracked record with description, type, asset number, unit, condition, operational status, estimated value, and administrative status.
- **Description/group:** a lookup grouping for asset items that share a description and show a total; whether this is a separate catalog entity is **Open**.
- **User:** an organization-recognized identity with a profile and possibly an assigned unit. Relationship to identity-provider groups is **Open**.
- **Unit:** an organization-provided scope used by navigation, lookup, overview, users, and exports. Stable identifiers and hierarchy are **Open**.
- **History event:** an auditable event associated with an asset, including event type, actor, time, and a change summary.
- **Lookup template:** user-associated, versioned configuration containing filter values and column keys; it does not contain asset data or credentials.

#### Asset lifecycle draft

Documented status values are `active`, `pending`, `rejected`, and `deactivated`. The prototype description supports these transitions, subject to production review:

| Starting condition | Action | Result described in current requirements | Open question |
|---|---|---|---|
| Storekeeper registers an item | Description has no approved entry | New item awaits approval (`pending`) | Confirm duplicate/group matching rule. |
| Storekeeper registers an item | Description already has an approved entry | May be created active, per the prototype rule | Confirm whether production should retain this exception. |
| Administrator registers an item | Creates an item | README describes direct active creation | Confirm production behavior and audit event. |
| Pending item | Administrator approves | Active | Confirm whether approval applies to one item or a group. |
| Pending item | Administrator rejects | Rejected | Define whether rejected records can be edited, resubmitted, or removed. |
| Active item | Administrator deactivates | Deactivated | Define reason, reversibility, and who may reactivate. |

No other transitions should be assumed until they are agreed. The allowed condition values and operational-status values (including the authoritative I-23-PM source) must be documented before production validation is built.

#### Screen inventory draft

| Screen/area | Main purpose | Roles | States and interactions to specify or verify |
|---|---|---|---|
| Sign-in | Authenticate the user | All | Initial, submitting, invalid credentials, expired session, and service failure. |
| Overview | Show relevant indicators and work | All, with role-aware content | Loading, populated, empty, failure, unit scope, and navigation to underlying records. |
| Asset lookup | Find and group assets | All, subject to profile | Loading, no records, no filter matches, error, filters, URL restoration, sorting, table/card layout, page-size selection, and page navigation. |
| Grouped results and individual items | Move from a description to specific assets | All, subject to profile | Pointer/keyboard activation, required columns, actions menu, empty group, and back navigation. |
| Asset detail and history | Inspect one item and its audit events | All, subject to profile | Loading, unavailable/unauthorized, missing history, edit actions, and history ordering. |
| Create/edit asset | Register a record or change permitted fields | Storekeeper and administrator, per policy | Field validation, save in progress, success, duplicate, permission failure, and server error. |
| Pending review | Decide on pending records | Administrator/manager | Empty queue, loading, review detail, approve/reject confirmation, success, and conflict/error. |
| User management | Review accounts and change access profiles | Administrator/manager | Loading, no users, selected user, save, failure, and prohibited changes. |
| Personal profile | Edit own permitted details | All | Validation, save, success, failure, and clear indication of read-only email/profile fields. |
| Export/report | Create CSV or print/save PDF | All, subject to policy | Empty result, generation, download/print, failure, and confirmation of active scope. |
| Template controls | Save and manage lookup configurations | All, per-user | No templates, save/rename/update/delete, default selection, storage failure, and URL precedence. |
| Global unit selector | Change the active unit scope | All, subject to allowed units | Loading units, current unit, no permitted units, URL restoration, and failed unit loading. |

For every screen, review whether loading, empty, error, validation, success, and permission-denied states are needed. Do not add an offline state until offline behavior is decided. Confirm dialog copy and destructive-action confirmation where applicable.

#### Operational document outline for each UI unit

CR-18 applies individually to every primitive, reusable component, and view, including new ones. Documents should be concise enough to stay useful and detailed enough to make the implementation contract and accepted decisions explicit. Use this outline as a starting template:

1. **Purpose and boundaries:** what the unit is for, what it owns, what it intentionally leaves to its consumer, and where it should or should not be used.
2. **Requirements and consumers:** linked CR IDs or local requirements, expected consumers, and consumer responsibilities.
3. **Public contract:** props/parameters, children, callbacks/events, required versus optional inputs, defaults, generated values, and any stable identity requirements.
4. **Behavior and states:** interactions, state transitions, validation, loading/empty/error/success/disabled states, and edge cases.
5. **UI and accessibility:** visual variants, theme tokens, responsive behavior, keyboard/focus behavior, semantics, labels, and accessible names.
6. **Data and services:** data shape, service/API dependencies, persistence, side effects, error handling, and what is deliberately outside the component.
7. **Examples and constraints:** typical usage, important misuse cases, integration notes, and limitations.
8. **Decisions and rationale:** the chosen approach, why it was selected, alternatives considered, relevant tradeoffs, and any remaining questions. For example, document whether an input generates its own unique ID or requires the consumer to supply one, and explain the implications for consumers.
9. **Verification:** focused tests or manual checks that demonstrate the documented contract and behavior.

**Proposed discoverability rule for review:** colocate the document with the implementation when practical; otherwise keep it in one agreed component-documentation directory and link it from the source module or index. Choose one repository-wide convention before creating documents in bulk. A shared document for a tightly related component family is acceptable only if it has a clearly identified contract and decision record for each primitive/component/view it covers.

#### Data dictionary draft

This dictionary lists fields already named in the requirements. Requiredness, formats, constraints, and stable keys must be confirmed where marked **Open**.

| Entity | Field | Known purpose | Validation/decision still needed |
|---|---|---|---|
| Asset item | Description | Identifies the item and supports grouping | Requiredness, canonicalization, and group matching. |
| Asset item | Type | Classifies the item | Allowed values and source of truth. |
| Asset item | Asset number | Identifies an individual item | Uniqueness, format, mutability, and legacy exceptions. |
| Asset item | Unit | Locates/assigns the item | Stable ID, requiredness, allowed-unit checks, and transfer rules. |
| Asset item | Condition | Describes condition | Allowed values and edit permissions. |
| Asset item | Operational status | Describes operational status | Official I-23-PM values and edit permissions. |
| Asset item | Administrative status | `active`, `pending`, `rejected`, or `deactivated` | Allowed transitions, actor, and reversibility. |
| Asset item | Estimated value | Estimated monetary value | Requiredness, currency, precision, and handling when unknown. |
| User | Name, email, rank, unit, phone, profile | Identity, contact, and access profile | Identity source, formats, uniqueness, editable fields, and unit semantics. |
| History event | Type, actor, timestamp, summary | Audit of asset changes and decisions | Event schema, time zone, immutability, retention, and detail level. |
| Lookup template | Owner, name, schema version, filters, individual column keys, grouped column keys, default reference | Per-user saved lookup setup | Name uniqueness, storage adapter, migration, and synchronization policy. |

### 8.7 Quality gates and definition of done (draft)

Apply the gates relevant to the changed behavior. Treat the following as the proposed baseline for review; do not claim a gate has passed unless it was run or checked.

**For every behavior change:**

- Link the change to one or more CR IDs and acceptance criteria.
- Cover the main success path and relevant denied, invalid, empty, and failure paths.
- Confirm that permissions and unit scope are enforced by the server in production flows, not only hidden in the interface.
- For every primitive, component, or view changed or added, create or update its operational document and verify that documented contracts and consumer responsibilities match the implementation.
- Update this document when behavior, permissions, data rules, dependencies, or decisions change.

**Automated checks:**

- Run the focused existing tests and the repository's required Jest command: `npm test -- --watchAll=false --runInBand`.
- Run `npm run build` for production-build validation.
- Use only additional lint/type-check commands that are present in the project scripts or established CI; record the exact command and result.
- Cypress is not currently configured according to `AGENTS.md`. Configure it before making Cypress a required gate; then add focused end-to-end coverage for agreed critical journeys.

**Manual product and UI checks:**

- Check the minimum 375 × 667 CSS px layout with browser bars considered, at a width below 1280 px, and at 1280 px or wider.
- Complete the relevant journey with keyboard only; confirm visible focus and accessible control names.
- Check loading, empty, validation, error, and permission-denied states for the screens changed.
- Confirm that URL filters and unit scope survive reload where required, and that exports reflect the authorized, filtered result set.
- Agree and record supported browsers/devices, accessibility target, and any visual-regression process before treating those as release gates.

**Definition of done for a production feature:** its requirements and decisions are current; acceptance criteria have evidence; relevant automated and manual gates pass; server-side authorization and data validation are in place where required; every affected or newly added primitive, component, and view has a current operational document; and known limitations or deferred decisions are documented.

### 8.8 Documentation ownership and agent handoff

- `requirements.md` is the product source for intended workflows, rules, requirements, acceptance criteria, and open decisions.
- `AGENTS.md` is the repository source for implementation practices and task-level engineering instructions.
- `README.md` is the quick-start and high-level project overview; keep setup commands and user-facing prototype facts aligned with the implementation.
- The code is evidence of current implementation, not automatic approval of a product rule. If the code and requirements disagree, describe the discrepancy and avoid silently treating either behavior as the intended production rule.
- Before implementing a production feature, an agent should identify the relevant CR IDs, inspect existing components/services/types, identify any dependent **Open** decisions, and state which acceptance criteria the change will satisfy.
- Before changing or adding a primitive, component, or view, an agent should read its operational document. If none exists, create one using the agreed convention and capture the accepted contract and decisions as part of the same work. Do not choose between valid design alternatives silently; record the selected approach and rationale in the document.
- After implementation, the agent should report files changed, acceptance criteria covered, commands/checks run and their results, and any unresolved decision. Do not describe unrun checks as passing.
- When a requirement changes, update its acceptance criteria, permissions/data/screen sections that depend on it, relevant operational documents, and the open-decision list in the same planning change.

### 8.9 Decisions to review first

To unblock the proposed roadmap, review these questions before production implementation begins:

1. Is production web the agreed first release, with React Native explicitly deferred?
2. Which organization identity provider, backend, database, and hosting environment are approved?
3. What are the authoritative user roles, permitted units per user, and rules for changing another user's role?
4. Is an asset number unique and immutable? Which fields are required, and what happens when value or unit is unknown?
5. Does a storekeeper's approved-description exception create an active item? Does approval affect one item or a whole description/group?
6. Which status transitions are allowed after rejection or deactivation, and who may perform them?
7. Does changing a user's profile unit change their assigned unit, their initial scope, or both? How does that relate to the global unit selector?
8. Does applying a template make it the default, or should default selection be a separate action?
9. Which report layouts, data-retention rules, accessibility target, and browser/device support matrix are required for the first release?
10. Should operational documents be colocated with source files or live in a dedicated documentation directory, and what shared template should they follow?
