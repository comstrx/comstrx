import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./badge";

const styles = tv({
    base: "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
    variants: {
        tone: { default: "bg-muted/15 text-foreground", muted: "bg-muted/10 text-muted", primary: "bg-primary/15 text-primary", accent: "bg-accent/15 text-accent", danger: "bg-red-100 text-red-700", success: "bg-green-100 text-green-800", warning: "bg-amber-100 text-amber-800" },
    },
    defaultVariants: { tone: "default" },
});

export default function Badge ({ value, tone }: Live<typeof contract>) {

    const text = typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";

    if ( !text ) return null;

    return (

        <span className={styles({ tone })}>{text}</span>

    );

}
