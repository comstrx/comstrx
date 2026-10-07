"use client";

import Button from "@/elements/button.tsx";
import Column from "@/elements/column.tsx";
import Frame from "@/elements/frame.tsx";
import Icon from "@/elements/icon.tsx";
import Row from "@/elements/row.tsx";
import Text from "@/elements/text.tsx";
import { useViewer } from "@/hooks/use-viewer";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./viewer";

export default function Viewer ( live: Live<typeof contract> ) {

    const r = inert(live);
    const { urls, index, previous, next } = useViewer(live);

    return (

        <Column {...r} gap={3} slots={slot(
            <>
                <Frame {...r} src={urls[index]} alt={live.alt} fit="contain" />
                <Row {...r} justify="between" slots={slot(
                    <>
                        <Button {...r} variant="outlined" tone="muted" size="sm" emit={async () => previous()} slots={slot(<Icon {...r} glyph="caret-left" size="sm" />)} />
                        <Text {...r} value={urls.length ? `${index + 1} / ${urls.length}` : ""} size="sm" tone="muted" />
                        <Button {...r} variant="outlined" tone="muted" size="sm" emit={async () => next()} slots={slot(<Icon {...r} glyph="caret-right" size="sm" />)} />
                    </>,
                )} />
            </>,
        )} />

    );

}
