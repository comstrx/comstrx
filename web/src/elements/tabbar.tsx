"use client";

import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./tabbar";

const tab = tv({
    base: "-mb-px border-b-2 px-3 py-2 text-sm transition",
    variants: { active: { true: "border-primary font-medium text-primary", false: "border-transparent text-muted hover:text-foreground" } },
    defaultVariants: { active: false },
});

export default function Tabbar ({ entries, value, emit }: Live<typeof contract>) {

    return (

        <div role="tablist" className="flex gap-1 border-b border-line">

            {entries.map(( entry ) => (
                <button key={entry.key} type="button" role="tab" aria-selected={value === entry.key} onClick={() => emit("select", { key: entry.key })} className={tab({ active: value === entry.key })}>
                    {typeof entry.label === "string" ? entry.label : entry.key}
                </button>
            ))}

        </div>

    );

}
