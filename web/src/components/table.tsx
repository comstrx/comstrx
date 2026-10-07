"use client";

import Button from "@/elements/button.tsx";
import Datatable from "@/elements/datatable.tsx";
import Icon from "@/elements/icon.tsx";
import Notice from "@/elements/notice.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";
import { useTable } from "@/hooks/use-table";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import { statusOf } from "@/lib/spec/status";
import type contract from "./table";

export default function Table ( live: Live<typeof contract> ) {

    const r = inert(live);
    const status = statusOf(live);
    const { columns, rows, byKey } = useTable(live);

    if ( status.loading ) return <Skeleton shape="row" lines={4} />;
    if ( status.failed ) return <Notice {...r} kind="error" text={status.message} detail={status.detail} />;
    if ( status.empty ) return <Notice {...r} kind="empty" text={live.empty} />;

    return (

        <Datatable {...r} columns={columns} rows={rows} emit={async ( event, payload ) => {

            const key = payload && typeof payload === "object" && "key" in payload ? String(payload.key) : "";

            if ( event === "select" ) await live.emit("select", { id: byKey.get(key)?.id, item: byKey.get(key)?.item });

        }} slots={live.actions?.length ? { actions: ( extra = {} ) => {

            const key = typeof extra.key === "string" ? extra.key : "";
            const found = byKey.get(key);

            return live.actions?.map(( action ) => (
                <Button {...r} key={action.key} label={action.label} title={action.key} variant={action.variant ?? "ghost"} tone={action.tone} size="sm" emit={() => live.emit(action.key, { id: found?.id, item: found?.item })} slots={action.icon ? slot(<Icon {...r} glyph={action.icon} size="sm" />) : {}} />
            ));

        } } : {}} />

    );

}
