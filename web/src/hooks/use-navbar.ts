"use client";

import { useTranslate } from "@/hooks/use-page";
import { useUi } from "@/stores/provider";

export function useNavbar () {

    const translate = useTranslate();
    const signedIn = useUi(( ui ) => Boolean(ui.token && ui.user));
    const name = useUi(( ui ) => (typeof ui.user?.name === "string" ? ui.user.name : ""));

    return { signedIn, accountLabel: name || translate("nav.account"), loginLabel: translate("nav.login") };

}
