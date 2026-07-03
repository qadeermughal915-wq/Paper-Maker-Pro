import type { ReactNode } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  destructive?: boolean;
  hidden?: (row: T) => boolean;
}

export function makeActionsColumn<T>(
  getActions: (row: T) => RowAction<T>[],
  overrides?: Partial<ColDef<T>>,
): ColDef<T> {
  return {
    headerName: "",
    colId: "__actions",
    pinned: "right",
    width: 64,
    minWidth: 64,
    maxWidth: 80,
    flex: 0,
    sortable: false,
    filter: false,
    resizable: false,
    editable: false,
    suppressMovable: true,
    cellRenderer: (params: ICellRendererParams<T>) => {
      if (!params.data) return null;
      const row = params.data;
      const actions = getActions(row).filter((a) => !a.hidden?.(row));
      if (!actions.length) return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((a, i) => (
              <DropdownMenuItem
                key={i}
                onClick={() => a.onClick(row)}
                className={a.destructive ? "text-destructive" : ""}
              >
                {a.icon}
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    ...overrides,
  };
}
