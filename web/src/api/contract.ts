import { z } from "../lib/providers/schema.ts";
import { filterKeys, includes, mapValues } from "../lib/std/object.ts";
import { templateKeys } from "../lib/std/route.ts";
import { target } from "./request.ts";
import type { Endpoint } from "./system.ts";
import { ack, currency, parseResource, type ResourceValues, resourceDefaults, resourceKeys, system } from "./system.ts";
import {
    aggregateDefaults, type Contract, contractShape, envelopeDefaults, headerDefaults, type Layer, layerShape, type Method, merge, name,
    paginationDefaults, url, type Wire, wireShape,
} from "./wire.ts";

export const liveTopics = ["notifications", "wallet", "transactions", "order", "chat", "room", "subscription"] as const;

export type LiveTopic = typeof liveTopics[number];

const placeholders = ( value: string ) => [...value.matchAll(/\{([^}]+)\}/g)].map(( match ) => match[1] ?? "");

const channel = z.object({
    channel: z.string().max(200).regex(/^(?:private-|presence-)[a-zA-Z0-9_.{}-]+$/)
        .refine(( value ) => placeholders(value).every(( key ) => ["userId", "entityId"].includes(key))),
    event: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.\\-]+$/),
});

export const channelsShape = z.partialRecord(z.enum(liveTopics), channel);

export const channelDefaults: z.output<typeof channelsShape> = {
    notifications: { channel: "private-notification.{userId}", event: "notification.event" },
    wallet: { channel: "private-wallet.{userId}", event: "wallet.event" },
    transactions: { channel: "private-transaction.{userId}", event: "transaction.event" },
    order: { channel: "private-order.{entityId}", event: "order.event" },
    chat: { channel: "presence-chat.{userId}", event: "chat.event" },
    room: { channel: "private-chat.room.{entityId}", event: "chat.event" },
    subscription: { channel: "private-subscription.{entityId}", event: "subscription.event" },
};

export const realtimeShape = z.strictObject({
    transport: z.literal("pusher"),
    channels: channelsShape.default(channelDefaults),
});

export const connectionDefaults = {
    browser: true,
    browserBaseUrl: null,
    timeoutMs: 10000,
    retries: 1,
    maxResponseBytes: 1048576,
    credentials: "omit",
} as const;
const connectionShape = z.strictObject({
    baseUrl: url,
    browser: z.boolean(),
    browserBaseUrl: url,
    timeoutMs: z.number().int().positive().max(60000),
    retries: z.number().int().min(0).max(3),
    maxResponseBytes: z.number().int().min(1024).max(10000000),
    credentials: z.enum(["omit", "same-origin", "include"]),
    development: z.strictObject({ baseUrl: url, browserBaseUrl: url }).optional(),
});
export const apiShape = z.strictObject({
    context: z.strictObject({
        spec: name,
        currency,
        authCookie: z.string().regex(/^[a-zA-Z0-9._-]+$/).nullable(),
        proxies: z.number().int().min(0).max(5),
    }),
    connections: z.record(name, connectionShape),
    realtime: realtimeShape,
});
export const apiInputShape = apiShape.extend({
    context: apiShape.shape.context.extend({ authCookie: apiShape.shape.context.shape.authCookie.default(null), proxies: z.number().int().min(0).max(5).default(1) }),
    connections: z.record(name, connectionShape.partial().extend({ baseUrl: url })),
    realtime: realtimeShape.default({ transport: "pusher", channels: channelDefaults }),
});

export type ApiInput = z.input<typeof apiInputShape>;
export type ApiConfig = z.output<typeof apiShape>;
export type Reachable = Pick<ApiConfig["connections"][string], "baseUrl" | "timeoutMs" | "retries" | "maxResponseBytes" | "credentials">;
export type RealtimeConfig = z.output<typeof realtimeShape>;

type Overrides = z.output<typeof overridesShape>;

