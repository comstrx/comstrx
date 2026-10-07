"use client";

import registry from "@spec/registry.client";
import { type ComponentType, createElement, lazy, type ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/elements/skeleton.tsx";
import { useActions } from "@/hooks/use-actions";
import { usePage, usePageStore, useScope, useTranslate } from "@/hooks/use-page";
import { useResource } from "@/hooks/use-resource";
import type { Runtime } from "@/lib/spec/kinds";
import { holds, lookup, resolveDeep, resolveProps, type Scope } from "@/lib/spec/runtime";
import type { CompiledNode, Effect } from "@/lib/spec/shapes";

type Props = { node: CompiledNode; scope: Scope; locale: string; initial?: unknown };
type Implementation = ComponentType<Record<string, unknown> & Runtime>;
type Watch = { on: string; do: Effect[] };

const loaded = new Map<string, Implementation>();

function implementation ( kind: string ): Implementation {

    const known = loaded.get(kind);

    if ( known ) return known;

    const entry = registry[kind];

    if ( !entry ) throw new Error(`No client implementation for ${kind}.`);

    const component = lazy(async () => ({ default: (await entry()).default as Implementation }));

    loaded.set(kind, component);

    return component;

}
function Children ({ nodes, scope, locale }: { nodes: readonly CompiledNode[] | undefined; scope: Scope; locale: string }) {

    return nodes?.map(( node ) => <Live key={node.id} node={node} scope={scope} locale={locale} />);

}
function Watcher ({ entry, scope, locale }: { entry: Watch; scope: Scope; locale: string }) {

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
export function Live ({ node, scope, locale, initial }: Props) {

    const full = useScope(scope);
    const translate = useTranslate();
    const store = usePageStore();
    const visible = holds(node.when, full, translate);
    const resource = useResource(node.read, full, { name: node.name, enabled: visible, initial });
    const listed = node.items === undefined ? undefined : resolveDeep(node.items, full, translate);
    const data = node.read ? resource.data : listed;
    const source = node.read ? node.name : undefined;
    const inner = useMemo(() => (source ? { ...full, [source]: data } : full), [source, full, data]);
    const actions = useActions(locale);
    const open = usePage(( page ) => (node.name ? page.overlays[node.name] ?? false : false));
    const emit = useCallback(async ( event: string, payload?: unknown ) => {

        const effects = node.on?.[event];

        if ( effects ) await actions.run(effects, { ...inner, event: payload });

    }, [node.on, actions, inner]);
    const close = useCallback(() => { if ( node.name ) store.getState().close(node.name); }, [store, node.name]);

    if ( !visible ) return null;

    const slots = Object.fromEntries(Object.entries(node.slots).map(( [slot, nodes] ) => [slot, ( extra: Scope = {} ): ReactNode => (
        <Children nodes={nodes} scope={{ ...inner, ...extra }} locale={locale} />
    )]));
    const runtime: Runtime = {
        slots,
        state: { data, items: Array.isArray(data) ? data : [], loading: resource.loading, error: resource.error, reload: resource.reload },
        emit,
        busy: actions.pending,
        failure: actions.error,
        open,
        close,
        locale,
        t: translate,
        name: node.name,
    };
    const props = resolveProps(node.props, node.raw, inner, translate);

    return (

        <Suspense fallback={<Skeleton />}>

            {(node.watch ?? []).map(( entry ) => <Watcher key={entry.on} entry={entry} scope={inner} locale={locale} />)}

            {createElement(implementation(node.is), { ...props, ...runtime })}

        </Suspense>

    );

}
