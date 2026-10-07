"use client";

import Column from "@/elements/column.tsx";
import Image from "@/elements/image.tsx";
import Row from "@/elements/row.tsx";
import Thumb from "@/elements/thumb.tsx";
import { useGallery } from "@/hooks/use-gallery";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./gallery";

export default function Gallery ( live: Live<typeof contract> ) {

    const r = inert(live);
    const { urls, index, pick, select } = useGallery(live);

    return (

        <Column {...r} gap={3} slots={slot(
            <>
                <Thumb {...r} src={urls[index]} alt={live.alt} active emit={async () => select(index)} />
                <Image {...r} src={urls[index]} alt={live.alt} ratio="video" radius="lg" eager />
                {urls.length > 1 ? (
                    <Row {...r} gap={2} slots={slot(urls.map(( url, position ) => (
                        <Thumb {...r} key={url} src={url} alt={live.alt} active={position === index} emit={async () => pick(position)} />
                    )))} />
                ) : null}
            </>,
        )} />

    );

}
