"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { usePageStore, useTranslate } from "@/hooks/use-page";
import { useRealtime } from "@/hooks/use-realtime";
import { useInvalidation, useRequest } from "@/hooks/use-request";
import { failureOf, inputsOf, type Scope, targetOf } from "@/lib/spec/runtime";
import type { CallData } from "@/lib/spec/shapes";
import { templateKeys } from "@/lib/std/route";
import type { Resource } from "@/stores/page";

type Options = { name?: string; enabled?: boolean; initial?: unknown };

function complete ( call: CallData | undefined, input: Record<string, unknown> ): boolean {

    return !!call && templateKeys(call.path).every(( key ) => input[key] !== undefined && input[key] !== null);

}
export function useResource ( call: CallData | undefined, scope: Scope, { name, enabled = true, initial }: Options ): Resource {

    const api = useApi();
    const store = usePageStore();
    const translate = useTranslate();
    const input = useMemo(() => (call ? inputsOf(call, scope, translate) : {}), [call, scope, translate]);
    const key = JSON.stringify(call ? { ...call, input } : null);
    const bound = useMemo(() => JSON.parse(key) as CallData | null, [key]);
    const [refreshed, setRefreshed] = useState(0);
    const active = enabled && complete(call, input) && (initial === undefined || refreshed > 0);
    const load = useCallback(( signal: AbortSignal ) => api.call(targetOf(bound ?? { method: "GET", path: "" }), { signal }), [api, bound]);
    const request = useRequest(load, active);
    const reload = useCallback(() => { setRefreshed(( count ) => count + 1); request.reload(); }, [request.reload]);
    const resource: Resource = useMemo(() => ({
        data: request.data ?? initial ?? null,
        meta: request.meta,
        loading: active && request.loading,
        error: request.error ? failureOf(request.error) : null,
        reload,
    }), [request.data, request.meta, request.loading, request.error, reload, initial, active]);

    useInvalidation(call ? call.path.split("/")[0] ?? "" : "", reload);
    useRealtime(call?.live ?? "notifications", reload, undefined, enabled && call?.live !== undefined);

    useEffect(() => {

        if ( !enabled || !call?.every ) return;

        const timer = setInterval(reload, call.every * 1000);

        return () => clearInterval(timer);

    }, [enabled, call?.every, reload]);

    useEffect(() => {

        if ( !name ) return;

        store.getState().publish(name, resource);

        return () => store.getState().forget(name);

    }, [store, name, resource]);

    return resource;

}
