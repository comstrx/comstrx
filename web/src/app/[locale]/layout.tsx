import "@/styles/globals.css";
import "@spec/theme.css";

import { headers } from "next/headers";
import type { ReactNode } from "react";
import { readContent, readPolicy, siteCurrency, sitePreferences, siteSettings } from "@/api/server";
import { getLocale, getMessages } from "@/lib/providers/intl-server";
import { siteMetadata, siteViewport } from "@/lib/seo";
import { languages } from "@/lib/spec/languages";
import { Providers } from "../providers";

export const generateMetadata = siteMetadata;
export const viewport = siteViewport;

export default async function RootLayout ({ children }: { children: ReactNode }) {

    const [locale, messages, request, currency, settings, content, policy, preferences] = await Promise.all([
        getLocale(),
        getMessages(),
        headers(),
        siteCurrency(),
        siteSettings(),
        readContent(),
        readPolicy(),
        sitePreferences(),
    ]);
    return (

        <html lang={locale} dir={languages[locale].direction} data-trace={request.get("x-request-id") ?? undefined} suppressHydrationWarning>

            <body>

                <Providers
                    nonce={request.get("x-nonce") ?? ""}
                    currency={currency}
                    direction={languages[locale].direction}
                    locale={locale}
                    messages={messages}
                    timeZone={settings.locale.timeZone}
                    settings={settings}
                    content={content}
                    policy={policy}
                    preferences={preferences}
                >

                    {children}

                </Providers>

            </body>

        </html>

    );

}
