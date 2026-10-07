import { resolveApi } from "../../api/contract.ts";
import { resourceShapes } from "../../api/system.ts";
import type { z } from "../providers/schema.ts";
import { type Messages, messageAt } from "../std/messages.ts";
import { compact, isRecord } from "../std/object.ts";
import { patternKeys, templateKeys } from "../std/route.ts";
import { settingsDefaults, themeDefaults } from "./defaults.ts";
import { isSpecKey } from "./fields.ts";
import type { Catalogue, Kind } from "./kinds.ts";
import { type Locale, supportedLocales } from "./languages.ts";
import {
    type CallData, type Compiled, type CompiledConfig, type CompiledNode, type CompiledScreen, type Condition, configInputShape, configShape,
    type Effect, nodeShape, type Reference, roots, type Screen, type Source,schemaShape, 
} from "./shapes.ts";

type Input = z.output<typeof configInputShape>;
type Settings = ReturnType<typeof mergeSettings>;
type Contracts = Input["contracts"];
type Scope = { params: readonly string[]; state: readonly string[]; item: boolean; form: boolean; event: boolean; result: boolean; client: boolean };
type Names = { named: Map<string, string>; sources: Map<string, Source> };
type Env = Names & { kinds: Catalogue; screen: Screen; issues: string[]; used: Set<string> };
type Outcome = { node: CompiledNode; uses: Set<string> };

const reserved = new RegExp(`^/(?:api|_next|_not-found|_generated|assets|${supportedLocales.join("|")})(?:/|$)`);
const clientRoots = ["state", "session", "form", "event", "result"];
const placeholder = /\{([a-zA-Z0-9_.]+)\}/g;
const idle: CompiledNode = { is: "text", id: "", client: false, primed: false, uses: [], props: {}, raw: [], slots: {}, each: [] };

