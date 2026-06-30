# Projects Feature — Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Projects-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Projects code (this folder, or the project-related helpers in `src/lib/db.ts`
and `createProject` in `src/server/project-actions.ts`), update this file in the same change.** If a
fact here is now wrong, correct it; if you add/remove a field, action, helper, column, or convention,
reflect it. A stale AGENTS.md is worse than none — treat updating it as part of "done," not optional.

## What this feature is

A project workspace. Two routes, both **client components**:

- [page.tsx](./page.tsx) — the directory: searchable grid of project cards, plus the "Add Project"
  dialog. Requires at least one client to exist first (the button routes to `/dashboard/clients`
  otherwise).
- [[projectId]/page.tsx]([projectId]/page.tsx) — a single project, **tabbed**: Overview, Items,
  Files, Invoices (placeholder), Settings (placeholder). The active tab is mirrored into the URL as
  `?tab=` via `window.history.replaceState` so refresh/copied links land on the same tab.

## Files in this folder

- `_components/project-constants.ts` — **single source of truth** for the project form: `projectSchema`
  (Zod), `ProjectFormData`, `EMPTY_PROJECT_FORM`, `projectToForm` (Project → form), the status
  registries (`PROJECT_STATUSES`, `PROJECT_STATUS_LABELS`, `PROJECT_STATUS_VARIANT` — keeps status
  pills on shared Badge variants so they can't drift), and the tab registry (`PROJECT_TABS`,
  `ProjectTab`, `isProjectTab`). The `Project` Firestore type lives in `@/lib/types`.
- `_components/project-form-dialog.tsx` — the add/edit dialog (RHF + `zodResolver`), incl. the
  "same as main client address" toggle.
- `_components/project-header.tsx` — detail title + status, tab bar, edit/delete actions.
- `_components/project-information-card.tsx`, `project-notes-card.tsx`, `project-proposals-card.tsx`,
  `project-files-card.tsx` — Overview-tab cards (proposals card spawns a Draft proposal and routes to
  it; files card lists project documents).
- `_components/delete-project-dialog.tsx` — confirm-delete for the whole project.
- `tabs/project-items.tsx` — the **Items tab** (the heavy one — see its own section below).
- `tabs/_tab_components/items-table.tsx` — the list-view items grid renderer.
- `tabs/_tab_components/add-items-dialog.tsx` — add items to a section: "Library Items" (multi-select
  from the catalog with per-item qty) or "Create New Item" (custom form, optionally also saved to the
  Global Library). Catalog add spreads the library item minus `itemId`/`updatedAt` and stamps
  `libraryItemId`. Category/subcategory/unit/cost constants are imported from
  `../../../library/_components/library-constants` — don't fork them.
- `tabs/_tab_components/edit-item-dialog.tsx` — edit a single `ProjectRoomItem` in place.

## Where the data comes from

Three **top-level** Firestore collections, all addressed by their own id and queried by `projectId`
(items also carry `organizationId`). All persistence is in `src/lib/db.ts`:

- `projects` — `getProject(projectId)` (single doc; **does not filter by org**), `getProjects(orgId)`,
  `updateProject`, `deleteProject`, `formatProjectAddress`.
- `projectRooms` ("sections") — `addProjectRoom`, `updateProjectRoom`, `deleteProjectRoom`,
  `getProjectRooms`. Ids are `room-<random>`, generated in `db.ts`.
- `projectRoomItems` — `addProjectRoomItem`, `updateProjectRoomItem`, `deleteProjectRoomItem`,
  `reorderProjectRoomItems`, `getProjectRoomItems`. Ids are `roomitem-<random>`.

**Project creation is a server action**, not a `db.ts` write: `createProject` in
`src/server/project-actions.ts` mints the `projectCode`/`projectNumber` reference code in a
transaction and copies the selected client's `clientCode` (root AGENTS.md rule #5). The list page
calls it; only updates/deletes go through `db.ts`. There is no `addProject` helper anymore.

## Tenant isolation — read this before touching the detail route

`getProject(projectId)` returns **any** org's project (docs are addressed by a guessable id). The
detail page is responsible for the check: [[projectId]/page.tsx]([projectId]/page.tsx) compares
`projectData.organizationId !== organizationId` and redirects to the directory if it doesn't match.
**Keep that guard.** If you add another caller of `getProject`, re-apply the same org check.

## The Items tab (`tabs/project-items.tsx`) — the subtle part

Two views of the same rooms+items data, toggled by a grid/list switch and cross-faded with `FadeIn`:

- **Grid view** — one card per section, simple item rows. Not draggable.
- **List view** — one `ItemsTable` per section, rows draggable **within and across** sections.

### Realtime + shared column layout

