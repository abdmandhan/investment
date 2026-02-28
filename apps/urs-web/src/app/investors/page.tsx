'use client';;
import { useMemo, useState } from "react";
import { Edit01, Trash01 } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { Table, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { trpc } from "@/trpc/client";

type TableRow = {
  id: string;
  name: string;
  email?: string;
  status: "active" | "inactive";
  role: string;
  teams: { name: string; color: string }[];
  avatarUrl?: string;
};

function mapApiItemToRow(item: { id: string; name: string; email?: string }): TableRow {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    status: "active",
    role: "—",
    teams: [],
    avatarUrl: undefined,
  };
}

const InvestorsTable = () => {
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const { data, isLoading, error } = trpc.investors.list.useQuery({
    page,
    limit: 10,
  });

  const rows: TableRow[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map(mapApiItemToRow);
  }, [data?.items]);

  const sortedItems = useMemo(() => {
    return [...rows].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof TableRow];
      const second = b[sortDescriptor.column as keyof TableRow];

      if (typeof first === "string" && typeof second === "string") {
        const cmp = first.localeCompare(second);
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      }
      return 0;
    });
  }, [rows, sortDescriptor]);

  const totalPages = data && data.total > 0 ? Math.ceil(data.total / data.limit) : 1;

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
          <Table.Head id="name" label="Name" isRowHeader allowsSorting className="w-full max-w-1/4" />
          <Table.Head id="status" label="Status" allowsSorting />
          <Table.Head id="email" label="Email address" allowsSorting className="md:hidden xl:table-cell" />
          <Table.Head id="actions" />
        </Table.Header>

        <Table.Body items={isLoading ? [] : sortedItems}>
          {(item) => (
            <Table.Row id={item.id}>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar src={item.avatarUrl} alt={item.name} size="sm" />
                  <p className="text-sm font-medium whitespace-nowrap text-primary">{item.name}</p>
                </div>
              </Table.Cell>
              <Table.Cell>
                <BadgeWithDot size="sm" color={item.status === "active" ? "success" : "gray"} type="modern">
                  {item.status === "active" ? "Active" : "Inactive"}
                </BadgeWithDot>
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{item.email ?? "—"}</Table.Cell>
              <Table.Cell className="px-3">
                <div className="flex justify-end gap-0.5">
                  <ButtonUtility size="xs" color="tertiary" tooltip="Delete" icon={Trash01} />
                  <ButtonUtility size="xs" color="tertiary" tooltip="Edit" icon={Edit01} />
                </div>
              </Table.Cell>
            </Table.Row>
          )}
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