function translations ( value: unknown, locales: readonly Locale[], messages: Record<Locale, Messages>, path: string, issues: string[] ): void {

    if ( isSpecKey(value) ) {

        for ( const locale of locales ) {

            if ( messageAt(messages[locale], value.key) === undefined ) issues.push(`${path}: missing ${locale} message "${value.key}".`);

        }

        return;

    }
    if ( !value || typeof value !== "object" ) return;

    for ( const [key, child] of Object.entries(value) ) {

        translations(child, locales, messages, `${path}.${key}`, issues);

    }

}
function mergeSettings ( input: Input["settings"] ) {

    return {
        ...settingsDefaults, ...input,
        locale: { ...settingsDefaults.locale, ...input.locale },
        currency: { ...settingsDefaults.currency, ...input.currency },
        theme: { ...settingsDefaults.theme, ...input.theme },
        fonts: { ...settingsDefaults.fonts, ...input.fonts },
    };

}
function mergeTheme ( input: Input["themes"] ) {

    return {
        colors: {
            light: { ...themeDefaults.colors.light, ...input.colors?.light },
            dark: { ...themeDefaults.colors.dark, ...input.colors?.dark },
        },
    };

}
function settingsResource ( settings: Settings ) {

    return {
        language: settings.locale.default, languages: settings.locale.enabled, time_zone: settings.locale.timeZone,
        currency: settings.currency.default, currencies: settings.currency.enabled,
        theme: settings.theme.default, themes: settings.theme.enabled,
        motion: settings.motion, density: settings.density,
        maintenance: settings.maintenance, maintenance_message: settings.maintenanceMessage,
    };

}
function at ( origin: string | null, path: string ): string | null {

    return origin === null ? null : path ? `${origin}/${path}` : origin;

}
function connection ( { urls, options }: Contracts, path: string ) {

    const { browser, timeoutMs, retries, maxResponseBytes, credentials } = options;

    return {
        ...compact({ browser, timeoutMs, retries, maxResponseBytes, credentials }),
        baseUrl: at(urls.production, path),
        browserBaseUrl: at(urls.browser, path),
        development: { baseUrl: at(urls.local, path), browserBaseUrl: at(urls.browser, path) },
    };

}
function document ( { infos, urls, logos, address, contacts, links, seo = {} }: Input["contents"] ) {

    return { content: { ...infos, ...urls, ...logos, ...address, ...contacts, ...links }, seo };

}
function compileConfig ( input: Input ): CompiledConfig {

    const { contracts } = input;
    const { spec, authCookie, proxies, prefix, execution, encoding, cache } = contracts.options;
    const { seo, content } = document(input.contents);
    const settings = mergeSettings(input.settings);
    const seeds = { content, seo, settings: settingsResource(settings) };
    const api = {
        context: { spec, authCookie, proxies, currency: settings.currency.default },
        connections: { primary: connection(contracts, prefix), broadcast: connection(contracts, "") },
        realtime: contracts.realtime,
    };
    const overrides = { execution, encoding, cache, request: contracts.request, response: contracts.response, features: input.features };

    return configShape.parse({
        content: { ...content, seo }, settings, theme: mergeTheme(input.themes),
        ...resolveApi(api, compact(overrides), seeds),
    });

}
function choiceIssues ( { locale, currency, theme }: CompiledConfig["settings"] ): string[] {

    return Object.entries({ locale, currency, theme }).flatMap(( [name, choice] ) => [
        ...(new Set(choice.enabled).size !== choice.enabled.length ? [`settings.${name}.enabled contains duplicates.`] : []),
        ...(!choice.enabled.some(( value ) => value === choice.default) ? [`settings.${name}.default must be enabled.`] : []),
    ]);

}
function articleIssues ( screen: Screen ): string[] {

    const article = screen.article;

    if ( !article?.modifiedAt || !article.publishedAt || Date.parse(article.modifiedAt) >= Date.parse(article.publishedAt) ) return [];

    return [`${screen.path}: modifiedAt precedes publishedAt.`];

}
function screenIssues ( screens: readonly Screen[] ): string[] {

    const issues: string[] = [];
    const ids = new Set<string>();
    const paths = new Set<string>();

    for ( const screen of screens ) {

        if ( ids.has(screen.id) ) issues.push(`Duplicate screen id: ${screen.id}`);
        if ( paths.has(screen.path) ) issues.push(`Duplicate screen path: ${screen.path}`);
        if ( reserved.test(screen.path) ) issues.push(`Reserved screen path: ${screen.path}`);

        ids.add(screen.id);
        paths.add(screen.path);
        issues.push(...articleIssues(screen));

    }

    if ( screens.length && !paths.has("/") ) issues.push("schema.screens must declare the home path /.");

    return issues;

}

