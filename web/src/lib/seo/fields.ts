import "server-only";

import type { ResourceData } from "@/api/system";
import { routing } from "@/lib/spec/config";
import type { Locale } from "@/lib/spec/languages";
import { resolve, textOf } from "@/lib/spec/runtime";
import { config, indexable as siteIndexable, text } from "@/lib/spec/server";
import type { Value } from "@/lib/spec/shapes";
import type { Json } from "@/lib/std/json";
import { localePath } from "@/lib/std/locale";
import { present } from "@/lib/std/object";
import { absolute, absoluteHref } from "@/lib/std/url";
import { isProduct, productEntity } from "./product";
import type { Page, Seo, Source } from "./source";

export type Site = { origin: string; locales: readonly Locale[]; content: ResourceData<"content"> };
export type Image = { url: string; alt: string; width?: number; height?: number };
export type Fields = {
    site: Site;
    locale: Locale;
    locales: readonly Locale[];
    data: Seo;
    entity: Json;
    path: string;
    url: string;
    alternates: Record<string, string>;
    title: string;
    description: string;
    keywords?: string[];
    indexable: boolean;
    follow: boolean;
    authors?: { name: string; url?: string }[];
    publishedAt?: string;
    modifiedAt?: string;
    article: boolean;
    images?: Image[];
    card: "summary" | "summary_large_image";
};

function declared ( value: Value | undefined, page: Page, locale: Locale, source: Source ): string | undefined {

    const zone = page.seo?.zone;
    const scope = { params: page.parameters ?? {}, site: { content: config.content, settings: config.settings }, ...(zone ? { [zone]: source.item } : {}) };
    const found = textOf(resolve(value, scope, ( key ) => text({ key }, locale)));

    return found || undefined;

}
function home ( locales: readonly Locale[], locale: Locale ): Locale {

    if ( locales.includes(locale) ) return locale;

    return locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0] ?? locale;

}
function picture ( data: Seo, site: Site, alt: string, chosen: string | undefined ): Image[] | undefined {

    const sized = data.image_width && data.image_height ? { width: data.image_width, height: data.image_height } : {};

    if ( data.image ) return [{ url: data.image, alt, ...sized }];

    const image = chosen ?? site.content.seo.image;

    return image ? [{ url: image, alt }] : undefined;

}
function authors ( data: Seo, page: Page, locale: Locale ): Fields["authors"] {

    const declared = page.seo?.author ?? page.article?.author;
    const author = data.author ?? (declared ? text(declared, locale) : undefined);

    if ( data.authors.length ) return data.authors.map(( value ) => present(value));

    return author ? [{ name: author }] : undefined;

}
export function images ( values: Seo["og_images"] ): Image[] {

    return values.map(( value ) => present(value));

}
export function writtenLocales ( site: Site, languages: readonly string[] | null | undefined ): Locale[] {

    const found = languages ? site.locales.filter(( locale ) => languages.includes(locale)) : [];

    return found.length ? found : [...site.locales];

}
export function pageUrl ( site: Site, locale: string, path: string ): string {

    return absolute(site.origin, localePath(locale, path, routing));

}
export function localeAlternates (
    site: Site,
    locales: readonly Locale[],
    path: string,
    listed: Seo["alternates"] = [],
): Record<string, string> {

    const own = locales.length > 1 ? locales.map(( locale ) => [locale, pageUrl(site, locale, path)]) : [];
    const fallback = own.length ? [["x-default", pageUrl(site, home(locales, routing.defaultLocale), path)]] : [];

    return Object.fromEntries([
        ...own,
        ...fallback,
        ...listed.map(( item ) => [item.language, absoluteHref(site.origin, item.href)]),
    ]);

}
export function resolveFields ( page: Page, locale: Locale, site: Site, source: Source ): Fields {

    const { data, item } = source;
    const chosen = page.seo;
    const path = source.path ?? data.canonical ?? chosen?.canonical ?? page.path;
    const locales = writtenLocales(site, source.locales);
    const url = pageUrl(site, home(locales, locale), path);
    const imageAlt = data.image_alt ?? declared(chosen?.imageAlt, page, locale, source) ?? site.content.name;
    const listed = page.indexable !== false && chosen?.indexable !== false && data.indexable !== false;
    const indexable = siteIndexable && site.content.seo.indexable !== false && listed;

    return {
        site,
        locale,
        locales,
        data,
        entity: isProduct(item) ? productEntity(item, url) : null,
        path,
        url,
        alternates: localeAlternates(site, locales, path, data.alternates),
        title: data.title ?? declared(chosen?.title, page, locale, source) ?? text(page.title, locale),
        description: data.description ?? declared(chosen?.description, page, locale, source) ?? text(page.description, locale),
        keywords: data.keywords ?? chosen?.keywords?.map(( value ) => text(value, locale)),
        indexable,
        follow: chosen?.follow !== false && data.follow !== false && indexable,
        authors: authors(data, page, locale),
        publishedAt: data.published_at ?? page.article?.publishedAt,
        modifiedAt: data.modified_at ?? page.article?.modifiedAt,
        article: data.og_type === "article" || (data.og_type === null && !!page.article),
        images: data.og_images.length ? images(data.og_images) : picture(data, site, imageAlt, declared(chosen?.image, page, locale, source)),
        card: data.twitter_card ?? chosen?.twitterCard ?? "summary_large_image",
    };

}
