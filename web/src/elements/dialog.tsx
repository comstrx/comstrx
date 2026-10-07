"use client";

import { Dialog as Base } from "@/lib/providers/ui";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./dialog";

const styles = tv({
    base: "fixed inset-x-4 top-1/2 z-50 flex max-h-[90vh] -translate-y-1/2 flex-col gap-4 overflow-auto rounded-xl border border-line bg-surface p-6 shadow-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2",
    variants: { size: { sm: "sm:w-full sm:max-w-sm", md: "sm:w-full sm:max-w-lg", lg: "sm:w-full sm:max-w-3xl", full: "inset-4 w-auto max-h-none translate-y-0 sm:inset-6 sm:left-6 sm:max-w-none sm:translate-x-0" } },
    defaultVariants: { size: "md" },
});

export default function Dialog ({ shown, title, size, slots, emit }: Live<typeof contract>) {

    const heading = typeof title === "string" ? title : "";

    return (

        <Base.Root open={shown} onOpenChange={( open ) => { if ( !open ) emit("dismiss"); }}>

            <Base.Portal>

                <Base.Backdrop className="fixed inset-0 z-40 bg-black/40" />

                <Base.Popup className={styles({ size })}>

                    <div className="flex items-center justify-between gap-4">

                        <Base.Title className="text-lg font-semibold text-foreground">{heading}</Base.Title>

                        <Base.Close className="rounded-md px-2 py-1 text-muted hover:bg-muted/10" aria-label="Close">×</Base.Close>

                    </div>

                    <div className="flex flex-col gap-4">{slots.children?.()}</div>

                    {slots.footer ? <div className="flex justify-end gap-2">{slots.footer()}</div> : null}

                </Base.Popup>

            </Base.Portal>

        </Base.Root>

    );

}
