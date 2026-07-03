---
name: JSX explicit generic args break the Replit metadata babel plugin
description: Why <Component<T> ...> in TSX crashes the web app dev server, and how to write generic components instead
---

Explicit generic type arguments on a JSX element — e.g. `<DataGridPro<Question> ...>` or `<AgGridReact<T> ...>` — crash the Vite dev build in `artifacts/web` with a babel parse error ("Unexpected token"), returning HTTP 500 for the page.

**Why:** the `replit-cartographer` / react-babel metadata plugin injects `data-replit-metadata` and `data-component-name` attributes into the opening JSX tag *before* the generic type argument, producing invalid syntax like `<DataGridPro data-replit-metadata="..." data-component-name="DataGridPro"<Question>`. Plain `tsc` typecheck passes, so this only shows up at runtime in the dev server / screenshot — never trust typecheck alone here.

**How to apply:** never use explicit generic args in JSX in this project. Drop them and let TypeScript infer `T` from props (a `columnDefs: ColDef<T>[]` prop pins `T` fine). Function *call* generics like `makeActionsColumn<Teacher>(...)` are fine — the plugin only rewrites JSX elements. For a generic component's own render, write `<AgGridReact ...>` (infers `any`) rather than `<AgGridReact<T> ...>`.
