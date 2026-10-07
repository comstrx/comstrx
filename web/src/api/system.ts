import { z } from "../lib/providers/schema.ts";
import { currencyCode } from "../lib/std/geo.ts";
import { isTimeZone } from "../lib/std/locale.ts";
import { templateKeys } from "../lib/std/route.ts";
import { isHref, webUrl } from "../lib/std/url.ts";
import type { Layer, Method } from "./wire.ts";

export const id = z.number().int().positive();
export const text = z.string().nullish();
export const count = z.number().nullish();
export const flag = z.boolean().nullish();
export const decimal = z.union([z.string(), z.number()]).nullish();
export const currency = z.string().regex(currencyCode);
export const channel = z.enum(["email", "sms", "whatsapp"]);
export const ack = z.object({ success: z.literal(true).default(true) });

const filter = z.union([z.string().max(500), z.number(), z.boolean(), z.array(z.union([z.string().max(500), z.number()])).max(100)]);
const key = z.string().regex(/^[a-z_]{1,60}$/);

export const page = {
    page: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(100).optional(),
};
export const list = {
    ...page,
    query: z.string().max(200).optional(),
    sort: key.optional(),
    filters: z.record(key, filter).optional(),
    ids: z.array(id).min(1).max(100).optional(),
    fields: z.array(key).min(1).max(50).optional(),
    facets: z.array(key).min(1).max(20).optional(),
    stats: z.array(key).min(1).max(20).optional(),
    view: z.enum(["full", "tiny"]).optional(),
};

export const resourceKeys = ["content", "settings", "seo", "policy"] as const;

export type Resource = typeof resourceKeys[number];

