import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import { formatDate, formatMoney, formatNumber } from "@/lib/std/format";
import type contract from "./text";

const styles = tv({
    base: "leading-relaxed",
    variants: {
        size: { xs: "text-xs", sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-2xl" },
        tone: { default: "text-foreground", muted: "text-muted", primary: "text-primary", accent: "text-accent", danger: "text-red-600", success: "text-green-700", warning: "text-amber-700" },
        bold: { true: "font-semibold", false: "" },
        clamp: { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4", 5: "line-clamp-5", 6: "line-clamp-6" },
        lines: { true: "whitespace-pre-line", false: "" },
    },
    defaultVariants: { size: "md", tone: "default", bold: false },
});

export function formatted ( value: unknown, format: string | undefined, locale: string ): string {

    if ( format === "money" ) return formatMoney(value, locale);
    if ( format === "date" ) return formatDate(value, locale);
    if ( format === "number" ) return formatNumber(value, locale);
    if ( typeof value === "string" ) return value;
    if ( typeof value === "number" || typeof value === "boolean" ) return String(value);

    return "";

}
export default function Text ({ value, size, tone, format, bold, clamp, locale }: Live<typeof contract>) {

    const text = formatted(value, format, locale);

    if ( !text ) return null;

    return (

        <p className={styles({ size, tone, bold, clamp, lines: format === "lines" })}>{text}</p>

    );

}
