import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./columns";

const styles = tv({
    base: "grid grid-cols-1",
    variants: {
        gap: { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8", 12: "gap-12" },
        sizes: {
            "1": "md:grid-cols-1", "1-1": "md:grid-cols-2", "1-2": "md:grid-cols-[1fr_2fr]", "2-1": "md:grid-cols-[2fr_1fr]", "1-3": "md:grid-cols-[1fr_3fr]", "3-1": "md:grid-cols-[3fr_1fr]",
            "1-1-1": "md:grid-cols-3", "1-1-1-1": "md:grid-cols-4", "1-2-1": "md:grid-cols-[1fr_2fr_1fr]",
        },
    },
    defaultVariants: { gap: 6, sizes: "1-1" },
});

type Sizes = keyof typeof styles.variants.sizes;

function sizesOf ( sizes: readonly number[] | undefined ): Sizes {

    const key = (sizes ?? [1, 1]).join("-");

    return Object.hasOwn(styles.variants.sizes, key) ? key as Sizes : "1-1";

}
export default function Columns ({ sizes, gap, slots }: Live<typeof contract>) {

    return (

        <div className={styles({ gap, sizes: sizesOf(sizes) })}>

            {slots.children?.()}

        </div>

    );

}
