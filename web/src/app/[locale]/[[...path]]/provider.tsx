"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import Notice from "@/elements/notice.tsx";
import { useActions } from "@/hooks/use-actions";
import { PageContext, useScope, useTranslate } from "@/hooks/use-page";
import { routing } from "@/lib/spec/config";
import { inert } from "@/lib/spec/kinds";
import { lookup } from "@/lib/spec/runtime";
import type { Effect } from "@/lib/spec/shapes";
import { localePath } from "@/lib/std/locale";
import { createPageStore } from "@/stores/page";
import { useUi } from "@/stores/provider";

type Access = "any" | "guest" | "user" | undefined;
type Watch = { on: string; do: Effect[] };
type Props = { access: Access; redirect?: string; state: Record<string, unknown>; watch: Watch[]; locale: string; children: ReactNode };

function Watcher ({ entry, locale }: { entry: Watch; locale: string }) {

    const scope = useScope();
    const actions = useActions(locale);
    const current = JSON.stringify(lookup(scope, entry.on));
    const [seen, setSeen] = useState(current);

    useEffect(() => {

        if ( current === seen ) return;

        setSeen(current);
        actions.run(entry.do, scope);

    }, [current, seen, actions, entry, scope]);

    return null;

}
function Gate ({ access, redirect, locale, children }: Omit<Props, "state" | "watch">) {

    const router = useRouter();
    const t = useTranslate();
    const ready = useUi(( ui ) => ui.ready);
    const signedIn = useUi(( ui ) => Boolean(ui.token && ui.user));
    const gated = access === "user" || access === "guest";
    const allowed = !gated || (access === "user") === signedIn;

    useEffect(() => {

        if ( ready && !allowed ) router.replace(localePath(locale, redirect ?? "/", routing) as Route);

    }, [ready, allowed, router, locale, redirect]);

    if ( gated && !ready ) return <Notice {...inert({ locale, t })} kind="loading" />;
    if ( !allowed ) return null;

    return children;

}
export function PageProvider ({ state, watch, children, ...gate }: Props) {

    const [store] = useState(() => createPageStore(state));

    return (

        <PageContext.Provider value={store}>

            {watch.map(( entry ) => <Watcher key={entry.on} entry={entry} locale={gate.locale} />)}

            <Gate {...gate}>{children}</Gate>

        </PageContext.Provider>

    );

}
