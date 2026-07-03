import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  CellValueChangedEvent,
  ColumnState,
} from "ag-grid-community";
import {
  useListViews,
  useCreateView,
  useDeleteView,
  getListViewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { gridLightTheme, gridDarkTheme } from "@/lib/ag-grid";
import { useIsDark } from "@/hooks/use-is-dark";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Upload,
  Download,
  Columns3,
  FilterX,
  RefreshCw,
  Rows3,
  Save,
  Bookmark,
  Trash2,
  Loader2,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type { ColDef } from "ag-grid-community";

export interface BulkAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (rows: T[]) => void;
  destructive?: boolean;
}

export interface ServerMode {
  totalRows: number;
  page: number;
  pageSize: number;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSortChange: (sortBy: string | null, sortOrder: "asc" | "desc" | null) => void;
  onSearchChange: (search: string) => void;
  loading?: boolean;
}

type Density = "compact" | "normal" | "comfortable";
const DENSITY_HEIGHT: Record<Density, number> = {
  compact: 36,
  normal: 46,
  comfortable: 58,
};

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100, 500];

interface DataGridProProps<T> {
  tableKey: string;
  title: string;
  description?: string;
  columnDefs: ColDef<T>[];
  rowData?: T[];
  loading?: boolean;
  error?: unknown;
  getRowId?: (row: T) => string;
  onRefresh?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  onImport?: () => void;
  exportFileName?: string;
  enableSelection?: boolean;
  bulkActions?: BulkAction<T>[];
  onCellEdited?: (row: T, field: string, newValue: unknown) => void;
  toolbarFilters?: ReactNode;
  filterChips?: ReactNode;
  searchValue?: string;
  onClearFilters?: () => void;
  pageSizeOptions?: number[];
  serverMode?: ServerMode;
  emptyMessage?: string;
  height?: number | string;
}

interface SavedViewState {
  columnState: ColumnState[];
  filterModel: Record<string, unknown>;
  density: Density;
  pageSize: number;
}

