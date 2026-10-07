import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./row";

const styles = tv({
    base: "flex flex-row",
    variants: {
        gap: { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8", 12: "gap-12" },
        align: { start: "items-start", center: "items-center", end: "items-end", between: "items-center", stretch: "items-stretch" },
        justify: { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between", stretch: "justify-stretch" },
        wrap: { true: "flex-wrap", false: "flex-nowrap" },
    },
    defaultVariants: { gap: 3, align: "center", justify: "start", wrap: true },
});

export default function Row ({ gap, align, justify, wrap, slots }: Live<typeof contract>) {

    return (

        <div className={styles({ gap, align, justify, wrap })}>

            {slots.children?.()}

        </div>

    );

}
