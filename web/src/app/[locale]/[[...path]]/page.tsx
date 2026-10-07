import type { Route } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { cache, Fragment } from "react";
import { readContent, siteSettings } from "@/api/server";
import { getLocale } from "@/lib/providers/intl-server";
import { pageSeo } from "@/lib/seo";
import { routing } from "@/lib/spec/config";
import { screenAt } from "@/lib/spec/server";
import { inline } from "@/lib/std/json";
import { localePath } from "@/lib/std/locale";
import { PageProvider } from "./provider";
import { type Context, Render } from "./render";

type Query = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ path?: string[] }>; searchParams: Promise<Query>; };

const resolveScreen = cache(async ( path: string ) => {

    const locale = await getLocale();
    const screen = screenAt(path ? path.split("/") : []);

    if ( !screen ) notFound();
    return { screen, locale };

});

function address ( path: string, query: Query ): Route {

    const pairs = Object.entries(query).flatMap(( [key, value] ) => [value ?? []].flat().map(( item ) => [key, item]));
    const search = new URLSearchParams(pairs);

    return (search.size ? `${path}?${search}` : path) as Route;

}
export default async function Page ({ params, searchParams }: Props) {

    const { screen, locale } = await resolveScreen((await params).path?.join("/") ?? "");
    const query = await searchParams;
    const [request, seo, content, settings] = await Promise.all([headers(), pageSeo(screen, locale, query), readContent(), siteSettings()]);
    const nonce = request.get("x-nonce") ?? "";

    if ( seo.redirect ) permanentRedirect(address(localePath(locale, seo.redirect, routing), query));

    const context: Context = { locale, path: screen.path, sources: screen.sources, scope: { params: screen.parameters, query, site: { content, settings } } };

    return (

        <Fragment key={screen.path}>

            <PageProvider access={screen.access} redirect={screen.redirect} state={screen.state ?? {}} watch={screen.watch ?? []} locale={locale}>

                {screen.layout.map(( node ) => <Render key={node.id} node={node} context={context} />)}

            </PageProvider>

            {
                seo.structuredData ? (
                    <script nonce={nonce} type="application/ld+json">{inline(seo.structuredData)}</script>
                ) : null
            }

        </Fragment>

    );

}
export async function generateMetadata ({ params, searchParams }: Props) {

    const { screen, locale } = await resolveScreen((await params).path?.join("/") ?? "");

    return (await pageSeo(screen, locale, await searchParams)).metadata;

}
