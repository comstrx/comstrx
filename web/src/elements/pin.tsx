import type { Live } from "@/lib/spec/kinds";
import type contract from "./pin";

function coordinate ( value: unknown ): number | undefined {

    const number = Number(value);

    return value === null || value === "" || !Number.isFinite(number) ? undefined : number;

}
export default function Pin ({ lat, lng, label }: Live<typeof contract>) {

    const latitude = coordinate(lat);
    const longitude = coordinate(lng);

    if ( latitude === undefined || longitude === undefined ) return null;

    const box = `${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(box)}&layer=mapnik&marker=${latitude},${longitude}`;

    return (

        <figure className="flex flex-col gap-2">

            <iframe title={typeof label === "string" && label ? label : "map"} src={src} loading="lazy" className="aspect-video w-full rounded-lg border border-line" />

            {typeof label === "string" && label ? <figcaption className="text-sm text-muted">{label}</figcaption> : null}

        </figure>

    );

}
