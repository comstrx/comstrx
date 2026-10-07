"use client";

import Block from "@/elements/block.tsx";
import Menu from "@/elements/menu.tsx";
import Text from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./sidebar";

export default function Sidebar ( live: Live<typeof contract> ) {

    const r = inert(live);

    return (

        <Block {...r} gap={2} padding={2} radius="lg" surface slots={slot(
            <>
                {live.title ? <Text {...r} value={live.title} size="xs" tone="muted" bold /> : null}
                <Menu {...r} entries={live.entries} value={live.value} direction="column" emit={live.emit} />
            </>,
        )} />

    );

}
