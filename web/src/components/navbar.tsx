"use client";

import Brand from "@/elements/brand.tsx";
import Link from "@/elements/link.tsx";
import Menu from "@/elements/menu.tsx";
import Row from "@/elements/row.tsx";
import Topbar from "@/elements/topbar.tsx";
import { useNavbar } from "@/hooks/use-navbar";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./navbar";

export default function Navbar ( live: Live<typeof contract> ) {

    const { brand, logo, links = [], account, login } = live;
    const r = inert(live);
    const { signedIn, accountLabel, loginLabel } = useNavbar();
    const items = links.map(( link ) => ({ key: link.href, label: link.label, href: link.href }));

    return (

        <Topbar {...r} slots={slot(
            <>
                <Brand {...r} label={brand} logo={logo} href="/" />
                <Row {...r} gap={3} slots={slot(
                    <>
                        <Menu {...r} entries={items} direction="row" />
                        {signedIn && account ? <Link {...r} href={account} label={accountLabel} variant="soft" /> : null}
                        {!signedIn && login ? <Link {...r} href={login} label={loginLabel} variant="filled" /> : null}
                    </>,
                )} />
            </>,
        )} />

    );

}
