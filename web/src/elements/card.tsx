import type { Route } from "next";
import NextLink from "next/link";
import { routing } from "@/lib/spec/config";
import type { Live } from "@/lib/spec/kinds";
import { localePath } from "@/lib/std/locale";
import type contract from "./card";

export default function Card ({ href, locale, slots }: Live<typeof contract>) {

    const body = (
        <>
            {slots.media?.()}
            <div className="flex flex-1 flex-col gap-2 p-4">{slots.children?.()}</div>
            {slots.footer ? <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">{slots.footer()}</div> : null}
        </>
    );
    const frame = "flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition";

    if ( typeof href === "string" && href ) return <NextLink href={localePath(locale, href, routing) as Route} prefetch={false} className={`${frame} hover:shadow-md`}>{body}</NextLink>;

    return <article className={frame}>{body}</article>;

}
