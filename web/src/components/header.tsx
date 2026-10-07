import Avatar from "@/elements/avatar.tsx";
import Column from "@/elements/column.tsx";
import Heading from "@/elements/heading.tsx";
import Row from "@/elements/row.tsx";
import Text from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./header";

export default function Header ( live: Live<typeof contract> ) {

    const r = inert(live);

    return (

        <Row {...r} justify="between" gap={4} slots={slot(
            <>
                <Row {...r} gap={3} slots={slot(
                    <>
                        <Avatar {...r} src={live.image} label={live.title} size="lg" />
                        <Column {...r} gap={0} width="auto" slots={slot(
                            <>
                                <Heading {...r} value={live.title} level={1} />
                                <Text {...r} value={live.subtitle} tone="muted" />
                            </>,
                        )} />
                    </>,
                )} />
                {live.slots.actions?.()}
            </>,
        )} />

    );

}
