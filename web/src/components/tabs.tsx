"use client";

import Column from "@/elements/column.tsx";
import Tabbar from "@/elements/tabbar.tsx";
import { useTabs } from "@/hooks/use-tabs";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./tabs";

export default function Tabs ( live: Live<typeof contract> ) {

    const r = inert(live);
    const { active, select } = useTabs(live);

    return (

        <Column {...r} gap={4} slots={slot(
            <>
                <Tabbar {...r} entries={live.entries} value={active} emit={async ( _, payload ) => select(payload)} />
                {live.slots.children?.()}
            </>,
        )} />

    );

}