export function DataGridPro<T>(props: DataGridProProps<T>) {
  const {
    tableKey,
    title,
    description,
    columnDefs,
    rowData,
    loading,
    error,
    getRowId,
    onRefresh,
    onAdd,
    addLabel = "Add",
    onImport,
    exportFileName,
    enableSelection,
    bulkActions,
    onCellEdited,
    toolbarFilters,
    filterChips,
    searchValue,
    onClearFilters,
    pageSizeOptions = DEFAULT_PAGE_SIZES,
    serverMode,
    emptyMessage = "No records found.",
    height = 560,
  } = props;

  const isDark = useIsDark();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const apiRef = useRef<GridApi<T> | null>(null);

  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<Density>("normal");
  const [clientPageSize, setClientPageSize] = useState(pageSizeOptions[2] ?? 50);
  const [selectedCount, setSelectedCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [colVersion, setColVersion] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewName, setViewName] = useState("");

  const { data: views } = useListViews({ tableKey });
  const createView = useCreateView();
  const deleteView = useDeleteView();

  const isServer = !!serverMode;

  const defaultColDef = useMemo<ColDef<T>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: !isServer,
      floatingFilter: false,
      minWidth: 100,
      flex: 1,
    }),
    [isServer],
  );

  const finalColumnDefs = useMemo<ColDef<T>[]>(() => {
    const cols = [...columnDefs];
    if (bulkActions?.length || onCellEdited || columnDefs.length) {
      // no-op, placeholder to keep memo dependency stable
    }
    return cols;
  }, [columnDefs, bulkActions, onCellEdited]);

  const onGridReady = useCallback(
    (e: GridReadyEvent<T>) => {
      apiRef.current = e.api;
      setDisplayedCount(e.api.getDisplayedRowCount());
    },
    [],
  );

  const handleSelectionChanged = useCallback(
    (e: SelectionChangedEvent<T>) => {
      setSelectedCount(e.api.getSelectedRows().length);
    },
    [],
  );

  const handleSortChanged = useCallback(
    (e: SortChangedEvent<T>) => {
      if (!serverMode) return;
      const state = e.api.getColumnState().find((c) => c.sort);
      serverMode.onSortChange(
        state?.colId ?? null,
        (state?.sort as "asc" | "desc" | undefined) ?? null,
      );
    },
    [serverMode],
  );

  const handleCellValueChanged = useCallback(
    (e: CellValueChangedEvent<T>) => {
      if (!onCellEdited || !e.colDef.field) return;
      onCellEdited(e.data, e.colDef.field, e.newValue);
    },
    [onCellEdited],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (serverMode) {
        serverMode.onSearchChange(value);
      } else {
        apiRef.current?.setGridOption("quickFilterText", value);
        setDisplayedCount(apiRef.current?.getDisplayedRowCount() ?? 0);
      }
    },
    [serverMode],
  );

  const handleDensity = useCallback((value: Density) => {
    setDensity(value);
    apiRef.current?.setGridOption("rowHeight", DENSITY_HEIGHT[value]);
    apiRef.current?.resetRowHeights();
  }, []);

  const handleExport = useCallback(() => {
    apiRef.current?.exportDataAsCsv({
      fileName: `${exportFileName ?? tableKey}.csv`,
    });
  }, [exportFileName, tableKey]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    if (serverMode) {
      serverMode.onSearchChange("");
    } else {
      apiRef.current?.setFilterModel(null);
      apiRef.current?.setGridOption("quickFilterText", "");
      setDisplayedCount(apiRef.current?.getDisplayedRowCount() ?? 0);
    }
    onClearFilters?.();
  }, [serverMode, onClearFilters]);

  const toggleColumn = useCallback((colId: string, visible: boolean) => {
    apiRef.current?.setColumnsVisible([colId], visible);
    setColVersion((v) => v + 1);
  }, []);

  const runBulk = useCallback(
    (action: BulkAction<T>) => {
      const rows = apiRef.current?.getSelectedRows() ?? [];
      if (!rows.length) return;
      action.onClick(rows);
    },
    [],
  );

  const handleSaveView = useCallback(() => {
    if (!apiRef.current || !viewName.trim()) return;
    const state: SavedViewState = {
      columnState: apiRef.current.getColumnState(),
      filterModel: apiRef.current.getFilterModel() as Record<string, unknown>,
      density,
      pageSize: isServer ? serverMode!.pageSize : clientPageSize,
    };
    createView.mutate(
      {
        data: {
          tableKey,
          name: viewName.trim(),
          state: state as unknown as Record<string, unknown>,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListViewsQueryKey({ tableKey }),
          });
          setSaveOpen(false);
          setViewName("");
          toast({ title: "View saved" });
        },
        onError: (err) =>
          toast({
            title: "Error",
            description: (err as Error).message,
            variant: "destructive",
          }),
      },
    );
  }, [
    viewName,
    density,
    isServer,
    serverMode,
    clientPageSize,
    tableKey,
    createView,
    queryClient,
    toast,
  ]);

  const applyView = useCallback(
    (raw: unknown) => {
      if (!apiRef.current) return;
      const state = raw as SavedViewState;
      if (state.columnState) {
        apiRef.current.applyColumnState({
          state: state.columnState,
          applyOrder: true,
        });
      }
      if (state.filterModel && !isServer) {
        apiRef.current.setFilterModel(state.filterModel);
      }
      if (state.density) handleDensity(state.density);
      if (state.pageSize) {
        if (isServer) {
          serverMode!.onPaginationChange(0, state.pageSize);
        } else {
          setClientPageSize(state.pageSize);
          apiRef.current.setGridOption("paginationPageSize", state.pageSize);
        }
      }
      setColVersion((v) => v + 1);
      setDisplayedCount(apiRef.current.getDisplayedRowCount());
    },
    [isServer, serverMode, handleDensity],
  );

  const handleDeleteView = useCallback(
    (id: number) => {
      deleteView.mutate(
        { id },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({
              queryKey: getListViewsQueryKey({ tableKey }),
            }),
        },
      );
    },
    [deleteView, queryClient, tableKey],
  );

  const columnsForToggle = apiRef.current?.getColumns() ?? [];
  void colVersion;

  const totalRows = isServer ? serverMode.totalRows : (rowData?.length ?? 0);
  const showLoading = loading || serverMode?.loading;

  const pageCount = isServer
    ? Math.max(1, Math.ceil(serverMode.totalRows / serverMode.pageSize))
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary dark:text-secondary-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onImport && (
            <Button variant="outline" onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" /> {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchValue ?? search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {toolbarFilters}

        {/* Columns show/hide */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Columns3 className="h-4 w-4 mr-2" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columnsForToggle
              .filter((c) => c.getColDef().headerName || c.getColDef().field)
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.getColId()}
                  checked={c.isVisible()}
                  onCheckedChange={(v) => toggleColumn(c.getColId(), !!v)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {c.getColDef().headerName ?? c.getColDef().field}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Density */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Rows3 className="h-4 w-4 mr-2" /> Density
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["compact", "normal", "comfortable"] as Density[]).map((d) => (
              <DropdownMenuItem
                key={d}
                onClick={() => handleDensity(d)}
                className="capitalize"
              >
                {d}
                {density === d && <span className="ml-auto text-primary">•</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Saved views */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Bookmark className="h-4 w-4 mr-2" /> Views
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!views?.length && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No saved views yet.
              </div>
            )}
            {views?.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between px-2 py-1 hover:bg-accent rounded-sm"
              >
                <button
                  className="flex-1 text-left text-sm py-1"
                  onClick={() => applyView(v.state)}
                >
                  {v.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDeleteView(v.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSaveOpen(true)}>
              <Save className="h-4 w-4 mr-2" /> Save current view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleClearFilters}
        >
          <FilterX className="h-4 w-4 mr-2" /> Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {filterChips && (
        <div className="flex flex-wrap items-center gap-2">{filterChips}</div>
      )}

      {/* Bulk actions bar */}
      {enableSelection && selectedCount > 0 && bulkActions?.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="flex-1" />
          {bulkActions.map((a, i) => (
            <Button
              key={i}
              size="sm"
              variant={a.destructive ? "destructive" : "outline"}
              onClick={() => runBulk(a)}
            >
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Grid */}
      <div className="relative rounded-xl border overflow-hidden bg-card">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message ?? "Please try again."}
            </p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            )}
          </div>
        ) : (
          <div style={{ height, width: "100%" }}>
            <AgGridReact
              theme={isDark ? gridDarkTheme : gridLightTheme}
              columnDefs={finalColumnDefs}
              rowData={rowData ?? []}
              defaultColDef={defaultColDef}
              getRowId={
                getRowId
                  ? (p) => getRowId(p.data)
                  : undefined
              }
              rowHeight={DENSITY_HEIGHT[density]}
              onGridReady={onGridReady}
              onSelectionChanged={handleSelectionChanged}
              onSortChanged={handleSortChanged}
              onCellValueChanged={handleCellValueChanged}
              onModelUpdated={(e) =>
                setDisplayedCount(e.api.getDisplayedRowCount())
              }
              rowSelection={
                enableSelection
                  ? {
                      mode: "multiRow",
                      checkboxes: true,
                      headerCheckbox: true,
                    }
                  : undefined
              }
              pagination={!isServer}
              paginationPageSize={clientPageSize}
              paginationPageSizeSelector={pageSizeOptions}
              suppressColumnVirtualisation
              loading={showLoading}
              overlayNoRowsTemplate={`<span class="text-muted-foreground">${emptyMessage}</span>`}
            />
          </div>
        )}

        {/* Empty state overlay for server mode */}
        {!error && !showLoading && isServer && totalRows === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/80 pointer-events-none">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Status bar / server pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground px-1">
        <div className="flex items-center gap-4">
          <span>
            {isServer ? (
              <>Total: {totalRows.toLocaleString()}</>
            ) : (
              <>
                Showing {displayedCount.toLocaleString()} of{" "}
                {totalRows.toLocaleString()}
              </>
            )}
          </span>
          {enableSelection && (
            <span>{selectedCount.toLocaleString()} selected</span>
          )}
          {showLoading && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading
            </span>
          )}
        </div>

        {isServer && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select
                value={String(serverMode.pageSize)}
                onValueChange={(v) =>
                  serverMode.onPaginationChange(0, Number(v))
                }
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span>
              Page {serverMode.page + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={serverMode.page <= 0}
                onClick={() =>
                  serverMode.onPaginationChange(
                    serverMode.page - 1,
                    serverMode.pageSize,
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={serverMode.page >= pageCount - 1}
                onClick={() =>
                  serverMode.onPaginationChange(
                    serverMode.page + 1,
                    serverMode.pageSize,
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save view dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <Label>View name</Label>
            <Input
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="e.g. My default layout"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveView();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Saves current column layout, sizes, filters, density and page
              size.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveView}
              disabled={!viewName.trim() || createView.isPending}
            >
              {createView.isPending ? "Saving..." : "Save view"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
