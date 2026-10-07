"use client";

import Block from "@/elements/block.tsx";
import Notice from "@/elements/notice.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";
import Stat from "@/elements/stat.tsx";
import { formatted } from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import { statusOf } from "@/lib/spec/status";
import { isRecord, pathGet } from "@/lib/std/object";
import type contract from "./details";

export default function Details ( live: Live<typeof contract> ) {

    const r = inert(live);
    const status = statusOf(live);
    const item = isRecord(live.state.data) ? live.state.data : {};

    if ( status.loading ) return <Skeleton lines={live.fields.length} />;
    if ( status.failed ) return <Notice {...r} kind="error" text={status.message} detail={status.detail} />;
    if ( status.empty ) return <Notice {...r} kind="empty" text={live.empty} />;

    return (

        <Block {...r} gap={0} slots={slot(live.fields.map(( entry ) => {

            const value = pathGet(item, entry.name);

            return <Stat {...r} key={entry.name} label={entry.label ?? entry.name} value={formatted(value, entry.format === "badge" ? "plain" : entry.format, live.locale)} badge={entry.format === "badge"} />;

        }))} />

    );

}
