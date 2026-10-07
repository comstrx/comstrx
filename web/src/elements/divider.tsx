import type { Live } from "@/lib/spec/kinds";
import type contract from "./divider";

export default function Divider ({ label }: Live<typeof contract>) {

    const text = typeof label === "string" ? label : "";

    return (

        <div className="flex items-center gap-3 text-xs text-muted">

            <hr className="h-px flex-1 border-0 bg-line" />

            {text ? <span>{text}</span> : null}

            {text ? <hr className="h-px flex-1 border-0 bg-line" /> : null}

        </div>

    );

}
