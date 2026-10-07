import { apiInputShape, apiShape, type ContractOverrides, liveTopics, overridesShape } from "../../api/contract.ts";
import { currency, resourceShapes, sitemapKinds } from "../../api/system.ts";
import { contractShape, type Method, methods } from "../../api/wire.ts";
import { z } from "../providers/schema.ts";
import { isTimeZone } from "../std/locale.ts";
import { isOrigin } from "../std/url.ts";
import { key, path, specText, text } from "./fields.ts";
import { supportedLocales } from "./languages.ts";

const siteUrl = text.refine(isOrigin, "Expected an HTTP(S) origin without credentials, path, query or fragment.");
const prefix = z.string().regex(/^(?:[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*)?$/);
const connection = apiInputShape.shape.connections.valueType;
const brandImage = z.string().regex(/^\/assets\/images\/brand\/[a-zA-Z0-9/_-]+\.(?:png|webp|jpg|jpeg|svg|avif)$/);
const color = z.string().regex(/^#[a-fA-F0-9]{6}$/);
const fontFile = z.string().regex(/^[a-zA-Z0-9_-]+\.(?:woff2|woff|ttf|otf)$/);
const fontFace = z.strictObject({ file: fontFile, weight: z.string().regex(/^[1-9]00(?: [1-9]00)?$/) });
const locale = z.enum(supportedLocales);
const preferences = resourceShapes.settings.shape;
const theme = preferences.theme.unwrap();
const palette = z.strictObject({ background: color, foreground: color, surface: color, muted: color, line: color, focus: color, primary: color, accent: color });

export const fontsShape = z.partialRecord(locale, z.union([fontFile, z.array(fontFace).min(1).max(10)]));

export const contentShape = resourceShapes.content.extend({
    url: siteUrl.nullable().default(null),
    logo: brandImage.nullable().default(null),
    logo_dark: brandImage.nullable().default(null),
    icon: brandImage.nullable().default(null),
    apple_icon: brandImage.nullable().default(null),
    seo: resourceShapes.seo.extend({ indexable: z.boolean().default(false) }).prefault({}),
});
export const contentBlocks = {
    infos: { name: true, tagline: true, description: true, copyright: true, header_notice: true, page_title: true, page_description: true, page_body: true },
    urls: { url: true, map_url: true },
    logos: { logo: true, logo_dark: true, logo_alt: true, logo_width: true, logo_height: true, icon: true, apple_icon: true },
    address: { address_line1: true, address_line2: true, city: true, region: true, country: true, country_code: true, postal_code: true },
    contacts: { email: true, phone: true, whatsapp: true, hours: true, contacts: true, socials: true },
    links: { header_links: true, links: true, link_groups: true, social_links: true },
} as const;

const contentsShape = z.strictObject({
    infos: contentShape.pick(contentBlocks.infos).partial().optional(),
    urls: contentShape.pick(contentBlocks.urls).partial().optional(),
    logos: contentShape.pick(contentBlocks.logos).partial().optional(),
    address: contentShape.pick(contentBlocks.address).partial().optional(),
    contacts: contentShape.pick(contentBlocks.contacts).partial().optional(),
    links: contentShape.pick(contentBlocks.links).partial().optional(),
    seo: contentShape.shape.seo.unwrap().partial().optional(),
});
export const settingsShape = z.strictObject({
    locale: z.strictObject({
        default: locale,
        enabled: z.array(locale).min(1),
        timeZone: text.refine(isTimeZone, "Unknown time zone."),
    }),
    currency: z.strictObject({ default: currency, enabled: z.array(currency).min(1) }),
    theme: z.strictObject({ default: theme, enabled: z.array(theme).min(1) }),
    motion: preferences.motion.unwrap(),
    density: preferences.density.unwrap(),
    maintenance: preferences.maintenance.unwrap(),
    maintenanceMessage: preferences.maintenance_message.unwrap(),
    fonts: fontsShape,
    mediaOrigins: z.array(siteUrl).max(20),
    frameOrigins: z.array(siteUrl).max(20),
});
export const themeShape = z.strictObject({
    colors: z.strictObject({ light: palette, dark: palette }),
});
export const configShape = z.strictObject({
    content: contentShape,
    settings: settingsShape,
    theme: themeShape,
    api: apiShape,
    contract: contractShape,
});
/** Scope roots a reference may start from; any other root names a source (a named read) of the screen. */
export const roots = ["params", "query", "state", "session", "item", "form", "event", "result", "site"] as const;

const scalar = z.union([z.string(), z.number(), z.boolean()]);
const name = z.string().regex(/^[a-z][a-zA-Z0-9_-]*$/);
const stateKey = z.string().regex(/^[a-z][a-zA-Z0-9_]*$/);
const field = z.string().regex(/^[a-zA-Z0-9_$-]+(?:\.[a-zA-Z0-9_-]+)*$/);
const reference = z.strictObject({
    from: z.string().regex(/^[a-z][a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9_]+)*$/),
    as: z.enum(["id", "number", "boolean", "date", "text"]).optional(),
});
const value = z.union([scalar, z.null(), specText, reference]);
const condition: z.ZodType<ConditionOutput, ConditionInput> = z.lazy(() => z.union([
    z.strictObject({ is: value }),
    z.strictObject({ not: value }),
    z.strictObject({ eq: z.tuple([value, value]) }),
    z.strictObject({ auth: z.boolean() }),
    z.strictObject({ all: z.array(condition).min(1) }),
    z.strictObject({ any: z.array(condition).min(1) }),
]));
const mapping = z.strictObject({ data: field.optional(), fields: z.record(name, field).optional() });
const call = z.strictObject({
    method: z.enum(methods),
    path: z.string().min(1).max(500).regex(/^[a-zA-Z0-9_{}/.-]+$/),
    input: z.record(name, value).optional(),
    cache: z.number().int().min(0).max(86400).optional(),
    map: mapping.optional(),
    every: z.number().int().min(1).max(3600).optional(),
    live: z.enum(liveTopics).optional(),
});
const effect = z.union([
    z.strictObject({ set: stateKey, value }),
    z.strictObject({ toggle: stateKey }),
    z.strictObject({ call }),
    z.strictObject({ go: value }),
    z.strictObject({ open: name }),
    z.strictObject({ close: name }),
    z.strictObject({ refresh: name }),
    z.strictObject({ reset: name }),
    z.strictObject({ session: value.nullable() }),
    z.strictObject({ emit: name, payload: value.optional() }),
]);
const effects = z.array(effect).min(1).max(20);
const watch = z.strictObject({ on: z.string().regex(/^[a-z][a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9_]+)*$/), do: effects });
const nodeShape = z.object({
    is: name,
    id: key.optional(),
    name: name.optional(),
    when: condition.optional(),
    on: z.record(name, effects).optional(),
    read: call.optional(),
    items: value.optional(),
    watch: z.array(watch).max(20).optional(),
    props: z.record(z.string(), z.unknown()),
    slots: z.record(name, z.array(z.unknown()).max(200)).optional(),
});
const screenShape = z.strictObject({
    id: key,
    path,
    access: z.enum(["any", "guest", "user"]).optional(),
    redirect: path.optional(),
    feed: z.enum(sitemapKinds).optional(),
    types: z.array(key).min(1).max(50).optional(),
    state: z.record(stateKey, scalar.nullable()).optional(),
    title: specText,
    description: specText,
    indexable: z.boolean().optional(),
    seo: z.strictObject({
        zone: name.optional(),
        remote: z.enum(["required", "optional", "none"]).optional(),
        title: value.optional(),
        description: value.optional(),
        keywords: z.array(specText).max(30).optional(),
        canonical: path.optional(),
        image: value.optional(),
        imageAlt: value.optional(),
        author: specText.optional(),
        indexable: z.boolean().optional(),
        follow: z.boolean().optional(),
        twitterCard: z.enum(["summary", "summary_large_image"]).optional(),
    }).optional(),
    article: z.strictObject({
        publishedAt: z.iso.datetime({ offset: true }).optional(),
        modifiedAt: z.iso.datetime({ offset: true }).optional(),
        author: specText.optional(),
    }).optional(),
    watch: z.array(watch).max(20).optional(),
    layout: z.array(z.unknown()).max(200),
});
export const schemaShape = z.strictObject({
    screens: z.array(screenShape),
});