type OperationOverride = Omit<Layer, "request" | "response"> & {
    request?: Omit<NonNullable<Layer["request"]>, "fields"> & { fields?: Record<string, string | null> };
    response?: Omit<NonNullable<Layer["response"]>, "fields"> & { fields?: Record<string, string> };
};
type FeatureOverride = Omit<Layer, "method" | "path"> & {
    operations?: Record<string, OperationOverride | boolean>;
};
export type BrowserConfig = {
    api: Omit<ApiConfig, "context" | "connections"> & { context: Omit<ApiConfig["context"], "authCookie">; connections: Record<string, Reachable> };
    contract: Contract;
};
export type ContractOverrides = Omit<Layer, "enabled" | "method" | "path" | "response"> & {
    response?: Omit<NonNullable<Layer["response"]>, "empty">;
    features?: Record<string, FeatureOverride | boolean>;
};

function switched<T extends z.ZodType> ( shape: T ) {

    return z.preprocess(( value ) => (value === true ? {} : value), z.union([z.literal(false), shape]));

}
const featureShape = layerShape.omit({ method: true, path: true }).extend({
    operations: z.record(z.string(), switched(layerShape)).optional(),
});
export const overridesShape = layerShape.omit({ enabled: true, method: true, path: true }).extend({
    response: layerShape.shape.response.unwrap().omit({ empty: true }).optional(),
    features: z.record(z.string(), switched(featureShape)).optional(),
});

