import NextImage from "next/image";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import { webUrl } from "@/lib/std/url";
import type contract from "./avatar";

const styles = tv({
    base: "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary",
    variants: { size: { xs: "size-6 text-xs", sm: "size-8 text-sm", md: "size-10 text-base", lg: "size-14 text-lg", xl: "size-20 text-2xl" } },
    defaultVariants: { size: "md" },
});

export default function Avatar ({ src, label, size }: Live<typeof contract>) {

    const url = typeof src === "string" ? webUrl(src) : undefined;
    const initial = typeof label === "string" && label ? label.trim().charAt(0).toUpperCase() : "·";

    return (

        <span className={styles({ size })} title={typeof label === "string" ? label : undefined}>

            {url ? <NextImage src={url} alt="" fill sizes="80px" className="object-cover" /> : initial}

        </span>

    );

}
