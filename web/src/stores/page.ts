import { createStore } from "../lib/providers/store.ts";
import type { Failure } from "../lib/spec/kinds.ts";

export type Resource = { data: unknown; meta?: unknown; loading: boolean; error: Failure | null; reload: () => void };
export type Form = { reset: () => void; values: Record<string, unknown> };

export type PageState = {
    state: Record<string, unknown>;
    overlays: Record<string, boolean>;
    resources: Record<string, Resource>;
    forms: Record<string, Form>;
    set: ( key: string, value: unknown ) => void;
    toggle: ( key: string ) => void;
    open: ( name: string ) => void;
    close: ( name: string ) => void;
    publish: ( name: string, resource: Resource ) => void;
    forget: ( name: string ) => void;
    register: ( name: string, form: Form ) => void;
    release: ( name: string ) => void;
};

function without<T> ( entries: Record<string, T>, name: string ): Record<string, T> {

    const { [name]: _, ...rest } = entries;

    return rest;

}
export function createPageStore ( initial: Record<string, unknown> ) {

    return createStore<PageState>()(( set ) => ({
        state: initial,
        overlays: {},
        resources: {},
        forms: {},
        set: ( key, value ) => set(( current ) => ({ state: { ...current.state, [key]: value } })),
        toggle: ( key ) => set(( current ) => ({ state: { ...current.state, [key]: !current.state[key] } })),
        open: ( name ) => set(( current ) => ({ overlays: { ...current.overlays, [name]: true } })),
        close: ( name ) => set(( current ) => ({ overlays: { ...current.overlays, [name]: false } })),
        publish: ( name, resource ) => set(( current ) => ({ resources: { ...current.resources, [name]: resource } })),
        forget: ( name ) => set(( current ) => ({ resources: without(current.resources, name) })),
        register: ( name, form ) => set(( current ) => ({ forms: { ...current.forms, [name]: form } })),
        release: ( name ) => set(( current ) => ({ forms: without(current.forms, name) })),
    }));

}
