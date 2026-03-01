'use client';

import { useCallback, useMemo, useState } from "react";
import { Edit01, Trash01 } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { Table, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { trpc } from "@/trpc/client";
import { InvestorsFilterRow, type SearchParam } from "./investors-filter-row";

const FILTER_ROW_ID = "__filter" as const;

const InvestorsTable = () => {
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "created_at",
    direction: "descending",
  });
  const [searchParams, setSearchParams] = useState<SearchParam[]>([]);

  const { data, isLoading, error } = trpc.investors.list.useQuery({
    page,
    limit: 20,
    sort: sortDescriptor.column as string,
    sort_by: sortDescriptor.direction === "ascending" ? "asc" : "desc",
    searchs: searchParams,
  });

  const handleSearchChange = useCallback((params: SearchParam[]) => {
    setSearchParams(params);
    setPage(1);
  }, []);

  const totalPages = data && data.total > 0 ? Math.ceil(data.total / data.limit) : 1;

  const tableItems = useMemo(() => {
    const filterRow = { id: FILTER_ROW_ID, __isFilterRow: true as const };
    return [filterRow, ...(data?.items ?? [])];
  }, [data?.items]);

  if (error) {
    return (
      <TableCard.Root size="sm">
        <TableCard.Header title="Investors" />
        <div className="px-4 py-8 text-center text-sm text-red-600">
          Failed to load investors: {error.message}
        </div>
      </TableCard.Root>
    );
  }

  console.log('render table')

  return (
    <TableCard.Root size="sm">
      <TableCard.Header
        title="Investors"
        contentTrailing={
          <div className="absolute top-5 right-4 md:right-6">
            <TableRowActionsDropdown />
          </div>
        }
      />
      <Table
        aria-label="Investors"
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <Table.Header>
          <Table.Head id="first_name" label="Name" isRowHeader allowsSorting className="w-full max-w-1/4" />
          <Table.Head id="investor_type_id" label="Investor Type" allowsSorting className="md:hidden xl:table-cell" />
          <Table.Head id="email" label="Email address" allowsSorting className="md:hidden xl:table-cell" />
          <Table.Head id="sid" label="SID" allowsSorting />
          <Table.Head id="actions" />
        </Table.Header>

        <Table.Body items={tableItems}>
          {(item) => {
            if ("__isFilterRow" in item && item.__isFilterRow) {
              return (
                <InvestorsFilterRow
                  filterRowId={FILTER_ROW_ID}
                  initialSearchParams={searchParams}
                  onSearchChange={handleSearchChange}
                />
              );
            }
            const row = item as { id: string; name: string; email?: string; investor_type_id: string; sid: string | null };
            return (
              <Table.Row id={row.id}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium whitespace-nowrap text-primary">{row.name}</p>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <BadgeWithDot size="sm" color={row.investor_type_id === "individual" ? "success" : "gray"} type="modern">
                    {row.investor_type_id === "I" ? "Individual" : "Corporate"}
                  </BadgeWithDot>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{row.email ?? "—"}</Table.Cell>
                <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{row.sid ?? "—"}</Table.Cell>
                <Table.Cell className="px-3">
                  <div className="flex justify-end gap-0.5">
                    <ButtonUtility size="xs" color="tertiary" tooltip="Delete" icon={Trash01} />
                    <ButtonUtility size="xs" color="tertiary" tooltip="Edit" icon={Edit01} />
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          }}
        </Table.Body>
      </Table>

      {isLoading && (
        <div className="px-4 py-6 text-center text-sm text-muted">Loading investors…</div>
      )}

      <PaginationCardMinimal
        align="right"
        page={page}
        total={totalPages}
        onPageChange={setPage}
        className="px-4 py-3 md:px-5 md:pt-3 md:pb-4"
      />
    </TableCard.Root>
  );
};

export default function InvestorsPage() {
  return <InvestorsTable />;
}
