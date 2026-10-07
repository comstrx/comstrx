import type { z } from "../lib/providers/schema.ts";
import { createSignal, createTopics } from "../lib/std/events.ts";
import { retryAfter, retryReads, type Transport } from "../lib/std/fetch.ts";
import { type UploadLimits, uploadLimits } from "../lib/std/form.ts";
import { mapValues } from "../lib/std/object.ts";
import { uuid } from "../lib/std/security.ts";
import { openWire, type Reachable } from "./contract.ts";
import { ApiError, type Observer, type Outcome } from "./error.ts";
import { type Context, encode, encodeBody, requestHeaders } from "./request.ts";
import { type ApiResult, decode, open, readJson } from "./response.ts";
import type { Endpoint } from "./system.ts";
import { type System, system } from "./system.ts";
import { type Contract, type Method, personalHeaders, type Wire } from "./wire.ts";

export type Execution = "server" | "client";
export type RequestOptions = { signal?: AbortSignal; idempotencyKey?: string; cache?: number };
export type ClientOptions = { execution?: Execution; transport?: typeof fetch; limits?: UploadLimits; observe?: Observer };
export type Result<E extends Endpoint> = ApiResult<E["many"] extends true ? z.output<E["output"]>[] : z.output<E["output"]>>;
export type Target = { method: Method; path: string; input?: unknown; cache?: number; response?: { data?: string; fields?: Record<string, string> } };
export type Call = ( target: Target, options?: RequestOptions ) => Promise<ApiResult<unknown>>;
export type ApiSettings = { connections: Readonly<Record<string, Reachable>> };

type Typed<E extends Endpoint> = Record<string, never> extends z.input<E["input"]>
    ? ( input?: z.input<E["input"]>, options?: RequestOptions ) => Promise<Result<E>>
    : ( input: z.input<E["input"]>, options?: RequestOptions ) => Promise<Result<E>>;

export type SystemClient = {
    [F in keyof System]: {
        [O in keyof System[F]]: System[F][O] extends Endpoint ? Typed<System[F][O]> : never
    }
};
export type ApiClient = SystemClient & { call: Call };

type Local = Record<string, unknown> | undefined;
type Operation = Contract["features"][string][string];
type Found = { endpoint: Endpoint; wire: Operation; local: Local; connection?: Reachable };
type Located = { feature: string; endpoint: Endpoint; wire: Wire; local: Local; connection: Reachable };
type Signals = { signal?: AbortSignal; timeout: AbortSignal };
type Prepared = {
    url: URL;
    body?: Record<string, unknown>;
    headers: Headers;
    current: Context;
    mutation: boolean;
    lifetime: number;
};

type Setup = {
    settings: ApiSettings;
    contract: Contract;
    context: Context | (() => Context | Promise<Context>);
    execution: Execution;
    transport: Transport;
    limits: UploadLimits;
    observe?: Observer;
    wires: Map<string, Wire>;
};

const owned: Record<string, Record<string, Endpoint>> = system;
const sessions = createSignal<string>();
const mutations = createTopics<string>();

export const onSessionRejected = sessions.subscribe;
export const rejectSession = sessions.emit;

export function onMutation ( feature: string, receive: () => void ) {

    return mutations.subscribe(feature, receive);

}
export function invalidate ( feature: string ): void {

    mutations.emit(feature, undefined);

}

