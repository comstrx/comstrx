import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./column";

const styles = tv({
    base: "flex min-w-0 flex-col",
    variants: {
        gap: { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8", 12: "gap-12" },
        align: { start: "items-start", center: "items-center", end: "items-end", between: "items-stretch", stretch: "items-stretch" },
        width: { auto: "w-auto", full: "w-full", half: "w-full md:w-1/2", third: "w-full md:w-1/3", "two-thirds": "w-full md:w-2/3", quarter: "w-full md:w-1/4", narrow: "w-full max-w-md", wide: "w-full max-w-5xl" },
    },
    defaultVariants: { gap: 4, align: "stretch", width: "full" },
});

export default function Column ({ gap, align, width, slots }: Live<typeof contract>) {

    return (

        <div className={styles({ gap, align, width })}>

            {slots.children?.()}

        </div>

    );

}
