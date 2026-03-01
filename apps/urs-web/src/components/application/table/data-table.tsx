"use client";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ChevronSelectorVertical } from "@untitledui/icons";
import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

/** Extended column meta for header/cell class names. */
type DataTableColumnMeta = { headerClassName?: string; cellClassName?: string };

export const cellBase =
  "relative text-sm text-tertiary outline-focus-ring focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2 max-w-sm overflow-auto";
export const cellSizeSm = "px-5 py-0";
export const cellSizeMd = "px-6 py-4";
export const rowBorder =
  "[&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:w-full [&>td]:after:bg-border-secondary last:[&>td]:after:hidden [&>td]:focus-visible:after:opacity-0 focus-visible:[&>td]:after:opacity-0";
export const thBase =
  "relative p-0 px-6 py-2 outline-hidden focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-bg-primary focus-visible:ring-inset";

export interface DataTableProps<T> {
  /** Column definitions. */
  columns: ColumnDef<T, unknown>[];
  /** Row data. */
  data: T[];
  /** Optional filter row (single <tr> with one <td> per column). */
  filterRow?: ReactNode;
  /** Current sorting (server-driven). */
  sorting?: { columnId: string; direction: "asc" | "desc" };
  /** Called when user requests a sort. */
  onSortChange?: (columnId: string, direction: "asc" | "desc") => void;
  /** Row key for React. */
  getRowId?: (row: T) => string;
  /** Shown when data is empty. */
  emptyState?: ReactNode;
  /** Table density. */
  size?: "sm" | "md";
  /** Called when a row is clicked. */
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  filterRow,
  sorting,
  onSortChange,
  getRowId,
  emptyState = "No results.",
  size = "sm",
  onRowClick,
}: DataTableProps<T>) {
  const sortingState: SortingState =
    sorting != null ? [{ id: sorting.columnId, desc: sorting.direction === "desc" }] : [];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting: sortingState },
    manualSorting: true,
    getRowId: getRowId
      ? (row) => getRowId(row as T)
      : (_, index) => String(index),
  });

  const cellPadding = size === "sm" ? cellSizeSm : cellSizeMd;
  const headerHeight = size === "sm" ? "h-9" : "h-11";
  const rowHeight = size === "sm" ? "h-10" : "h-18";

  return (
    <div className="overflow-x-auto">
      <table className="w-full overflow-x-hidden">
        <thead className={cx("relative bg-secondary", headerHeight)}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                const handleSort =
                  canSort && onSortChange
                    ? () => {
                      const next = sortDir === "desc" ? "asc" : "desc";
                      onSortChange(header.column.id, next);
                    }
                    : undefined;
                return (
                  <th
                    key={header.id}
                    className={cx(
                      thBase,
                      canSort && "cursor-pointer",
                      (header.column.columnDef.meta as DataTableColumnMeta)?.headerClassName
                    )}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    onClick={handleSort}
                    onKeyDown={
                      handleSort
                        ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSort();
                          }
                        }
                        : undefined
                    }
                    tabIndex={handleSort ? 0 : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {typeof header.column.columnDef.header === "function"
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                      {canSort &&
                        (sortDir ? (
                          <ArrowDown
                            className={cx(
                              "size-3 stroke-[3px] text-fg-quaternary",
                              sortDir === "asc" && "rotate-180"
                            )}
                          />
                        ) : (
                          <ChevronSelectorVertical
                            size={12}
                            strokeWidth={3}
                            className="text-fg-quaternary"
                          />
                        ))}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {filterRow}
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={cx("px-5 py-8 text-center text-sm text-muted", cellPadding)}
              >
                {emptyState}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cx(
                  "relative outline-focus-ring transition-colors after:pointer-events-none hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2",
                  rowHeight,
                  rowBorder
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cx(cellBase, cellPadding, (cell.column.columnDef.meta as DataTableColumnMeta)?.cellClassName)}
                    style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
