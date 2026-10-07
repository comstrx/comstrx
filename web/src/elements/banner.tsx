import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./banner";

const styles = tv({
    base: "w-full",
    variants: { tone: { default: "bg-surface", muted: "bg-muted/10", primary: "bg-primary/10", accent: "bg-accent/10", danger: "bg-red-50", success: "bg-green-50", warning: "bg-amber-50" } },
    defaultVariants: { tone: "primary" },
});

export default function Banner ({ tone, slots }: Live<typeof contract>) {

    return (

        <section className={styles({ tone })}>

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 md:py-20">{slots.children?.()}</div>

        </section>

    );

}
