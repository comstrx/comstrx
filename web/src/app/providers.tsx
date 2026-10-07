"use client";

import type { ComponentProps, ReactNode } from "react";
import { usePreferenceSync } from "@/hooks/use-preferences";
import { IntlProvider } from "@/lib/providers/intl";
import { MotionConfig } from "@/lib/providers/motion";
import { ThemeProvider } from "@/lib/providers/theme";
import { CSPProvider, DirectionProvider } from "@/lib/providers/ui";
import { SiteProvider } from "@/lib/site/context";
import { appearance } from "@/lib/spec/config";
import { StoreProvider } from "@/stores/provider";

type Intl = Pick<ComponentProps<typeof IntlProvider>, "locale" | "messages" | "timeZone">;
type Site = Omit<ComponentProps<typeof SiteProvider>, "children">;
type Props = Intl & Site & { children: ReactNode; nonce: string; currency: string; direction: "ltr" | "rtl"; };

function Sync () {

    usePreferenceSync();

    return null;

}
export function Providers ({ children, nonce, currency, direction, settings, content, policy, preferences, ...intl }: Props) {

    return (

        <IntlProvider {...intl}>

            <SiteProvider settings={settings} content={content} policy={policy} preferences={preferences}>

                <ThemeProvider
                    nonce={nonce}
                    attribute={appearance.attribute}
                    storageKey={appearance.storageKey}
                    defaultTheme={settings.theme.default}
                    themes={settings.theme.enabled.filter(( theme ) => theme !== "system")}
                    enableSystem={settings.theme.enabled.includes("system")}
                    disableTransitionOnChange
                >

                    <CSPProvider nonce={nonce}>

                        <DirectionProvider direction={direction}>

                            <MotionConfig nonce={nonce} reducedMotion={settings.motion === "reduced" ? "always" : "user"}>

                                <StoreProvider currency={currency}>

                                    <Sync />

                                    {children}

                                </StoreProvider>

                            </MotionConfig>

                        </DirectionProvider>

                    </CSPProvider>

                </ThemeProvider>

            </SiteProvider>

        </IntlProvider>

    );

}
