import type { Live } from "@/lib/spec/kinds";
import type contract from "./rating";

export default function Rating ({ value, count }: Live<typeof contract>) {

    const score = Number(value);

    if ( !Number.isFinite(score) || score <= 0 ) return null;

    const stars = "★".repeat(Math.round(Math.min(5, score))) + "☆".repeat(5 - Math.round(Math.min(5, score)));

    return (

        <span className="inline-flex items-center gap-1 text-sm text-amber-600">

            <span aria-hidden="true">{stars}</span>

            <span className="text-foreground">{score.toFixed(1)}</span>

            {typeof count === "number" && count > 0 ? <span className="text-muted">({count})</span> : null}

        </span>

    );

}