function isReference ( value: unknown ): value is Reference {

    return isRecord(value) && typeof value.from === "string";

}
function isKey ( value: unknown ): value is { key: string } {

    return isRecord(value) && typeof value.key === "string" && Object.keys(value).length === 1;

}
function rootOf ( reference: Reference ): string {

    return reference.from.split(".")[0] ?? "";

}
function refs ( value: unknown ): Reference[] {

    if ( isReference(value) ) return [value];
    if ( typeof value === "string" ) return [...value.matchAll(placeholder)].flatMap(( match ) => (match[1] === "query" ? [] : [{ from: match[1] ?? "" }]));
    if ( Array.isArray(value) ) return value.flatMap(refs);
    if ( isRecord(value) && !isKey(value) ) return Object.values(value).flatMap(refs);

    return [];

}
function conditionRefs ( condition: Condition | undefined ): Reference[] {

    if ( !condition ) return [];
    if ( "is" in condition ) return refs(condition.is);
    if ( "not" in condition ) return refs(condition.not);
    if ( "eq" in condition ) return condition.eq.flatMap(refs);
    if ( "all" in condition ) return condition.all.flatMap(conditionRefs);
    if ( "any" in condition ) return condition.any.flatMap(conditionRefs);

    return [];

}
function conditionLiterals ( condition: Condition | undefined ): string[] {

    if ( !condition ) return [];
    if ( "is" in condition ) return typeof condition.is === "string" ? [condition.is] : [];
    if ( "not" in condition ) return typeof condition.not === "string" ? [condition.not] : [];
    if ( "eq" in condition ) return condition.eq.filter(( side ) => typeof side === "string");
    if ( "all" in condition ) return condition.all.flatMap(conditionLiterals);
    if ( "any" in condition ) return condition.any.flatMap(conditionLiterals);

    return [];

}
function effectRefs ( effects: readonly Effect[] ): Reference[] {

    return effects.flatMap(( effect ) => {

        if ( "call" in effect ) return refs(Object.values(effect.call.input ?? {}));
        if ( "set" in effect ) return refs(effect.value);
        if ( "go" in effect ) return refs(effect.go);
        if ( "session" in effect ) return refs(effect.session);
        if ( "emit" in effect ) return refs(effect.payload);

        return [];

    });

}
function personal ( condition: Condition | undefined ): boolean {

    if ( !condition ) return false;
    if ( "auth" in condition ) return true;
    if ( "all" in condition ) return condition.all.some(personal);
    if ( "any" in condition ) return condition.any.some(personal);

    return false;

}
function clientBound ( env: Env, references: readonly Reference[] ): boolean {

    return references.some(( reference ) => clientRoots.includes(rootOf(reference)) || env.sources.get(rootOf(reference))?.client === true);

}
function sourcesOf ( env: Names, references: readonly Reference[] ): string[] {

    return references.map(rootOf).filter(( root ) => env.sources.has(root));

}
function siteKey ( resource: "content" | "settings", key: string | undefined ): boolean {

    return key === undefined || Object.hasOwn(resourceShapes[resource].shape, key);

}
function checkReference ( env: Env, scope: Scope, reference: Reference, where: string ): void {

    const [root = "", key = ""] = reference.from.split(".");
    const missing = ( what: string ) => env.issues.push(`${where}: ${reference.from} — ${what}.`);

    if ( root === "params" && !scope.params.includes(key) ) missing("the screen path has no such parameter");
    if ( root === "state" && !scope.state.includes(key) ) missing("the screen declares no such state");
    if ( root === "item" && !scope.item ) missing("no list provides items here");
    if ( root === "form" && !scope.form ) missing("no form provides values here");
    if ( root === "event" && !scope.event ) missing("only an event handler sees the event");
    if ( root === "result" && !scope.result ) missing("no call precedes this effect");
    if ( root === "site" && !["content", "settings"].includes(key) ) missing("site holds content and settings only");
    if ( root === "site" && (key === "content" || key === "settings") && !siteKey(key, reference.from.split(".")[2]) ) missing(`unknown site ${key} field`);
    if ( !roots.includes(root as typeof roots[number]) && !env.sources.has(root) ) missing(`no source named ${root}; name a read to provide it`);

}
function checkValues ( env: Env, scope: Scope, values: readonly unknown[], where: string ): Reference[] {

    const references = values.flatMap(refs);

    for ( const reference of references ) {

        checkReference(env, scope, reference, where);

    }

    return references;

}
function checkCondition ( env: Env, scope: Scope, condition: Condition | undefined, where: string ): Reference[] {

    const references = conditionRefs(condition);
    const quoted = conditionLiterals(condition).filter(( text ) => [...roots, ...env.sources.keys()].some(( root ) => text.startsWith(`${root}.`)));

    for ( const text of quoted ) env.issues.push(`${where}.when: "${text}" is a literal; bind it with from("${text}").`);
    for ( const reference of references ) checkReference(env, scope, reference, where);

    return references;

}
function checkCall ( env: Env, scope: Scope, call: CallData, where: string, read: boolean ): Reference[] {

    const params = templateKeys(call.path);
    const bound = Object.keys(call.input ?? {});
    const loose = params.filter(( key ) => !bound.includes(key) && !scope.params.includes(key));
    const kept = call.cache !== undefined || call.every !== undefined || call.live !== undefined;

    if ( read && call.method !== "GET" ) env.issues.push(`${where}: a read must be a GET.`);
    if ( !read && call.method === "GET" ) env.issues.push(`${where}: an action cannot be a GET.`);
    if ( !read && kept ) env.issues.push(`${where}: only reads cache, poll or listen.`);
    if ( loose.length ) env.issues.push(`${where}: path parameter {${loose.join("}, {")}} is not bound.`);

    return checkValues(env, scope, Object.values(call.input ?? {}), where);

}
function checkEffects ( env: Env, scope: Scope, effects: readonly Effect[], where: string ): void {

    const inner = { ...scope };

    effects.forEach(( effect, index ) => {

        const at = `${where}[${index}]`;

        if ( "call" in effect ) {

            checkCall(env, inner, effect.call, at, false);
            inner.result = true;

        }
        if ( ("set" in effect || "toggle" in effect) && !scope.state.includes("set" in effect ? effect.set : effect.toggle) ) env.issues.push(`${at}: the screen declares no such state.`);
        if ( "set" in effect ) checkValues(env, inner, [effect.value], at);
        if ( "go" in effect ) checkValues(env, inner, [effect.go], at);
        if ( "session" in effect ) checkValues(env, inner, [effect.session], at);
        if ( "emit" in effect ) checkValues(env, inner, [effect.payload], at);
        if ( ("open" in effect || "close" in effect) && !env.named.has("open" in effect ? effect.open : effect.close) ) env.issues.push(`${at}: nothing named to open or close.`);
        if ( "refresh" in effect && effect.refresh !== "page" && !env.sources.has(effect.refresh) ) env.issues.push(`${at}: no source named ${effect.refresh} to refresh.`);
        if ( "reset" in effect && env.named.get(effect.reset) !== "form" ) env.issues.push(`${at}: no form named ${effect.reset}.`);

    });

}
function checkWatch ( env: Env, scope: Scope, entries: readonly { on: string; do: Effect[] }[], where: string ): Reference[] {

    return entries.flatMap(( entry, index ) => {

        const at = `${where}.watch[${index}]`;

        checkReference(env, scope, { from: entry.on }, at);
        checkEffects(env, scope, entry.do, at);

        return [{ from: entry.on }, ...effectRefs(entry.do)];

    });

}
function literal ( value: unknown ): boolean {

    return !isReference(value) && !isKey(value) && refs(value).length === 0;

}
function checkProps ( env: Env, kind: Kind, props: Record<string, unknown>, where: string ): void {

    const shape = kind.props.shape as Record<string, z.ZodType>;
    const strangers = Object.keys(props).filter(( key ) => !Object.hasOwn(shape, key));

    if ( strangers.length ) env.issues.push(`${where}: ${kind.is} takes no ${strangers.join(", ")}.`);

    for ( const [key, schema] of Object.entries(shape) ) {

        const given = props[key];
        const parsed = given === undefined || !literal(given) ? schema.safeParse(given === undefined ? undefined : "x") : schema.safeParse(given);

        if ( given === undefined && !schema.safeParse(undefined).success ) env.issues.push(`${where}: ${kind.is} needs ${key}.`);
        if ( given !== undefined && literal(given) && !parsed.success ) env.issues.push(`${where}: ${key} ${parsed.error.issues[0]?.message ?? "is invalid"}.`);

    }

}
function slotScope ( scope: Scope, kind: Kind, slot: string ): Scope {

    return { ...scope, item: scope.item || kind.slots[slot] === "each", form: scope.form || kind.is === "form" };

}
function compileSlots ( env: Env, scope: Scope, kind: Kind, slots: Record<string, unknown[]>, where: string ): { slots: Record<string, CompiledNode[]>; uses: Set<string> } {

    const uses = new Set<string>();
    const entries = Object.entries(slots).map(( [slot, children] ) => {

        if ( !Object.hasOwn(kind.slots, slot) ) env.issues.push(`${where}: ${kind.is} has no slot ${slot}.`);

        return [slot, children.map(( child, index ) => {

            const outcome = compileNode(env, slotScope(scope, kind, slot), child, `${where}.${slot}.${index}`);

            for ( const name of outcome.uses ) uses.add(name);

            return outcome.node;

        })];

    });

    return { slots: Object.fromEntries(entries), uses };

}
function compileNode ( env: Env, scope: Scope, raw: unknown, where: string ): Outcome {

    const parsed = nodeShape.safeParse(raw);
    const kind = parsed.success ? env.kinds[parsed.data.is] : undefined;

    if ( !parsed.success || !kind ) {

        env.issues.push(`${where}: ${parsed.success ? `unknown kind ${parsed.data.is}` : parsed.error.issues.map(( issue ) => `${issue.path.join(".") || "node"} ${issue.message}`).join("; ")}`);

        return { node: { ...idle, id: where }, uses: new Set() };

    }

    const node = parsed.data;
    const resolved = Object.entries(node.props).filter(( [key] ) => !kind.raw.includes(key)).map(( [, value] ) => value);
    const kept = Object.entries(node.props).filter(( [key] ) => kind.raw.includes(key)).map(( [, value] ) => value);
    const reading = node.read ? checkCall(env, scope, node.read, `${where}.read`, true) : checkValues(env, scope, [node.items], `${where}.items`);
    const own = [...checkValues(env, scope, resolved, where), ...checkCondition(env, scope, node.when, where)];
    const bound = clientBound(env, reading);
    const client = scope.client || kind.client || bound || clientBound(env, own) || personal(node.when) || node.on !== undefined || node.watch !== undefined;
    const handled = Object.entries(node.on ?? {}).flatMap(( [event, effects] ) => {

        if ( !kind.loose && !Object.hasOwn(kind.events, event) ) env.issues.push(`${where}: ${kind.is} emits no ${event}.`);

        checkEffects(env, { ...scope, event: true }, effects, `${where}.on.${event}`);

        return effectRefs(effects);

    });
    const watched = checkWatch(env, scope, node.watch ?? [], where);
    const source = node.name && node.read ? env.sources.get(node.name) : undefined;

    checkProps(env, kind, node.props, where);
    env.used.add(kind.is);

    if ( source ) source.client = client;

    const children = compileSlots(env, { ...scope, client }, kind, node.slots ?? {}, where);
    const uses = new Set([...sourcesOf(env, [...reading, ...own, ...kept.flatMap(refs), ...handled, ...watched]), ...children.uses]);

    if ( source && node.name ) uses.delete(node.name);

    return {
        uses,
        node: {
            is: node.is,
            id: node.id ?? where,
            ...(node.name ? { name: node.name } : {}),
            client,
            primed: client && node.read !== undefined && !node.when && !bound,
            uses: [...uses],
            ...(node.when ? { when: node.when } : {}),
            ...(node.on ? { on: node.on } : {}),
            ...(node.read ? { read: node.read } : {}),
            ...(node.items !== undefined ? { items: node.items } : {}),
            ...(node.watch ? { watch: node.watch } : {}),
            props: node.props,
            raw: kind.raw,
            slots: children.slots,
            each: Object.entries(kind.slots).filter(( [, mode] ) => mode === "each").map(( [slot] ) => slot),
        },
    };

}
function cycle ( sources: Names["sources"], name: string, trail: readonly string[] ): string[] | undefined {

    if ( trail.includes(name) ) return [...trail, name];

    for ( const next of sources.get(name)?.uses ?? [] ) {

        const found = cycle(sources, next, [...trail, name]);

        if ( found ) return found;

    }

    return undefined;

}
function collect ( screen: Screen, issues: string[] ): Names {

    const named = new Map<string, string>();
    const sources = new Map<string, Source>();
    const visit = ( tree: readonly unknown[] ): void => {

        for ( const child of tree ) {

            if ( !isRecord(child) ) continue;
            if ( typeof child.name === "string" && typeof child.is === "string" ) {

                if ( named.has(child.name) ) issues.push(`${screen.id}: the name ${child.name} is used twice.`);
                if ( roots.includes(child.name as typeof roots[number]) ) issues.push(`${screen.id}: ${child.name} is a scope root, not a name.`);

                named.set(child.name, child.is);

                if ( isRecord(child.read) ) sources.set(child.name, { read: child.read as CallData, client: false, uses: [] });

            }
            if ( isRecord(child.slots) ) Object.values(child.slots).forEach(( slot ) => { if ( Array.isArray(slot) ) visit(slot); });

        }

    };

    visit(screen.layout);

    for ( const source of sources.values() ) {

        source.uses = [...new Set(refs(Object.values(isRecord(source.read.input) ? source.read.input : {})).map(rootOf).filter(( root ) => sources.has(root)))];

    }
    const circles = new Set<string>();

    for ( const name of sources.keys() ) {

        const found = cycle(sources, name, []);
        const members = found ? [...new Set(found)].sort().join(",") : "";

        if ( found && !circles.has(members) ) issues.push(`${screen.id}: sources read each other in a circle: ${found.join(" → ")}.`);
        if ( found ) circles.add(members);

    }

    return { named, sources };

}
function checkSeo ( env: Env, scope: Scope, params: readonly string[] ): void {

    const { screen } = env;
    const { zone, ...declared } = screen.seo ?? {};
    const references = Object.values(declared).flatMap(refs);

    if ( zone && !env.sources.has(zone) ) env.issues.push(`${screen.id}.seo: no source named ${zone}.`);
    if ( zone && env.sources.get(zone)?.client ) env.issues.push(`${screen.id}.seo: ${zone} needs the browser; the crawler cannot read it.`);
    if ( zone && env.sources.get(zone)?.uses.length ) env.issues.push(`${screen.id}.seo: ${zone} must read from params and query only.`);
    if ( screen.feed && (!zone || params.length !== 1) ) env.issues.push(`${screen.id}: a feed screen names its seo zone and has exactly one path parameter.`);

    for ( const reference of references ) {

        const root = rootOf(reference);

        if ( !["params", "site"].includes(root) && root !== zone ) env.issues.push(`${screen.id}.seo: ${reference.from} — seo sees params, site and its zone only.`);
        else checkReference(env, scope, reference, `${screen.id}.seo`);

    }

}
function pass ( screen: Screen, kinds: Catalogue, names: Names, client: ReadonlySet<string> ): { env: Env; layout: CompiledNode[] } {

    const params = patternKeys(screen.path);
    const gated = screen.access === "user" || screen.access === "guest";
    const sources = new Map([...names.sources].map(( [name, source] ) => [name, { ...source, client: client.has(name) }]));
    const env: Env = { kinds, screen, issues: [], used: new Set(), named: names.named, sources };
    const scope: Scope = { params, state: Object.keys(screen.state ?? {}), item: false, form: false, event: false, result: false, client: gated };
    const layout = screen.layout.map(( child, position ) => compileNode(env, scope, child, `${screen.id}.${position}`).node);

    checkWatch(env, scope, screen.watch ?? [], screen.id);
    checkSeo(env, scope, params);

    return { env, layout };

}
function compileScreen ( screen: Screen, kinds: Catalogue, issues: string[] ): CompiledScreen {

    const names = collect(screen, issues);
    let client = new Set<string>();

    for ( ;; ) {

        const { env, layout } = pass(screen, kinds, names, client);
        const grown = new Set([...env.sources].filter(( [, source] ) => source.client).map(( [name] ) => name));

        if ( grown.size === client.size ) {

            issues.push(...env.issues);

            return { ...screen, layout, client: screen.access === "user" || screen.access === "guest", kinds: [...env.used].sort(), sources: Object.fromEntries(env.sources) };

        }

        client = grown;

    }

}
export function compileSchema ( screens: readonly Screen[], kinds: Catalogue ): Compiled & { issues: string[] } {

    const issues: string[] = [];
    const compiled = screens.map(( screen ) => compileScreen(screen, kinds, issues));

    return { screens: compiled, kinds: [...new Set(compiled.flatMap(( screen ) => screen.kinds))].sort(), issues };

}
export function validateSpec ( rawConfig: unknown, rawSchema: unknown, messages: Record<Locale, Messages>, kinds: Catalogue ): { config: CompiledConfig; schema: Compiled } {

    const config = compileConfig(configInputShape.parse(rawConfig));
    const declared = schemaShape.parse(rawSchema === undefined ? undefined : JSON.parse(JSON.stringify(rawSchema)));
    const compiled = compileSchema(declared.screens, kinds);
    const issues = [...choiceIssues(config.settings), ...screenIssues(declared.screens), ...compiled.issues];

    translations(compiled.screens, config.settings.locale.enabled, messages, "schema", issues);

    if ( issues.length ) throw new Error(issues.join("\n"));

    return { config, schema: { screens: compiled.screens, kinds: compiled.kinds } };

}
