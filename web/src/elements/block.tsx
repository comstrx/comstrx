import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./block";

const styles = tv({
    base: "flex min-w-0 flex-col",
    variants: {
        gap: { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8", 12: "gap-12" },
        padding: { 0: "p-0", 1: "p-1", 2: "p-2", 3: "p-3", 4: "p-4", 6: "p-6", 8: "p-8", 12: "p-12" },
        width: { auto: "w-auto", full: "w-full", half: "w-full md:w-1/2", third: "w-full md:w-1/3", "two-thirds": "w-full md:w-2/3", quarter: "w-full md:w-1/4", narrow: "w-full max-w-md", wide: "w-full max-w-6xl" },
        align: { start: "items-start", center: "items-center", end: "items-end", between: "items-stretch", stretch: "items-stretch" },
        radius: { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full" },
        shadow: { none: "shadow-none", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" },
        surface: { true: "border border-line bg-surface", false: "" },
        center: { true: "mx-auto", false: "" },
    },
    defaultVariants: { gap: 4, padding: 0, width: "full", align: "stretch", radius: "none", shadow: "none", surface: false, center: false },
});

export default function Block ({ gap, padding, width, align, radius, shadow, surface, center, slots }: Live<typeof contract>) {

    return (

        <div className={styles({ gap, padding, width, align, radius, shadow, surface, center })}>

            {slots.children?.()}

        </div>

    );

}
