"use client";

import NextImage from "next/image";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import { webUrl } from "@/lib/std/url";
import type contract from "./thumb";

const styles = tv({
    base: "relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border-2 bg-muted/15 transition",
    variants: { active: { true: "border-primary", false: "border-transparent hover:border-line" } },
    defaultVariants: { active: false },
});

export default function Thumb ({ src, alt, active, emit }: Live<typeof contract>) {

    const url = typeof src === "string" ? webUrl(src) : undefined;

    return (

        <button type="button" onClick={() => emit("click")} aria-pressed={active === true} className={styles({ active })}>

            {url ? <NextImage src={url} alt={typeof alt === "string" ? alt : ""} fill sizes="80px" className="object-cover" /> : null}

        </button>

    );

}
