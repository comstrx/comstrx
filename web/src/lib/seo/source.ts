import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/api/error";
import { readPageSeo, readSource } from "@/api/server";
import type { ResourceData, SitemapKind } from "@/api/system";
import type { Locale } from "@/lib/spec/languages";
import { inputsOf, isReference } from "@/lib/spec/runtime";
import { config, screens } from "@/lib/spec/server";
import type { CallData, CompiledScreen } from "@/lib/spec/shapes";
import { includes, isRecord } from "@/lib/std/object";
import { entityParam, fillPattern, patternKeys } from "@/lib/std/route";
import { plainText } from "@/lib/std/text";
import { webUrl } from "@/lib/std/url";

export type Seo = ResourceData<"seo">;
export type Page = CompiledScreen & { pattern?: string; parameters?: Record<string, string> };
export type Source = { data: Seo; item?: Record<string, unknown>; path?: string; locales?: readonly string[] | null };

type Entity = {
    id?: unknown;
    slug?: unknown;
    type?: unknown;
    locales?: unknown;
    name?: unknown;
    title?: unknown;
    description?: unknown;
    content?: unknown;
    overview?: unknown;
    image?: unknown;
    image_width?: unknown;
    image_height?: unknown;
    image_alt?: unknown;
    attachments?: unknown;
    created_at?: unknown;
    updated_at?: unknown;
};
type Query = Record<string, string | string[] | undefined>;

function summary ( value: unknown ): string | null {

    return plainText(str(value)).slice(0, 300) || null;

}
function str ( value: unknown ): string | null {

    return typeof value === "string" ? value : null;

}
function num ( value: unknown ): number | null {

    return typeof value === "number" && Number.isFinite(value) ? value : null;

}
function strings ( value: unknown ): string[] | null {

    return Array.isArray(value) && value.every(( item ) => typeof item === "string") ? value : null;

}
function written ( data: Seo, locale: Locale ): Seo {

    if ( !data.locales || includes(data.locales, locale) ) return data;

    return { ...data, title: null, description: null, keywords: null, image_alt: null };

}
async function remote ( page: Page, locale: Locale ): Promise<Seo> {

    const mode = page.seo?.remote ?? "optional";
    const fallback = config.contract.values.seo;

    if ( mode === "none" || !config.contract.features.seo?.read?.enabled ) return fallback;

    try {

        return written(await readPageSeo(page.id), locale);

    }
    catch ( error ) {

        if ( mode === "required" ) throw error;

        return fallback;

    }

}
/** The read the screen names as its seo zone: the entity the crawler, canonical and feed describe. */
function sourceOf ( page: CompiledScreen ): CallData | undefined {

    return page.seo?.zone ? page.sources[page.seo.zone]?.read : undefined;

}
export const pageData = cache(async ( page: Page, query: Query = {} ): Promise<Record<string, unknown> | undefined> => {

    const read = sourceOf(page);

    if ( !read ) return undefined;

    const scope = { params: page.parameters ?? {}, query, site: { content: config.content, settings: config.settings } };

    try {

        const result = await readSource(read, inputsOf(read, scope, ( key ) => key));

        return isRecord(result.resource) ? result.resource : undefined;

    }
    catch ( error ) {

        if ( error instanceof ApiError && (error.status === 404 || error.kind === "input") ) notFound();

        throw error;

    }

});

function cover ( item: Entity ): string | undefined {

    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    const first = attachments.find(( file ) => isRecord(file) && file.type === "image");

    return isRecord(first) ? str(first.url) ?? undefined : undefined;

}
function pictured ( data: Seo, item: Entity ): Partial<Seo> {

    const url = webUrl(str(item.image) || cover(item));

    if ( !url ) return {};

    return {
        image: url,
        image_width: num(item.image_width),
        image_height: num(item.image_height),
        image_alt: str(item.image_alt) || plainText(str(item.title) || str(item.name)) || data.image_alt,
    };

}
function described ( data: Seo, item: Entity, article: boolean ): Seo {

    return {
        ...data,
        ...pictured(data, item),
        title: plainText(str(item.title) || str(item.name)) || data.title,
        description: summary(item.description || item.content || item.overview) ?? data.description,
        og_type: article ? "article" : data.og_type,
        published_at: article ? str(item.created_at) ?? data.published_at : data.published_at,
        modified_at: str(item.updated_at) ?? data.modified_at,
    };

}
function parameterOf ( page: CompiledScreen ): string | undefined {

    const keys = patternKeys(page.path);
    const [key] = keys;
    const read = sourceOf(page);
    const bound = key ? read?.input?.[key] : undefined;
    const numeric = bound === undefined || (isReference(bound) && bound.as === "id");

    return keys.length === 1 && read && numeric ? key : undefined;

}
export function entityPage ( kind: SitemapKind, type: unknown ): CompiledScreen | undefined {

    const candidates = screens.filter(( page ) => page.feed === kind && parameterOf(page) !== undefined);

    return candidates.find(( page ) => includes(page.types ?? [], type)) ?? candidates.find(( page ) => !page.types);

}
export function entityPath ( page: CompiledScreen, item: { id: number; slug?: string | null } ): string | undefined {

    const parameter = parameterOf(page);

    return parameter ? fillPattern(page.path, { [parameter]: entityParam(item.id, item.slug) }) : undefined;

}
function canonical ( page: Page, item: Entity ): string | undefined {

    const id = num(item.id);
    const slug = str(item.slug);

    if ( id === null ) return undefined;

    const home = page.feed ? entityPage(page.feed, item.type) : undefined;
    const parameter = parameterOf(page);

    if ( home ) return entityPath(home, { id, slug });

    return parameter ? fillPattern(page.pattern ?? page.path, { ...page.parameters, [parameter]: entityParam(id, slug) }) : undefined;

}
export async function source ( page: Page, locale: Locale, query: Query = {} ): Promise<Source> {

    const [data, item] = await Promise.all([remote(page, locale), pageData(page, query)]);

    if ( !item ) return { data };

    return {
        data: described(data, item, !!page.article),
        item,
        path: canonical(page, item),
        locales: strings(item.locales),
    };

}
