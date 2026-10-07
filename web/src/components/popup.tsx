"use client";

import Dialog from "@/elements/dialog.tsx";
import { inert, type Live } from "@/lib/spec/kinds";
import type contract from "./popup";

export default function Popup ( live: Live<typeof contract> ) {

    const r = inert(live);

    if ( !live.open ) return null;

    return (

        <Dialog {...r} shown title={live.title} size={live.size} slots={live.slots} emit={async () => { live.close(); await live.emit("close"); }} />

    );

}
