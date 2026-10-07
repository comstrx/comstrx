import type { Route } from "next";
import NextImage from "next/image";
import NextLink from "next/link";
import { routing } from "@/lib/spec/config";
import type { Live } from "@/lib/spec/kinds";
import { localePath } from "@/lib/std/locale";
import { webUrl } from "@/lib/std/url";
import type contract from "./brand";

export default function Brand ({ label, logo, href, locale }: Live<typeof contract>) {

    const text = typeof label === "string" ? label : "";
    const image = typeof logo === "string" ? webUrl(logo) ?? (logo.startsWith("/") ? logo : undefined) : undefined;

    return (

        <NextLink href={localePath(locale, typeof href === "string" ? href : "/", routing) as Route} prefetch={false} className="flex items-center gap-2 text-lg font-bold text-foreground">

            {image ? <span className="relative size-8 overflow-hidden rounded-md"><NextImage src={image} alt="" fill sizes="32px" className="object-contain" /></span> : null}

            <span>{text}</span>

        </NextLink>

    );

}