function inputKeys ( endpoint: Endpoint ): string[] {

    return Object.keys(endpoint.input.shape);

}
function outputKeys ( endpoint: Endpoint ): string[] {

    return endpoint.output instanceof z.ZodObject ? Object.keys(endpoint.output.shape) : [];

}
function fit ( layer: Layer, endpoint: Endpoint ): Layer {

    const { request, response, ...rest } = layer;
    const inputs = inputKeys(endpoint);
    const outputs = outputKeys(endpoint);

    if ( !request && !response ) return rest;

    return {
        ...rest,
        ...(request ? { request: { ...request, ...(request.fields ? { fields: filterKeys(request.fields, ( key ) => inputs.includes(key)) } : {}) } } : {}),
        ...(response ? {
            response: {
                ...response,
                ...(response.fields ? { fields: filterKeys(response.fields, ( key ) => outputs.includes(key)) } : {}),
                ...(endpoint.many ? {} : { pagination: undefined, aggregates: undefined }),
            },
        } : {}),
    };

}
function base ( endpoint: Endpoint ): Layer {

    return {
        enabled: true,
        execution: "hybrid",
        connection: "primary",
        encoding: "json",
        method: endpoint.method,
        path: endpoint.path,
        cache: 0,
        request: { headers: headerDefaults, fields: {} },
        response: {
            ...envelopeDefaults,
            empty: endpoint.output === ack,
            pagination: endpoint.many ? paginationDefaults : null,
            aggregates: endpoint.many ? aggregateDefaults : null,
        },
    };

}
function headers ( layer: Layer ): Wire["request"]["headers"] {

    const entries = Object.entries(layer.request?.headers ?? {}).flatMap(( [key, value] ) => {

        if ( !value ) return [];

        return [[key, typeof value === "string" ? { name: value } : value]];

    });

    return Object.fromEntries(entries);

}
function check ( wire: Wire, endpoint: Endpoint, where: string, connections: ApiConfig["connections"], action: Layer ): void {

    const inputs = inputKeys(endpoint);
    const outputs = outputKeys(endpoint);
    const params = templateKeys(wire.path);
    const names = Object.values(wire.request.headers).map(( header ) => header.name.toLowerCase());
    const body = inputs.some(( key ) => !params.includes(key) && target(wire, key)?.place === "body");

    const unknown = [
        ...Object.keys(action.request?.fields ?? {}).filter(( key ) => !inputs.includes(key)).map(( key ) => `request.fields.${key}`),
        ...Object.keys(action.response?.fields ?? {}).filter(( key ) => !outputs.includes(key)).map(( key ) => `response.fields.${key}`),
        ...params.filter(( key ) => !inputs.includes(key)).map(( key ) => `path {${key}}`),
    ];

    if ( unknown.length ) throw new Error(`${where}: unknown ${unknown.join(", ")}.`);
    if ( !Object.hasOwn(connections, wire.connection) ) throw new Error(`${where}: missing connection "${wire.connection}".`);
    if ( new Set(names).size !== names.length ) throw new Error(`${where}: header names must be unique.`);
    if ( wire.method === "GET" && body ) throw new Error(`${where}: GET cannot carry a body.`);
    if ( wire.method !== "GET" && wire.cache ) throw new Error(`${where}: only GET reads can be cached.`);

}
function operation ( global: Layer, shared: Layer, action: Layer | false | undefined, endpoint: Endpoint ) {

    if ( action === false ) return { enabled: false as const };

    const merged = [fit(global, endpoint), endpoint.wire, fit(shared, endpoint), action ?? {}].reduce(merge, base(endpoint));

    if ( !merged.enabled ) return { enabled: false as const };

    return wireShape.parse({ ...merged, request: { headers: headers(merged), fields: merged.request?.fields ?? {} } });

}
function unknown ( keys: string[], known: object, where: string ): void {

    const strangers = keys.filter(( key ) => !Object.hasOwn(known, key));

    if ( strangers.length ) throw new Error(`${where}: unknown ${strangers.join(", ")}.`);

}
function feature ( name: string, operations: Record<string, Endpoint>, chosen: Overrides["features"], global: Layer, api: ApiConfig ) {

    const selected = chosen?.[name];
    const { operations: actions = {}, ...shared } = selected || {};

    unknown(Object.keys(actions), operations, `contract.features.${name}.operations`);

    return mapValues(operations, ( endpoint, key ) => {

        const wire = operation(global, shared, selected === false ? false : actions[key], endpoint);

        if ( wire.enabled ) check(wire, endpoint, `${name}.${key}`, api.connections, actions[key] || {});

        return wire;

    });

}
export function openWire ( contract: Contract, method: Method, path: string, cache: number | null | undefined, response: Layer["response"] = {} ): Wire {

    const core: Layer = {
        enabled: true,
        execution: "hybrid",
        connection: "primary",
        encoding: "json",
        request: { headers: headerDefaults, fields: {} },
        response: { ...envelopeDefaults, pagination: paginationDefaults, aggregates: aggregateDefaults },
    };
    const layer = merge(merge(core, contract.defaults), { method, path, cache: method === "GET" ? cache ?? 0 : 0, response });

    return wireShape.parse({ ...layer, request: { headers: headers(layer), fields: layer.request?.fields ?? {} } });

}
function values ( seeds: ResourceValues ) {

    return Object.fromEntries(resourceKeys.map(( key ) => [key, parseResource(key, { ...resourceDefaults(key), ...seeds[key] })]));

}
function connect ( input: ApiInput ): ApiConfig {

    const source = apiInputShape.parse(input);

    return apiShape.parse({ ...source, connections: mapValues(source.connections, ( value ) => ({ ...connectionDefaults, ...value })) });

}
function switches ( chosen: NonNullable<Overrides["features"]>, owned: object ): Record<string, boolean> {

    const entries = Object.entries(chosen).filter(( [key] ) => !Object.hasOwn(owned, key)).map(( [key, value] ) => [key, value !== false]);

    return Object.fromEntries(entries);

}
export function resolveApi ( input: ApiInput, overrides: ContractOverrides = {}, seeds: ResourceValues = {} ): { api: ApiConfig; contract: Contract } {

    const api = connect(input);
    const { features: chosen = {}, ...global } = overridesShape.parse(overrides);
    const catalogue: Record<string, Record<string, Endpoint>> = system;
    const features = mapValues(catalogue, ( operations, name ) => feature(name, operations, chosen, global, api));

    return { api, contract: contractShape.parse({ values: values(seeds), features, defaults: global, switches: switches(chosen, catalogue) }) };

}
function restrict ( contract: Contract ): { contract: Contract; used: Set<string> } {

    const selected = structuredClone(contract);
    const used = new Set<string>();

    for ( const [name, operations] of Object.entries(selected.features) ) {

        for ( const [operation, wire] of Object.entries(operations) ) {

            if ( !wire.enabled ) continue;

            if ( wire.execution !== "server" ) {

                used.add(wire.connection);
                continue;

            }

            operations[operation] = { enabled: false, restricted: true };

            if ( includes(resourceKeys, name) ) {

                Object.assign(selected.values, { [name]: resourceDefaults(name) });

            }

        }

    }

    return { contract: selected, used };

}
function expose ( connections: ApiConfig["connections"], used: Set<string> ): Record<string, Reachable> {

    const exposed = Object.entries(connections).filter(( [name] ) => used.has(name)).map(( [name, value] ) => {

        const { baseUrl, browser, browserBaseUrl, timeoutMs, retries, maxResponseBytes, credentials } = value;

        return [name, { baseUrl: browser ? browserBaseUrl ?? baseUrl : null, timeoutMs, retries, maxResponseBytes, credentials }];

    });

    return Object.fromEntries(exposed);

}
export function browserConfig ( api: ApiConfig, contract: Contract ): BrowserConfig {

    const { contract: selected, used } = restrict(contract);
    const { authCookie: _, ...context } = api.context;

    return {
        api: { context, connections: expose(api.connections, used), realtime: api.realtime },
        contract: selected,
    };

}

