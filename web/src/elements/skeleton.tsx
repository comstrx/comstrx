import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./skeleton";

const styles = tv({
    base: "animate-pulse rounded-md bg-muted/15",
    variants: { shape: { lines: "h-4 w-full", card: "aspect-video w-full", row: "h-10 w-full" } },
    defaultVariants: { shape: "lines" },
});

type Props = Partial<Pick<Live<typeof contract>, "lines" | "shape">>;

export function Skeleton ({ lines = 3, shape = "lines" }: Props) {

    return (

        <div className="flex w-full flex-col gap-2" aria-busy="true" aria-live="polite">

            {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"].slice(0, shape === "lines" ? lines : 1).map(( key ) => <div key={key} className={styles({ shape })} />)}

        </div>

    );

}
export default function SkeletonNode ({ lines, shape }: Live<typeof contract>) {

    return <Skeleton lines={lines} shape={shape} />;

}
