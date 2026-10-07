"use client";

import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./button";

const styles = tv({
    base: "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    variants: {
        variant: {
            filled: "text-background hover:opacity-90",
            outlined: "border bg-transparent hover:bg-muted/10",
            ghost: "bg-transparent hover:bg-muted/10",
            soft: "",
            link: "underline-offset-4 hover:underline",
        },
        tone: { default: "", muted: "", primary: "", accent: "", danger: "", success: "", warning: "" },
        size: { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base", xl: "px-6 py-3 text-lg" },
        block: { true: "flex w-full", false: "" },
    },
    compoundVariants: [
        { variant: "filled", tone: ["default", "primary"], class: "bg-primary" },
        { variant: "filled", tone: "accent", class: "bg-accent" },
        { variant: "filled", tone: "danger", class: "bg-red-600" },
        { variant: "filled", tone: "success", class: "bg-green-700" },
        { variant: "filled", tone: "warning", class: "bg-amber-600" },
        { variant: "filled", tone: "muted", class: "bg-muted" },
        { variant: ["outlined", "ghost", "link"], tone: ["default", "primary"], class: "border-line text-primary" },
        { variant: ["outlined", "ghost", "link"], tone: "muted", class: "border-line text-muted" },
        { variant: ["outlined", "ghost", "link"], tone: "danger", class: "border-red-200 text-red-600" },
        { variant: ["outlined", "ghost", "link"], tone: "success", class: "border-green-200 text-green-700" },
        { variant: ["outlined", "ghost", "link"], tone: "accent", class: "border-line text-accent" },
        { variant: ["outlined", "ghost", "link"], tone: "warning", class: "border-amber-200 text-amber-700" },
        { variant: "soft", tone: ["default", "primary"], class: "bg-primary/10 text-primary" },
        { variant: "soft", tone: "muted", class: "bg-muted/10 text-muted" },
        { variant: "soft", tone: "danger", class: "bg-red-50 text-red-700" },
        { variant: "soft", tone: "success", class: "bg-green-50 text-green-800" },
        { variant: "soft", tone: "accent", class: "bg-accent/10 text-accent" },
        { variant: "soft", tone: "warning", class: "bg-amber-50 text-amber-800" },
    ],
    defaultVariants: { variant: "filled", tone: "primary", size: "md", block: false },
});

export default function Button ({ label, title, variant, tone, size, type = "button", pending, disabled, block, slots, emit }: Live<typeof contract>) {

    const text = typeof label === "string" || typeof label === "number" ? String(label) : "";
    const name = typeof title === "string" ? title : undefined;

    return (

        <button type={type} title={name} aria-label={name} disabled={disabled || pending} aria-busy={pending || undefined} onClick={() => emit("click")} className={styles({ variant, tone, size, block })}>

            {slots.children?.()}

            {pending ? `${text}…` : text}

        </button>

    );

}