type Operation = Contract["features"][string][string];
type Disabled = Extract<Operation, { enabled: false }>;
type Tables = { request: Wire["request"][]; response: Wire["response"][] };
type Indexes = { [K in keyof Tables]: Map<string, number> };
type PackedWire = Omit<Wire, keyof Tables> & { [K in keyof Tables]: number };

export type PackedContract = {
    values: Contract["values"];
    tables: Tables;
    features: Record<string, Record<string, PackedWire | Disabled>>;
    defaults: Contract["defaults"];
    switches: Contract["switches"];
};

function intern<T> ( table: T[], index: Map<string, number>, value: T ): number {

    const key = JSON.stringify(value);
    const found = index.get(key);

    if ( found !== undefined ) return found;

    const position = table.push(value) - 1;

    index.set(key, position);

    return position;

}
function entry<T> ( table: T[], position: number ): T {

    const value = table[position];

    if ( value === undefined ) throw new Error(`Packed contract has no table entry ${position}.`);

    return value;

}
function packWire ( wire: Operation, tables: Tables, indexes: Indexes ): PackedWire | Disabled {

    if ( !wire.enabled ) return wire;

    return {
        ...wire,
        request: intern(tables.request, indexes.request, wire.request),
        response: intern(tables.response, indexes.response, wire.response),
    };

}
function unpackWire ( wire: PackedWire | Disabled, tables: Tables ): Operation {

    if ( !wire.enabled ) return wire;

    return {
        ...wire,
        request: entry(tables.request, wire.request),
        response: entry(tables.response, wire.response),
    };

}
export function packContract ( contract: Contract ): PackedContract {

    const tables: Tables = { request: [], response: [] };
    const indexes: Indexes = { request: new Map(), response: new Map() };
    const features = mapValues(contract.features, ( operations ) => mapValues(operations, ( wire ) => packWire(wire, tables, indexes)));

    return { values: contract.values, tables, features, defaults: contract.defaults, switches: contract.switches };

}
export function unpackContract ( packed: PackedContract ): Contract {

    return {
        values: packed.values,
        features: mapValues(packed.features, ( operations ) => mapValues(operations, ( wire ) => unpackWire(wire, packed.tables))),
        defaults: packed.defaults,
        switches: packed.switches,
    };

}
