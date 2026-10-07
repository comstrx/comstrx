"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useMessages } from "@/lib/providers/intl";
import { useStore } from "@/lib/providers/store";
import { useSite } from "@/lib/site/context";
import type { Scope, Translate } from "@/lib/spec/runtime";
import { type Messages, messageAt } from "@/lib/std/messages";
import type { createPageStore, PageState } from "@/stores/page";
import { useUi } from "@/stores/provider";

export type PageStore = ReturnType<typeof createPageStore>;

export const PageContext = createContext<PageStore | null>(null);

export function usePageStore (): PageStore {

    const store = useContext(PageContext);

    if ( !store ) throw new Error("usePageStore requires a page.");

    return store;

}
export function usePage<T> ( selector: ( state: PageState ) => T ): T {

    return useStore(usePageStore(), selector);

}
export function useTranslate (): Translate {

    const messages: Messages = useMessages();

    return useCallback(( key: string ) => messageAt(messages, key) ?? key, [messages]);

}
/** The screen scope: roots plus every published source by name; live sources shadow server snapshots. */
export function useScope ( extra: Scope = {} ): Scope {

    const state = usePage(( page ) => page.state);
    const resources = usePage(( page ) => page.resources);
    const token = useUi(( ui ) => ui.token);
    const user = useUi(( ui ) => ui.user);
    const { content, settings } = useSite();

    return useMemo(() => {

        const sources = Object.fromEntries(Object.entries(resources).map(( [name, resource] ) => [name, resource.data]));

        return { ...extra, ...sources, state, session: { token, user }, site: { content, settings } };

    }, [extra, resources, state, token, user, content, settings]);

}
