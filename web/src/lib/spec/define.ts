import type { components } from "../../components/index.ts";
import type { elements } from "../../elements/index.ts";
import type { z } from "../providers/schema.ts";
import type { Kind } from "./kinds.ts";
import type { CallData, Mapping, Method, roots, ScreenInput } from "./shapes.ts";

type Topic = NonNullable<CallData["live"]>;

export type As = "id" | "number" | "boolean" | "date" | "text";
export type Reference = { from: string; as?: As };
export type Key = { key: string };
export type Bound = string | number | boolean | null | Key | Reference;
export type Value<T = unknown> = T | Key | Reference;
export type Condition = { is: Bound } | { not: Bound } | { eq: [Bound, Bound] } | { auth: boolean } | { all: Condition[] } | { any: Condition[] };
export type Effect =
    | { set: string; value: Bound }
    | { toggle: string }
    | { call: Call }
    | { go: Bound }
    | { open: string }
    | { close: string }
    | { refresh: string }
    | { reset: string }
    | { session: Bound }
    | { emit: string; payload?: Bound };
export type Watch = { on: string; do: Effect[] };
export type Node = {
    is: string;
    id?: string;
    name?: string;
    when?: Condition;
    on?: Record<string, Effect[]>;
    read?: Call;
    items?: Bound;
    watch?: Watch[];
    props: Record<string, unknown>;
    slots?: Record<string, Node[]>;
};

type Loose<T> = T extends CallData ? Call : T extends readonly (infer U)[] ? Loose<U>[] : T extends object ? { [K in keyof T]: Loose<T[K]> } : T;
type Props<K extends Kind> = { [P in keyof z.input<K["props"]>]: Value<Loose<z.input<K["props"]>[P]>> };
type Settings<K extends Kind> = Props<K> & {
    id?: string;
    name?: string;
    when?: Condition;
    on?: { [E in keyof K["events"]]?: Effect[] } & Record<string, Effect[]>;
    read?: Call;
    items?: Bound;
    watch?: Watch[];
};
type Layout<K extends Kind> = Omit<Settings<K>, "read" | "items">;
type Children = Node[] | Record<string, Node[]>;
type Builder<K extends Kind> = {
    ( settings?: Settings<K>, children?: Children ): Node;
    ( name: string, settings?: Settings<K>, children?: Children ): Node;
};
type Builders<C extends Record<string, Kind>> = { [N in keyof C]: Builder<C[N]> };
type Picker = ( path?: string, as?: As ) => Reference;

const keys = ["id", "name", "when", "on", "read", "items", "watch"] as const;

/** One backend call. Chain `.cache/.map/.every/.live`; serialises to its data. */
export class Call {

    readonly #data: CallData;

