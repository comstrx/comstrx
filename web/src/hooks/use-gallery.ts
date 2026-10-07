"use client";

import { useMemo, useState } from "react";
import type { Runtime } from "@/lib/spec/kinds";
import { isRecord } from "@/lib/std/object";

type Settings = Pick<Runtime, "emit"> & { images?: unknown; cover?: unknown };

export function imageUrls ( images: unknown, cover: unknown ): string[] {

    const listed = Array.isArray(images) ? images.flatMap(( item ) => (isRecord(item) && item.type === "image" && typeof item.url === "string" ? [item.url] : typeof item === "string" ? [item] : [])) : [];
    const first = typeof cover === "string" && cover ? [cover] : [];

    return [...new Set([...first, ...listed])];

}
export function useGallery ( { images, cover, emit }: Settings ) {

    const urls = useMemo(() => imageUrls(images, cover), [images, cover]);
    const [index, setIndex] = useState(0);

    return {
        urls,
        index: Math.min(index, Math.max(0, urls.length - 1)),
        pick: setIndex,
        select: ( position: number ) => { emit("select", { index: position }).catch(() => undefined); },
    };

}
