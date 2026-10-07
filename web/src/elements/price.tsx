import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import { formatMoney } from "@/lib/std/format";
import type contract from "./price";

const styles = tv({
    base: "font-semibold text-foreground tabular-nums",
    variants: { size: { xs: "text-xs", sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-2xl" } },
    defaultVariants: { size: "lg" },
});

export default function Price ({ value, currency, size, locale }: Live<typeof contract>) {

    const text = formatMoney(value, locale, currency);

    if ( !text ) return null;

    return (

        <span className={styles({ size })}>{text}</span>

    );

}