    constructor ( data: CallData ) {

        this.#data = data;

    }
    cache ( seconds: number ): Call {

        return new Call({ ...this.#data, cache: seconds });

    }
    map ( map: Mapping ): Call {

        return new Call({ ...this.#data, map });

    }
    every ( seconds: number ): Call {

        return new Call({ ...this.#data, every: seconds });

    }
    live ( topic: Topic ): Call {

        return new Call({ ...this.#data, live: topic });

    }
    toJSON (): CallData {

        return this.#data;

    }

}

function node ( is: string, settings: Record<string, unknown> = {}, children?: Children ): Node {

    const own: Record<string, unknown> = {};
    const props: Record<string, unknown> = {};

    for ( const [key, value] of Object.entries(settings) ) {

        if ( value === undefined ) continue;
        if ( keys.includes(key as typeof keys[number]) ) own[key] = value;
        else props[key] = value;

    }

    const slots = Array.isArray(children) ? { children } : children;

    return { is, ...own, props, ...(slots ? { slots } : {}) } as Node;

}
function named ( is: string, first?: unknown, second?: unknown, third?: unknown ): Node {

    if ( typeof first === "string" ) return node(is, { ...(second as Record<string, unknown> | undefined), name: first }, third as Children | undefined);

    return node(is, first as Record<string, unknown> | undefined, second as Children | undefined);

}
function builders<C extends Record<string, Kind>> (): Builders<C> {

    return new Proxy({} as Builders<C>, {
        get: ( _, is ) => ( first?: unknown, second?: unknown, third?: unknown ) => named(String(is), first, second, third),
    });

}
function request ( method: Method ): ( path: string, input?: Record<string, Bound> ) => Call {

    return ( path, input ) => new Call({ method, path, ...(input ? { input } : {}) });

}
function pick ( root: typeof roots[number] ): Picker {

    return ( path, as ) => ({ from: path ? `${root}.${path}` : root, ...(as ? { as } : {}) });

}

export const e = builders<typeof elements>();
export const c = builders<typeof components>();
export const api = { get: request("GET"), post: request("POST"), put: request("PUT"), patch: request("PATCH"), del: request("DELETE") };
export const act = {
    set: ( key: string, value: Bound ): Effect => ({ set: key, value }),
    toggle: ( key: string ): Effect => ({ toggle: key }),
    call: ( call: Call ): Effect => ({ call }),
    go: ( href: Bound ): Effect => ({ go: href }),
    open: ( name: string ): Effect => ({ open: name }),
    close: ( name: string ): Effect => ({ close: name }),
    refresh: ( name: string ): Effect => ({ refresh: name }),
    reset: ( name: string ): Effect => ({ reset: name }),
    session: ( value: Bound ): Effect => ({ session: value }),
    emit: ( event: string, payload?: Bound ): Effect => ({ emit: event, ...(payload === undefined ? {} : { payload }) }),
};
export const param = pick("params");
export const query = pick("query");
export const state = pick("state");
export const session = pick("session");
export const item = pick("item");
export const form = pick("form");
export const event = pick("event");
export const result = pick("result");
export const site = pick("site");

export function defineConfig<const T> ( config: T ): T {

    return config;

}
export function defineSchema<const T extends { screens: ScreenInput[] }> ( schema: T ): T {

    return schema;

}
export function screen<const T extends ScreenInput> ( input: T ): T {

    return input;

}
export function t ( key: string ): Key {

    return { key };

}
export function from ( path: string, as?: As ): Reference {

    return as ? { from: path, as } : { from: path };

}
export function is ( value: Bound ): Condition {

    return { is: value };

}
export function not ( value: Bound ): Condition {

    return { not: value };

}
export function eq ( left: Bound, right: Bound ): Condition {

    return { eq: [left, right] };

}
export function auth ( signedIn = true ): Condition {

    return { auth: signedIn };

}
export function all ( ...conditions: Condition[] ): Condition {

    return { all: conditions };

}
export function any ( ...conditions: Condition[] ): Condition {

    return { any: conditions };

}
export function watch ( on: string | Reference, ...effects: Effect[] ): Watch {

    return { on: typeof on === "string" ? on : on.from, do: effects };

}
export function zone ( name: string, settings: Layout<typeof components.zone> & { read?: Call }, children: Node[] ): Node {

    return node("zone", { ...settings, name }, children);

}
export function stack ( children: Node[], settings: Layout<typeof elements.column> = {} ): Node {

    return node("column", settings, children);

}
export function row ( children: Node[], settings: Layout<typeof elements.row> = {} ): Node {

    return node("row", settings, children);

}
export function grid ( columns: z.input<typeof elements.grid.props>["columns"], children: Node[], settings: Omit<Layout<typeof elements.grid>, "columns"> = {} ): Node {

    return node("grid", { ...settings, columns }, children);

}
export function split ( sizes: number[], parts: Node[][], settings: Omit<Layout<typeof elements.columns>, "sizes"> = {} ): Node {

    return node("columns", { ...settings, sizes }, parts.map(( children ) => node("column", {}, children)));

}
