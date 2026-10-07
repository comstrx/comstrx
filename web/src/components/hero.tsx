import Banner from "@/elements/banner.tsx";
import Column from "@/elements/column.tsx";
import Heading from "@/elements/heading.tsx";
import Text from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./hero";

export default function Hero ( live: Live<typeof contract> ) {

    const r = inert(live);

    return (

        <Banner {...r} tone={live.tone} slots={slot(
            <Column {...r} gap={4} width="wide" slots={slot(
                <>
                    <Text {...r} value={live.title} size="sm" tone="primary" bold />
                    <Heading {...r} value={live.subtitle} level={1} />
                    <Text {...r} value={live.text} size="lg" tone="muted" />
                    {live.slots.children?.()}
                </>,
            )} />,
        )} />

    );

}
