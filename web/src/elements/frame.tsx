import NextImage from "next/image";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import { webUrl } from "@/lib/std/url";
import type contract from "./frame";

const styles = tv({
    base: "relative h-[70vh] w-full overflow-hidden rounded-lg bg-black/5",
    variants: { fit: { cover: "", contain: "" } },
    defaultVariants: { fit: "contain" },
});

export default function Frame ({ src, alt, fit = "contain" }: Live<typeof contract>) {

    const url = typeof src === "string" ? webUrl(src) : undefined;

    if ( !url ) return <div className={styles({ fit })} />;

    return (

        <div className={styles({ fit })}>

            <NextImage src={url} alt={typeof alt === "string" ? alt : ""} fill sizes="100vw" className={fit === "cover" ? "object-cover" : "object-contain"} />

        </div>

    );

}
