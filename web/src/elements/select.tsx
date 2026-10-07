"use client";

import type { ChangeEvent } from "react";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./select";

const styles = tv({
    base: "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/30 disabled:opacity-60",
    variants: { invalid: { true: "border-red-400", false: "border-line" } },
    defaultVariants: { invalid: false },
});

export default function Select ({ field, value, placeholder, options = [], required, disabled, invalid, emit }: Live<typeof contract>) {

    return (

        <select
            id={field}
            name={field}
            required={required}
            disabled={disabled}
            value={value === undefined || value === null ? "" : String(value)}
            aria-invalid={invalid || undefined}
            onChange={( event: ChangeEvent<HTMLSelectElement> ) => emit("change", { value: event.target.value })}
            className={styles({ invalid })}
        >

            <option value="">{typeof placeholder === "string" ? placeholder : "—"}</option>

            {options.map(( option ) => <option key={String(option.value)} value={String(option.value)}>{typeof option.label === "string" || typeof option.label === "number" ? String(option.label) : String(option.value)}</option>)}

        </select>

    );

}
