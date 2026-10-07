"use client";

import Button from "@/elements/button.tsx";
import Dialog from "@/elements/dialog.tsx";
import Notice from "@/elements/notice.tsx";
import Text from "@/elements/text.tsx";
import { useAction } from "@/hooks/use-action";
import { inert, type Live } from "@/lib/spec/kinds";
import type contract from "./confirm";

export default function Confirm ( live: Live<typeof contract> ) {

    const r = inert(live);
    const { pending, failure } = useAction(live);

    if ( !live.open ) return null;

    return (

        <Dialog {...r} shown title={live.title} size="sm" emit={async () => { live.close(); await live.emit("cancel"); }} slots={{
            children: () => (
                <>
                    <Text {...r} value={live.text} />
                    {failure ? <Notice {...r} kind="error" text={failure} /> : null}
                </>
            ),
            footer: () => (
                <>
                    <Button {...r} label={live.cancel ?? "×"} variant="ghost" tone="muted" emit={async () => { live.close(); await live.emit("cancel"); }} />
                    <Button {...r} label={live.accept ?? "✓"} tone={live.tone ?? "primary"} pending={pending} emit={() => live.emit("accept")} />
                </>
            ),
        }} />

    );

}