const line = z.string().max(10000).default("");
const nullableText = z.string().max(10000).nullable().default(null);
const href = z.string().max(2048).refine(isHref);
const image = z.string().max(2048).refine(( value ) => webUrl(value) !== undefined);
const nullableImage = image.nullable().default(null);
const size = z.number().int().positive().max(10000).nullable().default(null);
const pixels = z.number().int().positive().max(65535).nullable().default(null);
const link = z.object({ label: line, href, external: z.boolean().default(false) });
const links = z.array(link).max(100).default(() => []);
const handle = z.string().min(1).max(50);
const theme = z.enum(["light", "dark", "system"]);
const locale = z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
const timeZone = z.string().max(100).refine(isTimeZone);
const date = z.iso.datetime({ offset: true }).nullable().default(null);
const nullableBoolean = z.boolean().nullable().default(null);
const preview = z.number().int().min(-1).nullable().default(null);
const socialImage = z.object({ url: image, alt: line, width: size, height: size });
const socialImages = z.array(socialImage).max(10).default(() => []);
const author = z.object({ name: z.string().min(1).max(200), url: href.nullable().default(null) });
const local = z.string().regex(/^\/(?!\/)[^?#\\]*$/);
const mebibyte = 1024 * 1024;
const bytes = z.number().int().positive().max(1024 * mebibyte);
const quota = z.number().int().positive().max(100000);
const extension = z.string().regex(/^[a-z0-9]{1,10}$/);
const uploadPolicy = z.object({ max_bytes: bytes, max_count: quota });

export const resourceShapes = {
    content: z.strictObject({
        name: line,
        tagline: line,
        description: line,
        url: href.nullable().default(null),
        logo: nullableImage,
        logo_dark: nullableImage,
        logo_alt: line,
        logo_width: size,
        logo_height: size,
        icon: nullableImage,
        apple_icon: nullableImage,
        header_notice: line,
        header_links: links,
        copyright: line,
        links,
        link_groups: z.array(z.object({ title: line, links })).max(20).default(() => []),
        email: z.email().nullable().default(null),
        phone: nullableText,
        whatsapp: nullableText,
        address_line1: line,
        address_line2: line,
        city: line,
        region: line,
        country: line,
        country_code: line,
        postal_code: line,
        map_url: href.nullable().default(null),
        hours: z.array(z.string().max(200)).max(14).default(() => []),
        social_links: links,
        socials: z.array(z.object({ key: handle, url: href })).max(50).catch(() => []).default(() => []),
        contacts: z.array(z.object({ key: handle, value: z.string().min(1).max(500) })).max(50).catch(() => []).default(() => []),
        page_title: line,
        page_description: line,
        page_body: z.string().max(100000).default(""),
        seo: z.object({
            indexable: nullableBoolean,
            image: nullableImage,
            twitter_site: nullableText,
            verification: z.object({ google: nullableText, bing: nullableText, yandex: nullableText }).prefault({}),
        }).prefault({}),
    }),
    settings: z.strictObject({
        language: locale.default("en"),
        languages: z.array(locale).min(1).max(30).default(() => ["en"]),
        time_zone: timeZone.default("UTC"),
        currency: currency.default("USD"),
        currencies: z.array(currency).min(1).max(100).default(() => ["USD"]),
        theme: theme.default("system"),
        themes: z.array(theme).min(1).max(3).default(() => [...theme.options]),
        preferred_language: locale.nullable().default(null),
        preferred_currency: currency.nullable().default(null),
        preferred_theme: theme.nullable().default(null),
        preferred_time_zone: timeZone.nullable().default(null),
        motion: z.enum(["system", "reduced"]).default("system"),
        density: z.enum(["comfortable", "compact"]).default("comfortable"),
        maintenance: z.boolean().default(false),
        maintenance_message: line,
    }),
    seo: z.strictObject({
        title: nullableText,
        description: nullableText,
        keywords: z.array(z.string().max(100)).max(30).nullable().default(null),
        canonical: local.nullable().default(null),
        indexable: nullableBoolean,
        follow: nullableBoolean,
        image: nullableImage,
        image_alt: nullableText,
        image_width: pixels,
        image_height: pixels,
        locales: z.array(locale).max(30).nullable().default(null),
        author: nullableText,
        authors: z.array(author).max(20).default(() => []),
        creator: nullableText,
        publisher: nullableText,
        category: nullableText,
        published_at: date,
        modified_at: date,
        noarchive: nullableBoolean,
        nosnippet: nullableBoolean,
        noimageindex: nullableBoolean,
        notranslate: nullableBoolean,
        max_snippet: preview,
        max_video_preview: preview,
        max_image_preview: z.enum(["none", "standard", "large"]).nullable().default(null),
        unavailable_after: date,
        alternates: z.array(z.object({ language: locale.or(z.literal("x-default")), href: image })).max(30).default(() => []),
        og_type: z.enum(["website", "article"]).nullable().default(null),
        og_title: nullableText,
        og_description: nullableText,
        og_site_name: nullableText,
        og_locale: nullableText,
        og_images: socialImages,
        twitter_card: z.enum(["summary", "summary_large_image"]).nullable().default(null),
        twitter_site: nullableText,
        twitter_creator: nullableText,
        twitter_title: nullableText,
        twitter_description: nullableText,
        twitter_images: socialImages,
        article_section: nullableText,
        article_tags: z.array(z.string().max(100)).max(30).default(() => []),
        verification_google: nullableText,
        verification_bing: nullableText,
        verification_yandex: nullableText,
        structured_data: z.boolean().default(true),
        structured_type: z.enum(["WebPage", "AboutPage", "ContactPage", "ProfilePage", "BlogPosting"]).nullable().default(null),
        breadcrumbs: z.array(z.object({ name: z.string().min(1).max(200), path: local })).max(20).default(() => []),
    }),
    policy: z.strictObject({
        socket_scheme: z.enum(["http", "https"]).nullable().default(null),
        socket_host: z.string().regex(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/).nullable().default(null),
        socket_port: z.number().int().min(1).max(65535).nullable().default(null),
        socket_key: z.string().min(1).max(200).nullable().default(null),
        upload_max_bytes: bytes.default(2 * mebibyte),
        upload_max_count: quota.default(20),
        request_max_bytes: bytes.default(8 * mebibyte),
        upload_policies: z.record(z.string().regex(/^[a-z_]{1,40}$/), uploadPolicy).default(() => ({})),
        blocked_extensions: z.array(extension).max(200).default(() => []),
        identity_mime_types: z.array(extension).max(50).default(() => []),
        bulk_max_ids: quota.default(100),
        availability_horizon_days: quota.default(31),
        availability_ahead_days: quota.default(730),
        password_min: z.number().int().min(1).max(256).default(6),
        password_max: z.number().int().min(1).max(4096).default(255),
        password_lower: z.boolean().default(true),
        password_upper: z.boolean().default(true),
        password_digit: z.boolean().default(true),
        password_symbol: z.boolean().default(true),
    }),
};

export type ResourceData<R extends Resource> = z.infer<typeof resourceShapes[R]>;
export type ResourceValues = { [R in Resource]?: Partial<ResourceData<R>> };

export function resourceDefaults<R extends Resource> ( resource: R ): ResourceData<R> {

    return resourceShapes[resource].parse({}) as ResourceData<R>;

}
export function parseResource<R extends Resource> ( resource: R, value: unknown ): ResourceData<R> {

    return resourceShapes[resource].parse(value) as ResourceData<R>;

}

export type Endpoint<I extends z.ZodObject = z.ZodObject, O extends z.ZodType = z.ZodType, M extends boolean = boolean> = {
    method: Method;
    path: string;
    input: I;
    output: O;
    many: M;
    open?: boolean;
    local?: Resource;
    wire: Layer;
};

type Shape = z.ZodObject | z.ZodRawShape;
type Many<T extends z.ZodType = z.ZodType> = { many: T };
type Strict<S extends Shape> = S extends z.ZodObject ? S : S extends z.ZodRawShape ? z.ZodObject<S, z.core.$strict> : never;
type Item<O> = O extends Many<infer T> ? T : O extends z.ZodType ? O : never;
type Route<S extends Shape, O> = Endpoint<Strict<S>, Item<O>, O extends Many ? true : false>;

export const get = route("GET");
export const post = route("POST");
export const put = route("PUT");
export const del = route("DELETE");

function route ( method: Method ) {

    return <const S extends Shape, const O extends z.ZodType | Many> (
        path: string,
        input: S,
        output: O,
        wire: Layer = {},
    ): Route<S, O> => {

        const schema = (input instanceof z.ZodObject ? input : z.strictObject(input)) as Strict<S>;
        const missing = templateKeys(path).filter(( key ) => !Object.hasOwn(schema.shape, key));

        if ( missing.length ) throw new Error(`${method} ${path}: path parameters need inputs: ${missing.join(", ")}`);

        return {
            method,
            path,
            wire,
            input: schema,
            output: ("many" in output ? output.many : output) as Item<O>,
            many: ("many" in output) as O extends Many ? true : false,
        };

    };

}
export function many<T extends z.ZodType> ( item: T ): Many<T> {

    return { many: item };

}
export function document<R extends Resource> ( resource: R, path?: string, wire: Layer = {} ) {

    return {
        read: {
            ...get(path ?? "/", { path: z.string().min(1).max(200).optional() }, resourceShapes[resource], {
                execution: "server", enabled: path !== undefined, cache: 60, request: { fields: { path: null } }, ...wire, response: { empty: true, ...wire.response },
            }),
            local: resource,
        },
    };

}

export const sitemapKinds = ["catalogs", "blogs", "categories", "geos", "vendors"] as const;

export type SitemapKind = typeof sitemapKinds[number];
export type System = typeof system;

const localeRow = z.object({
    id: z.number(),
    code: text,
    iso: text,
    name: text,
    native: text,
    rtl: flag,
});
const rate = z.object({
    value: decimal,
    source: text,
    as_of: count,
    pinned: flag,
});
const currencyRow = z.object({
    id: z.number(),
    code: text,
    iso: text,
    name: text,
    native: text,
    symbol: text,
    exponent: count,
    active: flag,
    allow_display: flag,
    allow_authoring: flag,
    rate: rate.nullish(),
});
const row = z.object({
    id,
    slug: text,
    type: text,
    updated_at: text,
    image: text,
    locales: z.array(z.string().max(10)).max(30).nullish(),
});
const authorization = z.object({
    auth: z.string().min(1).max(1000),
    channel_data: z.string().max(50000).optional(),
    shared_secret: z.string().max(1000).optional(),
});
const socket = {
    socket_id: z.string().regex(/^\d+\.\d+$/),
    channel_name: z.string().regex(/^(?:private-|presence-)[a-zA-Z0-9_.-]{1,180}$/),
};

export const system = {
    content: document("content", "/content/site-info", {
        execution: "hybrid",
        response: {
            fields: {
                address_line1: "address",
                address_line2: "geo.address_2",
                city: "geo.city.name",
                country: "geo.country.name",
                country_code: "geo.country.code",
                postal_code: "zip_code",
            },
        },
    }),
    settings: document("settings", "/content/site-info", { execution: "hybrid", response: { fields: { time_zone: "timezone" } } }),
    seo: document("seo", "/content/seo/{path}", {
        response: { fields: { published_at: "created_at", modified_at: "updated_at" } },
    }),
    policy: document("policy", "/contract", {
        cache: 300,
        response: {
            fields: {
                socket_scheme: "channels.realtime.scheme",
                socket_host: "channels.realtime.host",
                socket_port: "channels.realtime.port",
                socket_key: "channels.realtime.key",
                upload_max_bytes: "uploads.max_bytes",
                upload_max_count: "uploads.policies.default.max_count",
                request_max_bytes: "limits.request_max_bytes",
                upload_policies: "uploads.policies",
                blocked_extensions: "uploads.blocked_extensions",
                identity_mime_types: "uploads.identity.mime_types",
                bulk_max_ids: "limits.bulk_max_ids",
                availability_horizon_days: "limits.availability_horizon_days",
                availability_ahead_days: "limits.availability_ahead_days",
                password_min: "password.min",
                password_max: "password.max",
                password_lower: "password.lower",
                password_upper: "password.upper",
                password_digit: "password.digit",
                password_symbol: "password.symbol",
            },
        },
    }),
    sitemap: {
        list: get("/content/sitemap", { kind: z.enum(sitemapKinds), page: z.number().int().positive().optional() }, many(row), { execution: "server", cache: 600 }),
    },
    locales: {
        list: get("/locales", list, many(localeRow), { cache: 300 }),
    },
    currencies: {
        list: get("/currencies", list, many(currencyRow), { cache: 300 }),
    },
    broadcast: {
        authorize: post("/broadcasting/auth", socket, authorization, { execution: "client", connection: "broadcast", response: { data: "$", success: null } }),
    },
};
