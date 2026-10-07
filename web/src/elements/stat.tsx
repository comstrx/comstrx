import type { Live } from "@/lib/spec/kinds";
import type contract from "./stat";

export default function Stat ({ label, value, badge }: Live<typeof contract>) {

    const text = typeof value === "string" || typeof value === "number" ? String(value) : "—";

    return (

        <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">

            <span className="text-sm text-muted">{typeof label === "string" ? label : ""}</span>

            {badge && text !== "—" ? <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{text}</span> : <span className="text-base font-semibold text-foreground tabular-nums">{text}</span>}

        </div>

    );

}
