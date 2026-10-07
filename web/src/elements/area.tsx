import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./area";

const styles = tv({
    base: "mx-auto flex w-full flex-col gap-5 px-4 py-8",
    variants: { width: { auto: "max-w-6xl", full: "max-w-none", half: "max-w-3xl", third: "max-w-2xl", "two-thirds": "max-w-4xl", quarter: "max-w-xl", narrow: "max-w-md", wide: "max-w-6xl" } },
    defaultVariants: { width: "wide" },
});

export default function Area ({ title, description, width, slots }: Live<typeof contract>) {

    const heading = typeof title === "string" ? title : "";
    const text = typeof description === "string" ? description : "";

    return (

        <section className={styles({ width })}>

            {heading || text || slots.aside ? (
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        {heading ? <h2 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h2> : null}
                        {text ? <p className="text-muted">{text}</p> : null}
                    </div>
                    {slots.aside?.()}
                </div>
            ) : null}

            {slots.children?.()}

        </section>

    );

}
