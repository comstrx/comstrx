"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./input";

const styles = tv({
    base: "w-full rounded-md border bg-background text-foreground outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/30 disabled:opacity-60",
    variants: {
        size: { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-sm", md: "px-3 py-2 text-sm", lg: "px-4 py-2.5 text-base", xl: "px-5 py-3 text-lg" },
        invalid: { true: "border-red-400", false: "border-line" },
        otp: { true: "text-center font-mono tracking-[0.5em]", false: "" },
    },
    defaultVariants: { size: "md", invalid: false, otp: false },
});

export default function Input ({ field, type = "text", value, placeholder, required, disabled, invalid, size, emit }: Live<typeof contract>) {

    const otp = type === "otp";
    const keyed = ( event: KeyboardEvent<HTMLInputElement> ) => { if ( event.key === "Enter" && type === "search" ) emit("submit"); };

    return (

        <input
            id={field}
            name={field}
            type={otp ? "text" : type}
            inputMode={otp ? "numeric" : type === "tel" ? "tel" : type === "number" ? "decimal" : undefined}
            autoComplete={otp ? "one-time-code" : undefined}
            required={required}
            disabled={disabled}
            placeholder={typeof placeholder === "string" ? placeholder : undefined}
            value={value === undefined || value === null ? "" : String(value)}
            aria-invalid={invalid || undefined}
            onChange={( event: ChangeEvent<HTMLInputElement> ) => emit("change", { value: event.target.value })}
            onKeyDown={keyed}
            className={styles({ size, invalid, otp })}
        />

    );

}