type ConditionInput = { is: ValueInput } | { not: ValueInput } | { eq: [ValueInput, ValueInput] } | { auth: boolean } | { all: ConditionInput[] } | { any: ConditionInput[] };
type ConditionOutput = { is: ValueOutput } | { not: ValueOutput } | { eq: [ValueOutput, ValueOutput] } | { auth: boolean } | { all: ConditionOutput[] } | { any: ConditionOutput[] };
type ValueInput = z.input<typeof value>;
type ValueOutput = z.output<typeof value>;

export type { Method };
export { call, condition, effect, effects, name, nodeShape, reference, screenShape, value, watch };
export const configInputShape = z.strictObject({
    contents: contentsShape,
    settings: settingsShape.partial().extend({
        locale: settingsShape.shape.locale.partial().optional(),
        currency: settingsShape.shape.currency.partial().optional(),
        theme: settingsShape.shape.theme.partial().optional(),
    }).default({}),
    themes: z.strictObject({
        colors: z.strictObject({ light: palette.partial().optional(), dark: palette.partial().optional() }).optional(),
    }).default({}),
    contracts: z.strictObject({
        urls: z.strictObject({
            production: siteUrl.nullable(),
            local: siteUrl.nullable(),
            browser: siteUrl.nullable().default(null),
        }),
        options: connection.omit({ baseUrl: true, browserBaseUrl: true, development: true }).extend({
            prefix: prefix.default(""),
            spec: apiInputShape.shape.context.shape.spec,
            authCookie: apiInputShape.shape.context.shape.authCookie,
            proxies: apiInputShape.shape.context.shape.proxies,
            execution: overridesShape.shape.execution,
            encoding: overridesShape.shape.encoding,
            cache: overridesShape.shape.cache,
        }),
        request: overridesShape.shape.request,
        response: overridesShape.shape.response,
        realtime: apiInputShape.shape.realtime,
    }),
    features: overridesShape.shape.features,
});

