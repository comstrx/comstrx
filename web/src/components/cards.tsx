"use client";

import Badge from "@/elements/badge.tsx";
import Button from "@/elements/button.tsx";
import Card from "@/elements/card.tsx";
import Grid from "@/elements/grid.tsx";
import Image from "@/elements/image.tsx";
import Notice from "@/elements/notice.tsx";
import Price from "@/elements/price.tsx";
import Row from "@/elements/row.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";
import Text from "@/elements/text.tsx";
import { useCards } from "@/hooks/use-cards";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import { statusOf } from "@/lib/spec/status";
import type contract from "./cards";

export default function Cards ( live: Live<typeof contract> ) {

    const r = inert(live);
    const status = statusOf(live);
    const { rows, field, hrefOf } = useCards(live);

    if ( status.loading ) return <Skeleton shape="card" />;
    if ( status.failed ) return <Notice {...r} kind="error" text={status.message} detail={status.detail} />;
    if ( status.empty ) return <Notice {...r} kind="empty" text={live.empty} />;

    return (

        <Grid {...r} columns={live.columns} gap={4} slots={slot(rows.map(( item, index ) => (
            <Card {...r} key={String(field(item, "id") ?? index)} href={hrefOf(item)} slots={{
                media: live.image ? () => <Image {...r} src={field(item, live.image)} alt={field(item, live.title)} ratio={live.shape ?? "video"} radius="none" /> : undefined,
                children: () => (
                    <>
                        {live.badge ? <Badge {...r} value={field(item, live.badge)} tone="primary" /> : null}
                        <Text {...r} value={field(item, live.title)} bold clamp={2} />
                        {live.text ? <Text {...r} value={field(item, live.text)} size="sm" tone="muted" clamp={3} /> : null}
                        {live.slots.item?.({ item })}
                    </>
                ),
                footer: live.price || live.meta || live.date || live.actions?.length ? () => (
                    <>
                        <Row {...r} gap={2} slots={slot(
                            <>
                                {live.price ? <Price {...r} value={field(item, live.price)} /> : null}
                                {live.meta ? <Text {...r} value={field(item, live.meta)} size="sm" tone="muted" format="number" /> : null}
                                {live.date ? <Text {...r} value={field(item, live.date)} size="sm" tone="muted" format="date" /> : null}
                            </>,
                        )} />
                        {live.actions?.length ? (
                            <Row {...r} gap={1} slots={slot(live.actions.map(( action ) => (
                                <Button {...r} key={action.key} label={action.label} title={action.key} variant={action.variant ?? "ghost"} tone={action.tone} size="sm" emit={() => live.emit(action.key, { id: field(item, "id"), item })} />
                            )))} />
                        ) : null}
                    </>
                ) : undefined,
            }} />
        )))} />

    );

}
