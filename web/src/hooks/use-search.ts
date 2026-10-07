"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { routing } from "@/lib/spec/config";
import type { Runtime } from "@/lib/spec/kinds";
import { interpolate, targetOf } from "@/lib/spec/runtime";
import type { CallData } from "@/lib/spec/shapes";
import { localePath } from "@/lib/std/locale";
import { isRecord, pathGet } from "@/lib/std/object";

type Settings = Pick<Runtime, "locale" | "emit"> & { label?: string; href?: string; to?: string; min?: number; suggest?: CallData };

export function useSearch ( { locale, emit, label, href, to, min = 2, suggest }: Settings ) {

    const router = useRouter();
    const api = useApi();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([]);
    const key = suggest ? JSON.stringify(suggest) : "";

    useEffect(() => {

        const trimmed = query.trim();

        if ( trimmed.length < min || !key ) {

            setSuggestions([]);
            return;

        }

        const controller = new AbortController();
        const timer = setTimeout(() => {

            const call = JSON.parse(key) as CallData;

            api.call(targetOf(call, { ...call.input, query: trimmed }), { signal: controller.signal })
                .then(( result ) => { if ( !controller.signal.aborted ) setSuggestions(Array.isArray(result.resource) ? result.resource.filter(isRecord) : []); })
                .catch(() => undefined);

        }, 250);

        return () => { controller.abort(); clearTimeout(timer); };

    }, [query, min, key, api]);

    return {
        query,
        setQuery,
        suggestions,
        submit: () => {

            const trimmed = query.trim();

            if ( !trimmed ) return;
            if ( to ) router.push(localePath(locale, interpolate(to, {}, { query: trimmed }), routing) as Route);

            emit("submit", { query: trimmed }).catch(() => undefined);

        },
        labelOf: ( item: Record<string, unknown> ) => (label ? pathGet(item, label) : item.label ?? item.name),
        hrefOf: ( item: Record<string, unknown> ) => (href ? interpolate(href, { item }) : undefined),
    };

}
