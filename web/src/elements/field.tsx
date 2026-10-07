import type { Live } from "@/lib/spec/kinds";
import type contract from "./field";

export default function Field ({ field, label, hint, error, required, slots }: Live<typeof contract>) {

    return (

        <div className="flex flex-col gap-1">

            {label ? <label htmlFor={field} className="text-sm font-medium text-foreground">{typeof label === "string" ? label : ""}{required ? " *" : ""}</label> : null}

            {slots.children?.()}

            {error ? <span className="text-sm text-red-600" role="alert">{typeof error === "string" ? error : ""}</span> : hint ? <span className="text-xs text-muted">{typeof hint === "string" ? hint : ""}</span> : null}

        </div>

    );

}
