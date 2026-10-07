import type { Route } from "next";
import NextLink from "next/link";
import { tv } from "@/lib/providers/variants";
import { routing } from "@/lib/spec/config";
import type { Live } from "@/lib/spec/kinds";
import { localePath } from "@/lib/std/locale";
import type contract from "./link";

const styles = tv({
    base: "inline-flex items-center justify-center gap-2 font-medium transition",
    variants: {
        variant: {
            filled: "rounded-md px-4 py-2 text-background hover:opacity-90",
            outlined: "rounded-md border px-4 py-2 hover:bg-muted/10",
            ghost: "rounded-md px-3 py-2 hover:bg-muted/10",
            soft: "rounded-md px-4 py-2",
            link: "underline-offset-4 hover:underline",
        },
        tone: { default: "", muted: "", primary: "", accent: "", danger: "", success: "", warning: "" },
        size: { xs: "text-xs", sm: "text-sm", md: "text-sm", lg: "text-base", xl: "text-lg" },
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
    defaultVariants: { variant: "link", tone: "primary", size: "md", block: false },
});

export function hrefOf ( value: unknown, locale: string ): Route | undefined {

    if ( typeof value !== "string" || !value ) return undefined;
    if ( /^(?:https?:)?\/\//.test(value) || value.startsWith("mailto:") || value.startsWith("tel:") ) return value as Route;

    return localePath(locale, value, routing) as Route;

}
export default function Link ({ href, label, variant, tone, size, block, locale, slots }: Live<typeof contract>) {

    const to = hrefOf(href, locale);
    const text = typeof label === "string" || typeof label === "number" ? String(label) : "";
    const inner = slots.children?.() ?? text;

    if ( !to ) return <span className={styles({ variant, tone, size, block })}>{inner}</span>;

    return (

        <NextLink href={to} prefetch={false} className={styles({ variant, tone, size, block })}>{inner}</NextLink>

    );

}
