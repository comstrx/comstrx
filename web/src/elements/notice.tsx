import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./notice";

const styles = tv({
    base: "flex flex-col gap-2 rounded-md border px-4 py-3 text-sm",
    variants: {
        kind: {
            info: "border-line bg-surface text-foreground",
            empty: "border-dashed border-line text-muted",
            error: "border-red-200 bg-red-50 text-red-700",
            loading: "animate-pulse border-line text-muted",
            success: "border-green-200 bg-green-50 text-green-800",
            offline: "border-amber-200 bg-amber-50 text-amber-800",
        },
    },
    defaultVariants: { kind: "info" },
});

export default function Notice ({ kind = "info", text, detail, slots }: Live<typeof contract>) {

    const message = typeof text === "string" ? text : "";

    return (

        <div role={kind === "error" ? "alert" : "status"} className={styles({ kind })}>

            <span>{message || (kind === "loading" ? "…" : kind === "empty" ? "—" : "")}</span>

            {typeof detail === "string" && detail ? <span className="text-xs opacity-80">{detail}</span> : null}

            {slots.children?.()}

        </div>

    );

}
