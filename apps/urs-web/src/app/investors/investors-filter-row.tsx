'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table } from "@/components/application/table/table";
import { cx } from "@/utils/cx";

const DEBOUNCE_MS = 300;

const SEARCH_KEYS = ["first_name", "investor_type_id", "email", "sid"] as const;

const SEARCH_INPUTS = [
  { key: "first_name", type: "text" as const },
  {
    key: "investor_type_id",
    type: "select" as const,
    options: [
      { label: "Individual", value: "I" },
      { label: "Corporate", value: "C" },
    ],
  },
  { key: "email", type: "text" as const },
  { key: "sid", type: "text" as const },
  { key: "actions", type: "hidden" as const },
] as const;

export type SearchParam = { key: string; value: string };

const CELL_BASE =
  "relative text-sm text-tertiary outline-focus-ring focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2 px-5 py-3";
const ROW_BORDER =
  "[&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:w-full [&>td]:after:bg-border-secondary last:[&>td]:after:hidden";

interface InvestorsFilterRowProps {
  filterRowId: string;
  initialSearchParams: SearchParam[];
  onSearchChange: (params: SearchParam[]) => void;
  debounceMs?: number;
  /** When true, render native <tr>/<td> for use inside DataTable (no react-aria). */
  native?: boolean;
}

export function InvestorsFilterRow({
  filterRowId,
  initialSearchParams,
  onSearchChange,
  debounceMs = DEBOUNCE_MS,
  native: asNative = false,
}: InvestorsFilterRowProps) {
  const [local, setLocal] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    SEARCH_KEYS.forEach((k) => (next[k] = ""));
    initialSearchParams.forEach(({ key, value }) => {
      if (value && SEARCH_KEYS.includes(key as (typeof SEARCH_KEYS)[number])) next[key] = value;
    });
    return next;
  });

  const localRef = useRef(local);
  localRef.current = local;
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params: SearchParam[] = SEARCH_KEYS.map((key) => ({ key, value: localRef.current[key] ?? "" }));
      onSearchChangeRef.current(params);
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [local, debounceMs]);

  const setByKey = useCallback((key: string, value: string) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }, []);

  const cellContent = (search: (typeof SEARCH_INPUTS)[number]) => (
    <>
      {search.type === "text" && (
        <Input
          placeholder={`Search ${search.key}...`}
          value={local[search.key] ?? ""}
          onChange={(value) => setByKey(search.key, value ?? "")}
          size="sm"
          className="min-w-0"
          aria-label={`Filter by ${search.key}`}
        />
      )}
      {search.type === "select" && (
        <Select
          placeholder={`Select ${search.key}...`}
          value={local[search.key] ?? ""}
          onChange={(value) => setByKey(search.key, (value as string) ?? "")}
          size="sm"
          className="min-w-0"
          aria-label={`Filter by ${search.key}`}
        >
          {search.options?.map((option) => (
            <Select.Item key={option.value} id={option.value} supportingText={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select>
      )}
    </>
  );

  if (asNative) {
    return (
      <tr
        data-filter-row
        className={cx(
          "relative outline-focus-ring transition-colors after:pointer-events-none h-14",
          ROW_BORDER
        )}
      >
        {SEARCH_INPUTS.map((search) => (
          <td
            key={search.key}
            className={cx(CELL_BASE, search.type === "hidden" && "hidden")}
          >
            {cellContent(search)}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <Table.Row id={filterRowId}>
      {SEARCH_INPUTS.map((search) => (
        <Table.Cell key={search.key} className={search.type === "hidden" ? "hidden" : ""}>
          {cellContent(search)}
        </Table.Cell>
      ))}
    </Table.Row>
  );
}
