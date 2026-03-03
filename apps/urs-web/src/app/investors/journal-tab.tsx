import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { Badge } from "@/components/base/badges/badges";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];

export function JournalTab({ selectedInvestor }: { selectedInvestor: string }) {
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("PENDING");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const limit = 10;
  const { data: session } = useSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const { data, isLoading, error, refetch } = trpc.investors.journals.useQuery(
    {
      investorId: selectedInvestor,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit,
    },
    { enabled: !!selectedInvestor }
  );

  const approveMutation = trpc.investors.approveJournal.useMutation({
    onSuccess: () => {
      utils.investors.journals.invalidate({ investorId: selectedInvestor });
      refetch();
    },
  });
  const rejectMutation = trpc.investors.rejectJournal.useMutation({
    onSuccess: () => refetch(),
  });

  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});

  if (!selectedInvestor) {
    return <div className="text-sm text-tertiary">Select an investor to view journals.</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load journals: {error.message}
      </div>
    );
  }

  const items = data?.items ?? [];
  const totalPages = data && data.total > 0 ? Math.ceil(data.total / data.limit) : 1;
  const counts = data?.statusCounts ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", ...STATUSES] as const).map((s) => {
            const label = s === "ALL" ? "All" : s;
            const count =
              s === "ALL"
                ? Object.values(counts).reduce((acc, v) => acc + (v ?? 0), 0)
                : counts[s] ?? 0;
            const isActive = statusFilter === s;
            return (
              <Button
                key={s}
                size="sm"
                color={isActive ? "primary" : "secondary"}
                onClick={() => {
                  setStatusFilter(s as Status | "ALL");
                  setPage(1);
                }}
              >
                <div className="flex gap-2">
                  {label}
                  <Badge size="sm" color="gray" className="ml-1">
                    {count}
                  </Badge>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-secondary">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-secondary text-xs font-semibold text-quaternary">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Version</th>
              <th className="px-3 py-2 text-left">Requested By</th>
              <th className="px-3 py-2 text-left">Requested At</th>
              <th className="px-3 py-2 text-left">Approved By</th>
              <th className="px-3 py-2 text-left">Approved At</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-sm text-tertiary">
                  Loading journals…
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-sm text-tertiary">
                  No journals found.
                </td>
              </tr>
            )}
            {!isLoading &&
              items.map((j) => {
                const isPending = j.status === "PENDING";
                const detail = j.journal_detail as
                  | { old_value: unknown; new_value: unknown }
                  | null
                  | undefined;
                const oldVal =
                  (detail?.old_value as Record<string, unknown> | null) ?? {};
                const newVal =
                  (detail?.new_value as Record<string, unknown> | null) ?? {};
                const diffKeys = Array.from(
                  new Set([...Object.keys(oldVal), ...Object.keys(newVal)])
                );

                return (
                  <tr key={j.id} className="border-t border-secondary align-top">
                    <td className="px-3 py-2 align-top text-xs text-tertiary">{j.id}</td>
                    <td className="px-3 py-2 align-top text-xs text-tertiary">{j.status}</td>
                    <td className="px-3 py-2 align-top text-xs text-tertiary">
                      {j.entity_version ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-tertiary">
                      {j.requested_user?.name ?? j.requested_by}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-tertiary">
                      {j.requested_at
                        ? new Date(j.requested_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-tertiary">
                      {j.approved_user?.name ?? j.approved_by ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-tertiary">
                      {j.approved_at
                        ? new Date(j.approved_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-tertiary">
                      <div className="flex flex-col gap-2">
                        {isPending && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              color="primary"
                              isDisabled={approveMutation.isPending}
                              onClick={() => {
                                approveMutation.mutate({
                                  journalId: j.id,
                                });
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              color="secondary"
                              isDisabled={rejectMutation.isPending}
                              onClick={() => {
                                rejectMutation.mutate({
                                  journalId: j.id,
                                  reason: rejectNotes[j.id],
                                });
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        <div className="space-y-1">
                          <Input
                            label="Reject reason (optional)"
                            value={rejectNotes[j.id] ?? ""}
                            onChange={(val) =>
                              setRejectNotes((prev) => ({
                                ...prev,
                                [j.id]: val ?? "",
                              }))
                            }
                          />
                        </div>
                        {diffKeys.length > 0 && (
                          <div className="mt-1 rounded-md bg-secondary_alt px-2 py-1">
                            <div className="mb-1 text-[11px] font-semibold text-quaternary">
                              Changes
                            </div>
                            <table className="w-full border-collapse text-[11px]">
                              <thead>
                                <tr className="text-[10px] text-quaternary">
                                  <th className="border-b border-secondary px-1 py-0.5 text-left">
                                    Field
                                  </th>
                                  <th className="border-b border-secondary px-1 py-0.5 text-left">
                                    Old
                                  </th>
                                  <th className="border-b border-secondary px-1 py-0.5 text-left">
                                    New
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {diffKeys.map((key) => (
                                  <tr key={key}>
                                    <td className="border-b border-secondary px-1 py-0.5">
                                      {key}
                                    </td>
                                    <td className="border-b border-secondary px-1 py-0.5">
                                      {String(oldVal[key] ?? "—")}
                                    </td>
                                    <td className="border-b border-secondary px-1 py-0.5">
                                      {String(newVal[key] ?? "—")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <PaginationCardMinimal
        align="right"
        page={page}
        total={totalPages}
        onPageChange={setPage}
        className="px-0"
      />
    </div>
  );
}
