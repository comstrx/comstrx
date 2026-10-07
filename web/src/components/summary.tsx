import Badge from "@/elements/badge.tsx";
import Column from "@/elements/column.tsx";
import Heading from "@/elements/heading.tsx";
import Price from "@/elements/price.tsx";
import Rating from "@/elements/rating.tsx";
import Row from "@/elements/row.tsx";
import Text from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./summary";

export default function Summary ( live: Live<typeof contract> ) {

    const r = inert(live);

    return (

        <Column {...r} gap={3} slots={slot(
            <>
                <Badge {...r} value={live.badge} tone="primary" />
                <Heading {...r} value={live.title} level={1} />
                <Row {...r} gap={4} slots={slot(
                    <>
                        <Price {...r} value={live.price} size="xl" />
                        <Rating {...r} value={live.rating} count={typeof live.count === "number" ? live.count : undefined} />
                    </>,
                )} />
                <Text {...r} value={live.text} format="lines" />
            </>,
        )} />

    );

}
