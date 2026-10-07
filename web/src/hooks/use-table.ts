"use client";

import { useMemo } from "react";
import type { Runtime } from "@/lib/spec/kinds";
import { formatDate, formatMoney, formatNumber } from "@/lib/std/format";
import { isRecord, pathGet } from "@/lib/std/object";

type Column = { name: string; label?: unknown; format?: string };
type Settings = Pick<Runtime, "state" | "locale"> & { columns: readonly Column[]; key?: string };
type Row = { key: string; cells: Record<string, unknown> };

function cell ( value: unknown, format: string | undefined, locale: string ): unknown {

    if ( format === "money" ) return formatMoney(value, locale);
    if ( format === "date" ) return formatDate(value, locale);
    if ( format === "number" ) return formatNumber(value, locale);
    if ( typeof value === "string" || typeof value === "number" || typeof value === "boolean" ) return String(value);

    return "";

}
export function useTable ( { state, locale, columns, key = "id" }: Settings ) {

    const items = useMemo(() => (Array.isArray(state.data) ? state.data.filter(isRecord) : []), [state.data]);
    const rows: Row[] = useMemo(() => items.map(( item, index ) => ({
        key: String(pathGet(item, key) ?? index),
        cells: Object.fromEntries(columns.map(( column ) => [column.name, cell(pathGet(item, column.name), column.format, locale)])),
    })), [items, columns, key, locale]);
    const byKey = useMemo(() => new Map(items.map(( item, index ) => [String(pathGet(item, key) ?? index), { id: pathGet(item, key), item }])), [items, key]);

    return { columns: columns.map(( column ) => ({ key: column.name, label: column.label })), rows, byKey };

}
