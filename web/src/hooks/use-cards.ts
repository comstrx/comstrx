"use client";

import { useMemo } from "react";
import type { Runtime } from "@/lib/spec/kinds";
import { interpolate } from "@/lib/spec/runtime";
import { isRecord, pathGet } from "@/lib/std/object";

type Settings = Pick<Runtime, "state"> & { href?: string };

export function fieldOf ( item: unknown, path: string | undefined ): unknown {

    return path && isRecord(item) ? pathGet(item, path) : undefined;

}
export function useCards ( { state, href }: Settings ) {

    const rows = useMemo(() => (Array.isArray(state.data) ? state.data.filter(isRecord) : []), [state.data]);

    return {
        rows,
        field: fieldOf,
        hrefOf: ( item: Record<string, unknown> ) => (href ? interpolate(href, { item }) : undefined),
    };

}