type Input = z.input<typeof configInputShape>;
type Wire = Omit<ContractOverrides, "features" | "connection">;

export type SiteConfig = Omit<Input, "contracts" | "features"> & {
    contracts: Omit<Input["contracts"], "request" | "response"> & Pick<Wire, "request" | "response">;
    features?: ContractOverrides["features"];
};
export type CompiledConfig = z.infer<typeof configShape>;
export type SiteSchema = z.output<typeof schemaShape>;
export type ScreenInput = z.input<typeof screenShape>;
export type Screen = z.output<typeof screenShape>;
export type CallData = z.output<typeof call>;
export type Mapping = z.output<typeof mapping>;
export type Effect = z.output<typeof effect>;
export type Condition = ConditionOutput;
export type Reference = z.output<typeof reference>;
export type Value = ValueOutput;
export type RawNode = z.output<typeof nodeShape>;
export type Watch = z.output<typeof watch>;

/** A named read of the screen: `client` when only the browser can resolve it, `uses` the sources its inputs need first. */
export type Source = { read: CallData; client: boolean; uses: string[] };
export type CompiledNode = {
    is: string;
    id: string;
    name?: string;
    client: boolean;
    primed: boolean;
    uses: string[];
    when?: Condition;
    on?: Record<string, Effect[]>;
    read?: CallData;
    items?: Value;
    watch?: Watch[];
    props: Record<string, unknown>;
    raw: readonly string[];
    slots: Record<string, CompiledNode[]>;
    each: readonly string[];
};
export type CompiledScreen = Omit<Screen, "layout"> & { layout: CompiledNode[]; client: boolean; kinds: string[]; sources: Record<string, Source> };
export type Compiled = { screens: CompiledScreen[]; kinds: string[] };
