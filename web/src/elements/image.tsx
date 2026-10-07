import NextImage from "next/image";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import { webUrl } from "@/lib/std/url";
import type contract from "./image";

const styles = tv({
    base: "relative w-full overflow-hidden bg-muted/15",
    variants: {
        ratio: { square: "aspect-square", video: "aspect-video", wide: "aspect-[21/9]", portrait: "aspect-[3/4]", auto: "aspect-video" },
        radius: { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full" },
    },
    defaultVariants: { ratio: "video", radius: "md" },
});

export function imageUrl ( value: unknown ): string | undefined {

    if ( typeof value !== "string" || !value ) return undefined;

    return webUrl(value) ?? (value.startsWith("/") ? value : undefined);

}
export default function Image ({ src, alt, ratio, radius, eager }: Live<typeof contract>) {

    const url = imageUrl(src);

    return (

        <div className={styles({ ratio, radius })}>

            {url ? <NextImage src={url} alt={typeof alt === "string" ? alt : ""} fill priority={eager === true} sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" /> : null}

        </div>

    );

}
