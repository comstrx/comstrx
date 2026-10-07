"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type TransitionStartFunction, useCallback, useEffect, useState, useTransition } from "react";
import { savePreferences } from "@/api/actions";
import type { ApiClient } from "@/api/client";
import { useApi } from "@/hooks/use-api";
import { useMounted } from "@/hooks/use-effects";
import { ignored } from "@/lib/observe/browser";
import { useLocale as useCurrentLocale } from "@/lib/providers/intl";
import { useTheme } from "@/lib/providers/theme";
import { useSite } from "@/lib/site/context";
import type { Preferences } from "@/lib/site/preferences";
import type { SiteSettings, Theme } from "@/lib/site/settings";
import { routing } from "@/lib/spec/config";
import { locate, onFirstGesture } from "@/lib/std/browser";
import { isCountry, type Point } from "@/lib/std/geo";
import { localePath, splitLocale } from "@/lib/std/locale";
import { choose, compact, includes, pathGet } from "@/lib/std/object";
import { useUi } from "@/stores/provider";
import type { SessionUser } from "@/stores/ui";

type Save<T> = ( next: T ) => Promise<void>;
type AccountChanges = { language?: string; currency?: string; theme?: Theme; country?: string; location?: Point };
type Local = {
    api: ApiClient;
    settings: SiteSettings;
    saved: Preferences;
    locale: string;
    currency: string;
    theme?: string;
    setTheme: ( theme: string ) => void;
    navigate: ( href: Route ) => void;
};

function localeHref ( locale: string ): Route {

    const { pathname, search, hash } = window.location;

    return `${localePath(locale, splitLocale(pathname, routing).path, routing)}${search}${hash}` as Route;

}
function commit<T extends string> ( next: T, save: Save<T>, setFailed: ( failed: boolean ) => void, start: TransitionStartFunction ): void {

    setFailed(false);

    start(async () => {

        try { await save(next); }
        catch { setFailed(true); }

    });

}
async function push ( api: ApiClient, { country, location, ...settings }: AccountChanges ): Promise<void> {

    const chosen = compact(settings);
    const place = location ?? (country ? { country } : undefined);

    await Promise.all([
        Object.keys(chosen).length ? api.call({ method: "PUT", path: "account/settings", input: chosen }) : undefined,
        place ? api.call({ method: "PUT", path: "account/location", input: place }) : undefined,
    ]);

}
function shared ( { settings, saved, locale, currency, theme }: Local ): AccountChanges {

    return compact({
        language: saved.language ?? locale,
        currency,
        theme: includes(settings.theme.enabled, theme) ? theme : undefined,
        country: saved.country,
        location: saved.location ?? undefined,
    });

}
async function accountCountry ( { api, saved }: Local ): Promise<string | undefined> {

    const reply = saved.location ? await api.call({ method: "PUT", path: "account/location", input: saved.location }) : await api.call({ method: "GET", path: "account" });
    const code = pathGet(reply.resource, saved.location ? "geo.country.code" : "user.geo.country.code");
    const country = typeof code === "string" ? code.toUpperCase() : undefined;

    return isCountry(country) ? country : undefined;

}
async function adopt ( user: SessionUser, local: Local ): Promise<void> {

    const { settings, locale } = local;
    const language = includes(settings.locale.enabled, user.language) ? user.language : undefined;
    const currency = includes(settings.currency.enabled, user.currency) ? user.currency : undefined;
    const country = await accountCountry(local).catch(ignored);
    const changes = compact({ language, currency, country });

    if ( Object.keys(changes).length ) await savePreferences(changes);
    if ( includes(settings.theme.enabled, user.theme) ) local.setTheme(user.theme);
    if ( language && language !== locale ) local.navigate(localeHref(language));

}
function usePreference<T extends string> ( value: string, options: readonly T[], save: Save<T> ) {

    const [pending, startTransition] = useTransition();
    const [failed, setFailed] = useState(false);

    return {
        value,
        options,
        pending,
        failed,
        change: ( next: string ) => {

            if ( !pending && next !== value && includes(options, next) ) commit(next, save, setFailed, startTransition);

        },
    };

}
function useAccountSync () {

    const api = useApi();
    const signedIn = useUi(( state ) => Boolean(state.token && state.user));

    return useCallback(async ( changes: AccountChanges ) => {

        if ( signedIn ) await push(api, changes);

    }, [api, signedIn]);

}
export function useLocale () {

    const router = useRouter();
    const sync = useAccountSync();

    return usePreference(useCurrentLocale(), useSite().settings.locale.enabled, async ( next ) => {

        await savePreferences({ language: next });
        router.replace(localeHref(next));
        await sync({ language: next });

    });

}
export function useCurrency () {

    const sync = useAccountSync();

    return usePreference(useUi(( state ) => state.currency), useSite().settings.currency.enabled, async ( next ) => {

        await savePreferences({ currency: next });
        await sync({ currency: next });

    });

}
export function useAppearance () {

    const mounted = useMounted();
    const sync = useAccountSync();
    const { theme, setTheme } = useTheme();
    const { default: fallback, enabled } = useSite().settings.theme;

    useEffect(() => {

        if ( mounted && theme && !includes(enabled, theme) ) setTheme(fallback);

    }, [mounted, theme, setTheme, enabled, fallback]);

    const preference = usePreference(mounted ? choose(enabled, theme, fallback) : fallback, enabled, async ( next ) => {

        setTheme(next);
        await sync({ theme: next });

    });

    return { ready: mounted, ...preference };

}
export function usePreferenceSync () {

    const router = useRouter();
    const api = useApi();
    const sync = useAccountSync();
    const locale = useCurrentLocale();
    const { theme, setTheme } = useTheme();
    const { settings, preferences: saved } = useSite();
    const currency = useUi(( state ) => state.currency);
    const origin = useUi(( state ) => state.origin);
    const user = useUi(( state ) => state.user);
    const settle = useUi(( state ) => state.settle);

    useEffect(() => {

        if ( saved.location !== undefined || !("geolocation" in navigator) ) return;

        return onFirstGesture(() => locate(( location ) => {

            savePreferences({ location }).then(() => location && sync({ location })).catch(ignored);

        }));

    }, [saved.location, sync]);

    useEffect(() => {

        if ( !origin || !user ) return;

        const local = { api, settings, saved, locale, currency, theme, setTheme, navigate: router.replace };

        settle();
        (origin === "register" ? sync(shared(local)) : adopt(user, local)).catch(ignored);

    }, [origin, user, api, sync, settings, saved, locale, currency, theme, setTheme, router, settle]);

}
