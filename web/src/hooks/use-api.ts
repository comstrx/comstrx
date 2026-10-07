"use client";

import { useMemo } from "react";
import { browserApi } from "@/api/browser";
import type { Socket } from "@/api/realtime";
import { useLocale } from "@/lib/providers/intl";
import { useSite } from "@/lib/site/context";
import { limitsOf } from "@/lib/std/form";
import { useUi } from "@/stores/provider";

function socketOf ( { socket_scheme: scheme, socket_host: host, socket_port: port, socket_key: key }: ReturnType<typeof useSite>["policy"] ): Socket | undefined {

    return scheme && host && port && key ? { scheme, host, port, key } : undefined;

}
export function useApi ( session: { currency?: string; auth?: string } = {} ) {

    const language = useLocale();
    const { policy } = useSite();
    const { upload_max_bytes: file, request_max_bytes: request, upload_max_count: count } = policy;
    const selectedCurrency = useUi(( state ) => state.currency);
    const selectedToken = useUi(( state ) => state.token);
    const currency = session.currency ?? selectedCurrency;
    const auth = session.auth ?? selectedToken ?? undefined;
    const limits = useMemo(() => limitsOf(file, request, count), [file, request, count]);
    const socket = useMemo(() => socketOf(policy), [policy]);

    return useMemo(() => browserApi({ currency, auth, language }, limits, socket), [currency, auth, language, limits, socket]);

}
