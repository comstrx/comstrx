"use client";

import { useEffect, useMemo, useState } from "react";
import { imageUrls } from "@/hooks/use-gallery";

type Settings = { images?: unknown; cover?: unknown; index?: number };

export function useViewer ( { images, cover, index = 0 }: Settings ) {

    const urls = useMemo(() => imageUrls(images, cover), [images, cover]);
    const [current, setCurrent] = useState(index);

    useEffect(() => { setCurrent(index); }, [index]);

    const bounded = urls.length ? Math.min(Math.max(current, 0), urls.length - 1) : 0;

    return {
        urls,
        index: bounded,
        previous: () => setCurrent(( value ) => (urls.length ? (value - 1 + urls.length) % urls.length : 0)),
        next: () => setCurrent(( value ) => (urls.length ? (value + 1) % urls.length : 0)),
    };

}
