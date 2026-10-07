"use client";

import type { ChangeEvent } from "react";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./checkbox";

export default function Checkbox ({ field, label, checked, disabled, emit }: Live<typeof contract>) {

    return (

        <label className="inline-flex items-center gap-2 text-sm text-foreground" htmlFor={field}>

            <input id={field} name={field} type="checkbox" checked={checked === true} disabled={disabled} onChange={( event: ChangeEvent<HTMLInputElement> ) => emit("change", { value: event.target.checked })} className="size-4 rounded border-line" />

            <span>{typeof label === "string" ? label : ""}</span>

        </label>

    );

}
