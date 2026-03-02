'use client';

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit01, Trash01 } from "@untitledui/icons";
import { DataTable } from "@/components/application/table/data-table";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { trpc } from "@/trpc/client";
import { InvestorsFilterRow, type SearchParam } from "./investors-filter-row";
import { NativeSelect } from "@/components/base/select/select-native";
import { Tabs } from "@/components/application/tabs/tabs";
import { Key } from "react-aria";
import { ProfileTab } from "./profile-tab";
import { PortfolioTab } from "./portfolio-tab";

type InvestorRow = {
  id: string;
  name: string;
  email?: string;
  investor_type_id: string;
  sid: string | null;
  /** Formatted AUM string from API (e.g. "IDR 1.2M"). */
  aum: string;
};

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "portfolio", label: "Portfolio" },
  { id: "transactions", label: "Transactions" },
  { id: "journals", label: "Journals" },
];

const columns: ColumnDef<InvestorRow>[] = [
  {
    id: "first_name",
    accessorKey: "name",
    header: () => <span className="text-xs font-semibold whitespace-nowrap text-quaternary">Name</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium whitespace-nowrap text-primary">{row.original.name}</p>
      </div>
    ),
    enableSorting: true,
    meta: { headerClassName: "w-full max-w-1/4" },
  },
  {
    id: "investor_type_id",
    accessorKey: "investor_type_id",
    header: () => (
      <span className="text-xs font-semibold whitespace-nowrap text-quaternary">Investor Type</span>
    ),
    cell: ({ row }) => (
      <BadgeWithDot
        size="sm"
        color={row.original.investor_type_id === "I" ? "success" : "gray"}
        type="modern"
      >
        {row.original.investor_type_id === "I" ? "Individual" : "Corporate"}
      </BadgeWithDot>
    ),
    enableSorting: true,
    meta: { headerClassName: "md:hidden xl:table-cell", cellClassName: "md:hidden xl:table-cell" },
  },
  {
    id: "email",
    accessorKey: "email",
    header: () => (
      <span className="text-xs font-semibold whitespace-nowrap text-quaternary">Email address</span>
    ),
    cell: ({ row }) => (
      <span className="whitespace-nowrap md:hidden xl:table-cell">
        {row.original.email ?? "—"}
      </span>
    ),
    enableSorting: true,
    meta: { headerClassName: "md:hidden xl:table-cell", cellClassName: "whitespace-nowrap md:hidden xl:table-cell" },
  },
  {
    id: "sid",
    accessorKey: "sid",
    header: () => <span className="text-xs font-semibold whitespace-nowrap text-quaternary">SID</span>,
    cell: ({ row }) => (
      <span className="whitespace-nowrap md:hidden xl:table-cell">
        {row.original.sid ?? "—"}
      </span>
    ),
    enableSorting: true,
    meta: { cellClassName: "whitespace-nowrap md:hidden xl:table-cell" },
  },
  {
    id: "aum",
    accessorKey: "aum",
    header: () => <span className="text-xs font-semibold whitespace-nowrap text-quaternary">AUM</span>,
    cell: ({ row }) => (
      <span className="whitespace-nowrap md:hidden xl:table-cell">{row.original.aum || "—"}</span>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => null,
    cell: () => (
      <div className="flex justify-end gap-0.5 px-3">
        <ButtonUtility size="xs" color="tertiary" tooltip="Delete" icon={Trash01} />
        <ButtonUtility size="xs" color="tertiary" tooltip="Edit" icon={Edit01} />
      </div>
    ),
    enableSorting: false,
  },
];

const InvestorsTable = () => {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<{ columnId: string; direction: "asc" | "desc" }>({
    columnId: "aum",
    direction: "desc",
  });
  const [searchParams, setSearchParams] = useState<SearchParam[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState<Key>("profile");

  const { data, isLoading, error } = trpc.investors.list.useQuery({
    page,
    limit: 10,
    sort: sorting.columnId,
    sort_by: sorting.direction,
    searchs: searchParams,
  });

  const { data: investorData } = trpc.investors.get.useQuery({
    id: selectedInvestor ?? ""
  }, { enabled: !!selectedInvestor });


  const handleSearchChange = useCallback((params: SearchParam[]) => {
    setSearchParams(params);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((columnId: string, direction: "asc" | "desc") => {
    setSorting({ columnId, direction });
    setPage(1);
  }, []);

  const totalPages =
    data && data.total > 0 ? Math.ceil(data.total / data.limit) : 1;
  const items: InvestorRow[] = data?.items ?? [];

  const filterRow = useMemo(
    () => (
      <InvestorsFilterRow
        native
        filterRowId="__filter"
        initialSearchParams={searchParams}
        onSearchChange={handleSearchChange}
      />
    ),
    [searchParams, handleSearchChange]
  );

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
    <div>
      <TableCard.Root size="sm">
        <TableCard.Header
          title="Investors"
          contentTrailing={
            <div className="absolute top-5 right-4 md:right-6">
              <TableRowActionsDropdown />
            </div>
          }
        />
        <DataTable<InvestorRow>
          columns={columns}
          data={items}
          filterRow={filterRow}
          sorting={sorting}
          onSortChange={handleSortChange}
          getRowId={(row) => row.id}
          emptyState="No investors found."
          size="sm"
          onRowClick={(row) => setSelectedInvestor(row.id)}
        />

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

      {investorData && (
        <div className="px-4 py-6 text-sm text-muted dark:text-white bg-primary rounded-lg mt-10">
          {investorData.first_name} {investorData.middle_name} {investorData.last_name}

          <br />
          <br />

          <NativeSelect
            aria-label="Tabs"
            value={selectedTabIndex as string}
            onChange={(event) => setSelectedTabIndex(event.target.value)}
            options={tabs.map((tab) => ({ label: tab.label, value: tab.id }))}
            className="w-80 md:hidden"
          />
          <Tabs selectedKey={selectedTabIndex} onSelectionChange={setSelectedTabIndex} className="w-max max-md:hidden w-full">
            <Tabs.List type="underline" items={tabs} className="mb-4">
              {(tab) => <Tabs.Item {...tab} />}
            </Tabs.List>
            <Tabs.Panel id="profile">
              {investorData && <ProfileTab investor={investorData} />}
            </Tabs.Panel>

            <Tabs.Panel id="portfolio">
              {selectedInvestor && <PortfolioTab selectedInvestor={selectedInvestor} />}
            </Tabs.Panel>
          </Tabs>

        </div>
      )}
    </div>
  );
};

export default function InvestorsPage() {
  return <InvestorsTable />;
}
