"use client";

import type { ChangeEvent } from "react";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./textarea";

const styles = tv({
    base: "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/30 disabled:opacity-60",
    variants: { invalid: { true: "border-red-400", false: "border-line" } },
    defaultVariants: { invalid: false },
});

export default function Textarea ({ field, value, placeholder, rows = 4, required, disabled, invalid, emit }: Live<typeof contract>) {

    return (

        <textarea
            id={field}
            name={field}
            rows={rows}
            required={required}
            disabled={disabled}
            placeholder={typeof placeholder === "string" ? placeholder : undefined}
            value={value === undefined || value === null ? "" : String(value)}
            aria-invalid={invalid || undefined}
            onChange={( event: ChangeEvent<HTMLTextAreaElement> ) => emit("change", { value: event.target.value })}
            className={styles({ invalid })}
        />

    );

}
