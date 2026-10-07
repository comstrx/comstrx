import type { Target } from "../../api/client.ts";
import { isRecord, pathGet } from "../std/object.ts";
import { entityId } from "../std/route.ts";
import type { CallData, Condition, Reference, Value } from "./shapes.ts";

/** Scope roots plus the screen's sources, by name. */
export type Scope = Partial<Record<string, unknown>>;
export type Translate = ( key: string ) => string;
export type Session = { token: string | null; user: Record<string, unknown> | null };

const placeholder = /\{([a-zA-Z0-9_.]+)\}/g;

export function isKey ( value: unknown ): value is { key: string } {

    return isRecord(value) && typeof value.key === "string" && Object.keys(value).length === 1;

}
export function isReference ( value: unknown ): value is Reference {

    return isRecord(value) && typeof value.from === "string";

}
export function isCall ( value: unknown ): value is CallData {

    return isRecord(value) && typeof value.method === "string" && typeof value.path === "string";

}
export function lookup ( scope: Scope, path: string ): unknown {

    return pathGet(scope, path);

}
export function convert ( value: unknown, as: Reference["as"] ): unknown {

    if ( value === null || value === undefined || as === undefined ) return value;
    if ( as === "id" ) return typeof value === "number" ? value : entityId(String(value));
    if ( as === "number" ) return Number.isFinite(Number(value)) ? Number(value) : undefined;
    if ( as === "boolean" ) return value === true || value === "true" || value === 1 || value === "1";
    if ( as === "date" ) return /^\d{4}-\d{2}-\d{2}/.test(String(value)) ? String(value).slice(0, 10) : undefined;

    return String(value);

}
export function resolve ( value: Value | undefined, scope: Scope, translate: Translate ): unknown {

    if ( value === undefined ) return undefined;
    if ( isKey(value) ) return translate(value.key);
    if ( isReference(value) ) return convert(lookup(scope, value.from), value.as);
    if ( typeof value === "string" && value.includes("{") ) return interpolate(value, scope);

    return value;

}
export function resolveProps ( props: Record<string, unknown>, raw: readonly string[], scope: Scope, translate: Translate ): Record<string, unknown> {

    return Object.fromEntries(Object.entries(props).map(( [key, value] ) => [key, raw.includes(key) ? value : resolveDeep(value, scope, translate)]));

}
export function resolveDeep ( value: unknown, scope: Scope, translate: Translate ): unknown {

    if ( isKey(value) || isReference(value) || typeof value === "string" ) return resolve(value as Value, scope, translate);
    if ( isCall(value) ) return bind(value, scope, translate);
    if ( Array.isArray(value) ) return value.map(( item ) => resolveDeep(item, scope, translate));
    if ( isRecord(value) ) return Object.fromEntries(Object.entries(value).map(( [key, item] ) => [key, resolveDeep(item, scope, translate)]));

    return value;

}
export function failureOf ( error: unknown ): { kind: string; status: number; reason?: string; code?: string; message?: string; errors: Record<string, string[]> } {

    const facts = isRecord(error) ? error : {};
    const errors = isRecord(facts.errors) ? facts.errors : {};

    return {
        kind: typeof facts.kind === "string" ? facts.kind : "network",
        status: typeof facts.status === "number" ? facts.status : 0,
        reason: typeof facts.reason === "string" ? facts.reason : undefined,
        code: typeof facts.code === "string" ? facts.code : undefined,
        message: error instanceof Error ? error.message : undefined,
        errors: Object.fromEntries(Object.entries(errors).map(( [key, value] ) => [key, Array.isArray(value) ? value.map(String) : [String(value)]])),
    };

}
export function textOf ( value: unknown ): string {

    if ( typeof value === "string" ) return value;
    if ( typeof value === "number" ) return String(value);

    return "";

}
export function interpolate ( template: string, scope: Scope, extra: Record<string, unknown> = {} ): string {

    return template.replace(placeholder, ( _, path: string ) => {

        const found = Object.hasOwn(extra, path) ? extra[path] : lookup(scope, path);

        return found === null || found === undefined ? "" : encodeURIComponent(textOf(found));

    });

}
export function present ( value: unknown ): boolean {

    if ( value === null || value === undefined || value === false || value === "" ) return false;
    if ( Array.isArray(value) ) return value.length > 0;

    return true;

}
export function holds ( condition: Condition | undefined, scope: Scope, translate: Translate ): boolean {

    if ( !condition ) return true;
    if ( "is" in condition ) return present(resolve(condition.is, scope, translate));
    if ( "not" in condition ) return !present(resolve(condition.not, scope, translate));
    if ( "eq" in condition ) return resolve(condition.eq[0], scope, translate) === resolve(condition.eq[1], scope, translate);
    if ( "auth" in condition ) return condition.auth === present(lookup(scope, "session.token"));
    if ( "all" in condition ) return condition.all.every(( item ) => holds(item, scope, translate));

    return condition.any.some(( item ) => holds(item, scope, translate));

}
/** Binds a call's inputs from the scope; unbound path parameters fall back to the screen parameters. */
export function inputsOf ( call: CallData, scope: Scope, translate: Translate ): Record<string, unknown> {

    const bound = Object.entries(call.input ?? {}).map(( [key, value] ) => [key, resolve(value, scope, translate)]);
    const params = isRecord(scope.params) ? scope.params : {};
    const given = Object.fromEntries(bound.filter(( [, value] ) => value !== undefined && value !== null));

    for ( const key of call.path.match(/\{([a-zA-Z0-9_]+)\}/g)?.map(( match ) => match.slice(1, -1)) ?? [] ) {

        if ( !Object.hasOwn(given, key) && params[key] !== undefined ) given[key] = convert(params[key], "id") ?? params[key];

    }

    return given;

}
/** The call with its inputs bound to this scope; what a component receives in its props. */
export function bind ( call: CallData, scope: Scope, translate: Translate ): CallData {

    return { ...call, input: inputsOf(call, scope, translate) as CallData["input"] };

}
/** The api call a bound spec call becomes: `map` is the envelope override the wire calls `response`. */
export function targetOf ( call: CallData, input: Record<string, unknown> = call.input ?? {} ): Target {

    return { method: call.method, path: call.path, input, ...(call.cache === undefined ? {} : { cache: call.cache }), ...(call.map ? { response: call.map } : {}) };

}
