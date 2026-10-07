import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./heading";

const styles = tv({
    base: "tracking-tight",
    variants: {
        level: { 1: "text-3xl font-bold", 2: "text-2xl font-semibold", 3: "text-xl font-semibold", 4: "text-lg font-medium" },
        tone: { default: "text-foreground", muted: "text-muted", primary: "text-primary", accent: "text-accent", danger: "text-red-600", success: "text-green-700", warning: "text-amber-700" },
    },
    defaultVariants: { level: 2, tone: "default" },
});

export default function Heading ({ value, level = 2, tone }: Live<typeof contract>) {

    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
    const text = typeof value === "string" || typeof value === "number" ? String(value) : "";

    if ( !text ) return null;

    return (

        <Tag className={styles({ level, tone })}>{text}</Tag>

    );

}
