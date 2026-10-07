import Footbar from "@/elements/footbar.tsx";
import Row from "@/elements/row.tsx";
import Text from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./footer";

export default function Footer ( live: Live<typeof contract> ) {

    const r = inert(live);
    const year = new Date().getFullYear();

    return (

        <Footbar {...r} slots={slot(
            <Row {...r} justify="between" slots={slot(
                <>
                    <Text {...r} value={live.brand} bold />
                    <Text {...r} value={typeof live.text === "string" && live.text ? live.text : `© ${year}`} size="sm" tone="muted" />
                </>,
            )} />,
        )} />

    );

}
