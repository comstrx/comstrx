"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { BrowserApi } from "@/api/browser";
import { ApiError } from "@/api/error";
import { useApi } from "@/hooks/use-api";
import { type PageStore, usePageStore, useTranslate } from "@/hooks/use-page";
import { routing } from "@/lib/spec/config";
import type { Failure } from "@/lib/spec/kinds";
import { failureOf, inputsOf, resolve, type Scope, type Translate, targetOf, textOf } from "@/lib/spec/runtime";
import type { Effect } from "@/lib/spec/shapes";
import { localePath } from "@/lib/std/locale";
import { useUi } from "@/stores/provider";
import { type SessionUser, sessionReply } from "@/stores/ui";

type Navigate = ( href: Route ) => void;
type Session = ( token: string | null, user: SessionUser | null ) => void;
type Tools = { api: BrowserApi; store: PageStore; translate: Translate; locale: string; navigate: Navigate; refresh: () => void; session: Session; emit?: ( event: string, payload?: unknown ) => void };

async function perform ( effect: Effect, scope: Scope, tools: Tools ): Promise<Scope> {

    const page = tools.store.getState();

    if ( "call" in effect ) {

        const result = await tools.api.call(targetOf(effect.call, inputsOf(effect.call, scope, tools.translate)));

        return { ...scope, result: result.resource };

    }
    if ( "set" in effect ) page.set(effect.set, resolve(effect.value, scope, tools.translate));
    if ( "toggle" in effect ) page.toggle(effect.toggle);
    if ( "go" in effect ) tools.navigate(localePath(tools.locale, textOf(resolve(effect.go, scope, tools.translate)) || "/", routing) as Route);
    if ( "open" in effect ) page.open(effect.open);
    if ( "close" in effect ) page.close(effect.close);
    if ( "refresh" in effect ) effect.refresh === "page" || !page.resources[effect.refresh] ? tools.refresh() : page.resources[effect.refresh]?.reload();
    if ( "reset" in effect ) page.forms[effect.reset]?.reset();
    if ( "emit" in effect ) tools.emit?.(effect.emit, resolve(effect.payload, scope, tools.translate));
    if ( "session" in effect && effect.session === null ) tools.session(null, null);
    if ( "session" in effect && effect.session !== null ) {

        const reply = sessionReply(resolve(effect.session, scope, tools.translate));

        if ( reply ) tools.session(reply.token, reply.user);

    }

    return scope;

}
async function sequence ( effects: readonly Effect[], scope: Scope, tools: Tools ): Promise<void> {

    let current = scope;

    for ( const effect of effects ) {

        current = await perform(effect, current, tools);

    }

}
export function useActions ( locale: string, emit?: ( event: string, payload?: unknown ) => void ) {

    const api = useApi();
    const store = usePageStore();
    const translate = useTranslate();
    const router = useRouter();
    const session = useUi(( ui ) => ui.session);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<Failure | null>(null);

    const run = useCallback(async ( effects: readonly Effect[], scope: Scope ) => {

        const tools: Tools = { api, store, translate, locale, navigate: ( href ) => router.push(href), refresh: () => router.refresh(), session, emit };

        setPending(true);
        setError(null);

        try { await sequence(effects, scope, tools); }
        catch ( failure ) { setError(failureOf(failure instanceof ApiError ? failure : new ApiError("network", { cause: failure }))); }
        finally { setPending(false); }

    }, [api, store, translate, locale, router, session, emit]);

    return { run, pending, error };

}
