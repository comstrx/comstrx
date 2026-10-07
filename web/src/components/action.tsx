"use client";

import Button from "@/elements/button.tsx";
import Icon from "@/elements/icon.tsx";
import Link from "@/elements/link.tsx";
import Notice from "@/elements/notice.tsx";
import Row from "@/elements/row.tsx";
import { useAction } from "@/hooks/use-action";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./action";

export default function Action ( live: Live<typeof contract> ) {

    const r = inert(live);
    const { pending, failure, click } = useAction(live);
    const icon = live.icon ? slot(<Icon {...r} glyph={live.icon} size="sm" />) : {};

    if ( live.href ) return <Link {...r} href={live.href} label={live.label} variant={live.variant ?? "filled"} tone={live.tone} size={live.size} block={live.block} slots={icon} />;

    return (

        <Row {...r} gap={2} wrap={false} slots={slot(
            <>
                <Button {...r} label={live.label} variant={live.variant} tone={live.tone} size={live.size} disabled={live.disabled} pending={pending} block={live.block} slots={icon} emit={click} />
                {failure ? <Notice {...r} kind="error" text={failure} /> : null}
            </>,
        )} />

    );

}
