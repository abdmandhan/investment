'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table } from "@/components/application/table/table";

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

interface InvestorsFilterRowProps {
  filterRowId: string;
  initialSearchParams: SearchParam[];
  onSearchChange: (params: SearchParam[]) => void;
  debounceMs?: number;
}

export function InvestorsFilterRow({
  filterRowId,
  initialSearchParams,
  onSearchChange,
  debounceMs = DEBOUNCE_MS,
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

  console.log('renderfilter')

  return (
    <Table.Row id={filterRowId}>
      {SEARCH_INPUTS.map((search) => (
        <Table.Cell key={search.key} className={search.type === "hidden" ? "hidden" : ""}>
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
        </Table.Cell>
      ))}
    </Table.Row>
  );
}
