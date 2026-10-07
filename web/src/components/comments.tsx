import Avatar from "@/elements/avatar.tsx";
import Block from "@/elements/block.tsx";
import Column from "@/elements/column.tsx";
import Notice from "@/elements/notice.tsx";
import Rating from "@/elements/rating.tsx";
import Row from "@/elements/row.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";
import Text from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import { statusOf } from "@/lib/spec/status";
import { isRecord, pathGet } from "@/lib/std/object";
import type contract from "./comments";

function at ( item: Record<string, unknown>, path: string | undefined ): unknown {

    return path ? pathGet(item, path) : undefined;

}
export default function Comments ( live: Live<typeof contract> ) {

    const r = inert(live);
    const status = statusOf(live);
    const rows = Array.isArray(live.state.data) ? live.state.data.filter(isRecord) : [];

    if ( status.loading ) return <Skeleton lines={4} />;
    if ( status.failed ) return <Notice {...r} kind="error" text={status.message} detail={status.detail} />;
    if ( status.empty ) return <Notice {...r} kind="empty" text={live.empty} />;

    return (

        <Column {...r} gap={3} slots={slot(rows.map(( item, index ) => (
            <Block {...r} key={String(item.id ?? index)} padding={4} radius="lg" surface gap={2} slots={slot(
                <>
                    <Row {...r} justify="between" slots={slot(
                        <>
                            <Row {...r} gap={2} slots={slot(
                                <>
                                    <Avatar {...r} src={at(item, live.avatar)} label={at(item, live.author)} size="sm" />
                                    <Text {...r} value={at(item, live.author)} size="sm" bold />
                                </>,
                            )} />
                            <Rating {...r} value={at(item, live.rating)} />
                        </>,
                    )} />
                    <Text {...r} value={at(item, live.text)} size="sm" />
                    <Text {...r} value={at(item, live.date)} size="xs" tone="muted" format="date" />
                </>,
            )} />
        )))} />

    );

}
