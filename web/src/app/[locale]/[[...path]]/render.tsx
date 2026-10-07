import "server-only";

import registry from "@spec/registry.server";
import { type ComponentType, createElement, type ReactNode, Suspense } from "react";
import { readSource } from "@/api/server";
import { Skeleton } from "@/elements/skeleton.tsx";
import type { Runtime } from "@/lib/spec/kinds";
import type { Locale } from "@/lib/spec/languages";
import { failureOf, holds, inputsOf, resolveDeep, resolveProps, type Scope, type Translate } from "@/lib/spec/runtime";
import { text } from "@/lib/spec/server";
import type { CallData, CompiledNode, Source } from "@/lib/spec/shapes";
import { Island } from "./island";

export type Context = { locale: Locale; scope: Scope; sources: Record<string, Source>; path: string };

type Props = { node: CompiledNode; context: Context };
type Implementation = ComponentType<Record<string, unknown> & Runtime>;
type Reading = { data: unknown; error: Runtime["state"]["error"] };

function translator ( locale: Locale ): Translate {

    return ( key ) => text({ key }, locale);

}
function shared ( scope: Scope, uses: readonly string[] ): Scope {

    const { params, query, item } = scope;

    return { params, query, item, ...Object.fromEntries(uses.filter(( name ) => name in scope).map(( name ) => [name, scope[name]])) };

}
function pending ( context: Context, names: readonly string[] ): string[] {

    return names.filter(( name ) => context.sources[name]?.client === false && !(name in context.scope));

}
async function implementation ( kind: string ): Promise<Implementation> {

    const entry = registry[kind];

    if ( !entry ) throw new Error(`No implementation for ${kind}.`);

    return (await entry()).default as Implementation;

}
async function readCall ( call: CallData, context: Context ): Promise<Reading> {

    try {

        return { data: (await readSource(call, inputsOf(call, context.scope, translator(context.locale)))).resource, error: null };

    }
    catch ( error ) {

        return { data: null, error: failureOf(error) };

    }

}
/** Server sources this subtree names but the scope lacks: read once per request, dependencies first. */
async function readSources ( context: Context, names: readonly string[] ): Promise<Scope> {

    const needed = pending(context, names);

    if ( !needed.length ) return context.scope;

    const scope = await readSources(context, [...new Set(needed.flatMap(( name ) => context.sources[name]?.uses ?? []))]);
    const inner = { ...context, scope };
    const found = await Promise.all(needed.map(( name ) => readCall((context.sources[name] as Source).read, inner)));

    return { ...scope, ...Object.fromEntries(needed.map(( name, index ) => [name, found[index]?.data])) };

}
async function reading ( node: CompiledNode, context: Context ): Promise<Runtime["state"]> {

    const idle = { loading: false, error: null, reload: () => {} };

    if ( node.items !== undefined ) {

        const listed = resolveDeep(node.items, context.scope, translator(context.locale));

        return { ...idle, data: listed, items: Array.isArray(listed) ? listed : [] };

    }
    if ( !node.read ) return { ...idle, data: undefined, items: [] };

    const { data, error } = await readCall(node.read, context);

    return { ...idle, data, items: Array.isArray(data) ? data : [], error };

}
function Children ({ nodes, context }: { nodes: readonly CompiledNode[] | undefined; context: Context }) {

    return nodes?.map(( node ) => <Render key={node.id} node={node} context={context} />);

}
async function Static ({ node, context }: Props) {

    const translate = translator(context.locale);
    const state = await reading(node, context);
    const inner: Context = node.name && node.read ? { ...context, scope: { ...context.scope, [node.name]: state.data } } : context;
    const slots = Object.fromEntries(Object.entries(node.slots).map(( [slot, nodes] ) => [slot, ( extra: Scope = {} ): ReactNode => (
        <Children nodes={nodes} context={{ ...inner, scope: { ...inner.scope, ...extra } }} />
    )]));
    const runtime: Runtime = { slots, state, emit: async () => {}, busy: false, failure: null, open: false, close: () => {}, locale: context.locale, t: translate, name: node.name };
    const props = resolveProps(node.props, node.raw, inner.scope, translate);

    return createElement(await implementation(node.is), { ...props, ...runtime });

}
async function Primed ({ node, context }: Props) {

    const state = await reading(node, context);

    return <Island node={node} scope={shared(context.scope, node.uses)} locale={context.locale} initial={state.error ? undefined : state.data} />;

}
async function Sourced ({ node, context }: Props) {

    const scope = await readSources(context, node.uses);

    return <Render node={node} context={{ ...context, scope }} />;

}
export function Render ({ node, context }: Props) {

    if ( pending(context, node.uses).length ) return <Suspense fallback={<Skeleton />}><Sourced node={node} context={context} /></Suspense>;
    if ( node.primed ) return <Suspense fallback={<Skeleton />}><Primed node={node} context={context} /></Suspense>;
    if ( node.client ) return <Island node={node} scope={shared(context.scope, node.uses)} locale={context.locale} />;
    if ( !holds(node.when, context.scope, translator(context.locale)) ) return null;
    if ( !node.read ) return <Static node={node} context={context} />;

    return (

        <Suspense fallback={<Skeleton />}>

            <Static node={node} context={context} />

        </Suspense>

    );

}
