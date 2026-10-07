"use client";

import { useCallback, useMemo } from "react";
import { useUi } from "@/stores/provider";
import { useApi } from "./use-api";
import { useRealtime } from "./use-realtime";
import { useInvalidation, useRequest } from "./use-request";

type Filters = Record<string, unknown>;

export function useNotifications ( filters: Filters = {} ) {

    const api = useApi();
    const signedIn = useUi(( state ) => Boolean(state.token && state.user));
    const query = JSON.stringify(filters);
    const stable = useMemo(() => JSON.parse(query) as Filters, [query]);
    const list = useRequest(useCallback(( signal: AbortSignal ) => api.call({ method: "GET", path: "notifications", input: stable }, { signal }), [api, stable]), signedIn);
    const stats = useRequest(useCallback(( signal: AbortSignal ) => api.call({ method: "GET", path: "notifications/stats" }, { signal }), [api]), signedIn);
    const reload = () => { list.reload(); stats.reload(); };

    useRealtime("notifications", reload, undefined, signedIn);
    useInvalidation("notifications", reload);

    return {
        items: list.data ?? [],
        page: list.meta?.pagination,
        stats: stats.data,
        loading: list.loading || stats.loading,
        error: list.error ?? stats.error,
        reload,
        call: api.call,
    };

}
