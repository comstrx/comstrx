"use client";

import type { Route } from "next";
import NextLink from "next/link";
import { tv } from "@/lib/providers/variants";
import { routing } from "@/lib/spec/config";
import type { Live } from "@/lib/spec/kinds";
import { localePath } from "@/lib/std/locale";
import type contract from "./menu";

const styles = tv({
    base: "flex gap-1",
    variants: { direction: { row: "flex-row flex-wrap items-center", column: "flex-col" } },
    defaultVariants: { direction: "column" },
});
const item = tv({
    base: "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
    variants: { active: { true: "bg-primary/10 font-medium text-primary", false: "text-foreground hover:bg-muted/10" } },
    defaultVariants: { active: false },
});

export default function Menu ({ entries, value, direction, locale, emit }: Live<typeof contract>) {

    return (

        <nav className={styles({ direction })}>

            {entries.map(( entry ) => {

                const label = typeof entry.label === "string" ? entry.label : entry.key;
                const active = value === entry.key;

                if ( entry.href ) return <NextLink key={entry.key} href={localePath(locale, entry.href, routing) as Route} prefetch={false} className={item({ active })}>{label}</NextLink>;

                return <button key={entry.key} type="button" onClick={() => emit("select", { key: entry.key })} aria-current={active ? "page" : undefined} className={item({ active })}>{label}</button>;

            })}

        </nav>

    );

}