function clean ( path: string ): string {

    return `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;

}
function feature ( path: string ): string {

    return clean(path).split("/")[1] ?? "";

}
function located ( { contract, settings }: Setup, feature: string, operation: string ): Found | undefined {

    const endpoint = owned[feature]?.[operation];
    const wire = contract.features[feature]?.[operation];

    if ( !endpoint || !wire ) return undefined;
    if ( !wire.enabled && wire.restricted ) throw new ApiError("execution");

    return {
        endpoint,
        wire,
        local: endpoint.local ? contract.values[endpoint.local] : undefined,
        connection: wire.enabled ? settings.connections[wire.connection] : undefined,
    };

}
function opened ( setup: Setup, target: Target ): Found | undefined {

    const path = clean(target.path);
    const key = `${target.method} ${path} ${target.cache ?? 0} ${JSON.stringify(target.response ?? {})}`;
    const wire = setup.wires.get(key) ?? openWire(setup.contract, target.method, path, target.cache, target.response);

    setup.wires.set(key, wire);

    if ( setup.contract.switches[feature(path)] === false ) return undefined;

    return { endpoint: open(target.method, path), wire, local: undefined, connection: setup.settings.connections[wire.connection] };

}
function offline ( local: Local ): ApiResult<unknown> {

    if ( !local ) throw new ApiError("configuration");

    return { resource: structuredClone(local), message: null, meta: { source: "local" } };

}
function lifetime ( setup: Setup, wire: Wire, current: Context, requested = wire.cache ): number {

    if ( !Number.isSafeInteger(requested) || requested < 0 || requested > 86400 ) throw new ApiError("input");

    return setup.execution === "server" && wire.method === "GET" && !current.auth ? requested : 0;

}
async function prepare ( setup: Setup, { wire, endpoint }: Located, baseUrl: string, raw: unknown, options: RequestOptions, outcome: Outcome ): Promise<Prepared> {

    const input = endpoint.input.safeParse(raw);

    if ( !input.success ) throw new ApiError("input", { cause: input.error });

    const current = typeof setup.context === "function" ? await setup.context() : setup.context;

    outcome.trace = current.requestId;

    const { url, body } = encode(wire, input.data, baseUrl);
    const key = options.idempotencyKey;
    const bodyKey = typeof input.data.idempotency_key === "string" ? input.data.idempotency_key : undefined;
    const mutation = wire.method !== "GET";
    const shared = lifetime(setup, wire, current, options.cache);

    if ( bodyKey && key && bodyKey !== key ) throw new ApiError("input");

    const headers = requestHeaders(wire.request.headers, {
        ...current,
        idempotency: mutation ? key ?? bodyKey ?? uuid() : undefined,
        requestId: uuid(),
        contentType: body && wire.encoding === "json" ? "application/json" : undefined,
    }, shared ? personalHeaders : []);

    return { url, body, headers, current, mutation, lifetime: shared };

}
function caching ( { lifetime: revalidate }: Prepared ): RequestInit {

    return revalidate ? { cache: "force-cache", next: { revalidate } } : { cache: "no-store" };

}
function failed ( setup: Setup, wire: Wire, current: Context, error: unknown, { signal, timeout }: Signals ): ApiError {

    if ( signal?.aborted ) return new ApiError("aborted");
    if ( timeout.aborted ) return new ApiError("timeout");
    if ( !(error instanceof ApiError) ) return new ApiError("network", { cause: error });
    if ( setup.execution === "client" && error.status === 401 && current.auth && wire.request.headers.auth ) rejectSession(current.auth);

    return error;

}
async function send ( setup: Setup, { feature, wire, endpoint, local, connection }: Located, prepared: Prepared, signal?: AbortSignal ) {

    const timeout = AbortSignal.timeout(connection.timeoutMs);
    const transport = retryReads(setup.transport, connection.retries);

    try {

        const response = await transport(prepared.url, {
            method: wire.method,
            headers: prepared.headers,
            body: encodeBody(prepared.body, wire.encoding, setup.limits),
            signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
            credentials: connection.credentials,
            redirect: "error",
            ...caching(prepared),
        });

        const received = { status: response.status, ok: response.ok, retryAfter: retryAfter(response.headers.get("retry-after")) };
        const body = await readJson(response, connection.maxResponseBytes, { retryAfter: received.retryAfter });
        const result = decode(wire, endpoint, local, { ...received, body });

        if ( setup.execution === "client" && prepared.mutation ) invalidate(feature);

        return result;

    }
    catch ( error ) {

        throw failed(setup, wire, prepared.current, error, { signal, timeout });

    }

}
async function exchange ( setup: Setup, feature: string, found: Found | undefined, raw: unknown, options: RequestOptions, outcome: Outcome ) {

    if ( options.signal?.aborted ) throw new ApiError("aborted");
    if ( !found ) return offline(undefined);

    const { endpoint, wire, local, connection } = found;

    if ( !wire.enabled || !connection?.baseUrl ) return offline(local);
    if ( wire.execution !== "hybrid" && wire.execution !== setup.execution ) throw new ApiError("execution");

    const call: Located = { feature, endpoint, wire, local, connection };

    return send(setup, call, await prepare(setup, call, connection.baseUrl, raw, options, outcome), options.signal);

}
async function request ( setup: Setup, label: string, feature: string, found: Found | undefined, raw: unknown = {}, options: RequestOptions = {} ): Promise<ApiResult<unknown>> {

    const outcome: Outcome = { call: label, ms: 0 };
    const started = performance.now();

    try {

        const result = await exchange(setup, feature, found, raw, options, outcome);

        setup.observe?.({ ...outcome, ms: performance.now() - started, request: result.meta.requestId });

        return result;

    }
    catch ( error ) {

        if ( error instanceof ApiError ) setup.observe?.({ ...outcome, ms: performance.now() - started, request: error.requestId, error });

        throw error;

    }

}
function members ( setup: Setup ): SystemClient {

    const typed = mapValues(owned, ( operations, feature ) => mapValues(operations, ( _, operation ) => {

        return ( input?: unknown, options?: RequestOptions ) => request(setup, `${feature}.${operation}`, feature, located(setup, feature, operation), input, options);

    }));

    return typed as SystemClient;

}
export function createApi (
    settings: ApiSettings,
    contract: Contract,
    context: Context | (() => Context | Promise<Context>),
    { execution = "server", transport = fetch, limits = uploadLimits, observe }: ClientOptions = {},
): ApiClient {

    const setup: Setup = { settings, contract, context, execution, transport, limits, observe, wires: new Map() };

    return {
        ...members(setup),
        call: ( target, options ) => request(setup, `${target.method} ${clean(target.path)}`, feature(target.path), opened(setup, target), target.input, options),
    };

}