The tab is **fully realtime** via three `onSnapshot` listeners set up in one effect (keyed on
`project.projectId`, `organizationId`, `authLoading`): the **project doc**, `projectRooms`, and
`projectRoomItems`. It seeds from the `initialProject` prop but then drives off live state
(`const [project, setProject] = useState(initialProject)`).

The list-view **column layout (visibility + widths) is shared across all viewers**, persisted on the
project doc as `itemColumnLayout` (`ItemColumnLayout` in `@/lib/types`) so the presentation is the
same for everyone printing/presenting it. This is deliberately subtle:

- Local edits flow through optimistic `columnVisibility`/`columnSizing` state and are written by a
  **debounced** effect (`LAYOUT_SAVE_DEBOUNCE_MS`, coalesces resize-drags) via
  **`updateProjectItemsLayout`** — a dedicated helper that writes only the layout and **does not bump
  `lastActivityAt`** (it's a presentation tweak, not project activity). Don't route layout writes
  through `updateProject`.
- `persistedLayoutRef` (a JSON string of the layout we believe is saved) breaks the
  snapshot→setState→save **feedback loop**: the project listener only re-applies an incoming layout
  when it differs from the ref; the save effect skips when the current layout equals the ref. Keep
  both guards if you touch this — without them, every viewer's echo triggers another write.
- `skipFirstPersistRef` skips the very first save run so merely opening the page never writes defaults
  back.

### The items grid (`items-table.tsx`)

A TanStack-Table **state layer rendered as a CSS grid, not a `<table>`** — widths are one declarative
`grid-template-columns` string (a `--items-cols` CSS var), which makes columns trivially resizable
without the table layout fighting back.

- **`ITEM_FIELDS` is the single source of truth**, and it lives in **`items-fields.tsx`** (a
  TanStack/dnd-free module) — `items-table.tsx` imports it and re-exports `ITEM_COLUMN_OPTIONS` /
  `DEFAULT_ITEM_COLUMN_VISIBILITY` for back-compat. The registry is split out so read-only consumers
  can mirror the same columns **without** pulling in the interactive table: the proposal preview
  (`portal/preview/proposal/[projectId]`) renders a static `ProposalItemsTable` from `ITEM_FIELDS` +
  the project's saved `itemColumnLayout` (same `cellClass`/track logic, no grip/actions/resize). Each
  entry becomes a TanStack column, a column-picker option (`ITEM_COLUMN_OPTIONS`), and a
  default-visibility flag (`DEFAULT_ITEM_COLUMN_VISIBILITY`). **To add/remove/relabel a column, edit
  `ITEM_FIELDS` only** — the picker, defaults, and the proposal table all derive from it.
  `thumbnail`/`actions` are structural (fixed px, never hidden/resized).
- **Default widths are proportional (`fr`)** so the grid fills the container on load at any screen
  size — no per-screen pixel guessing. A column the user resizes switches to a fixed `px` width
  (stored in `columnSizing`); the remaining `fr` columns absorb the slack.
- Both files declare **`"use no memo"`** — React Compiler is on, and TanStack table components render
  dead without it (see the project memory note). Don't remove it.
- **Cross-section drag:** the `DndContext` is lifted to the parent (`project-items.tsx`) so it spans
  every section; each section is a `useDroppable` (`room:<roomId>`, droppable even when empty), each
  row a `useSortable`. `onDragOver` re-homes the dragged item into the target section in local state
  for a live preview; `onDragEnd` settles order and persists via `reorderProjectRoomItems` (one batch
  write, passing `roomId` only for an item that changed sections). Order is held in
  `ProjectRoomItem.sortOrder` (new items append via `Date.now()`).

## Conventions easy to break

- **Form changes are three-touch.** A new project field means updating `projectSchema`,
  `EMPTY_PROJECT_FORM`, **and** `projectToForm` in `project-constants.ts`, plus a `Controller` in
  `project-form-dialog.tsx`. Miss one and RHF/Zod silently drop or mistype the field.
- **ZIP goes through shared helpers.** `formatZip` on display/change and `isValidUsZip` in the schema
  (root AGENTS.md). Never write a local formatter.
- **`organizationId` is the effect dependency, not `profile`.** Every route/effect here depends on the
  stable `organizationId` string from `useAuth` (the `profile` object identity churns each heartbeat).
  Keep it that way.
- **Sections must be empty before deletion.** The delete-section flow blocks (shows a "move/delete the
  items first" notice) when the section still has items; `deleteProjectRoom` only removes the room doc.
  Don't bypass the count guard (`deletingRoomItemCount`).
- **Tab state is URL-synced.** Changing tabs calls `replaceState` with `?tab=`; the initial tab reads
  it back via `isProjectTab`. Preserve that so refresh/links stay on the right tab.
- **Layout writes are special.** Use `updateProjectItemsLayout` (not `updateProject`) for column
  layout, and keep the `persistedLayoutRef` feedback-loop guards (see the Items-tab section).
