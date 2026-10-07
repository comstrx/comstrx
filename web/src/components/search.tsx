"use client";

import Block from "@/elements/block.tsx";
import Input from "@/elements/input.tsx";
import Link from "@/elements/link.tsx";
import Row from "@/elements/row.tsx";
import Text from "@/elements/text.tsx";
import { useSearch } from "@/hooks/use-search";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./search";

export default function Search ( live: Live<typeof contract> ) {

    const r = inert(live);
    const { query, setQuery, suggestions, submit, labelOf, hrefOf } = useSearch(live);

    return (

        <Block {...r} gap={2} width="narrow" slots={slot(
            <>
                <Input {...r} field="query" type="search" placeholder={live.placeholder} value={query} size="lg" emit={async ( event, payload ) => {

                    if ( event === "change" && payload && typeof payload === "object" && "value" in payload ) setQuery(String(payload.value));
                    if ( event === "submit" ) submit();

                }} />
                {suggestions.length ? (
                    <Block {...r} gap={1} padding={2} radius="md" surface slots={slot(suggestions.map(( item ) => (
                        <Row {...r} key={`${String(item.type ?? "")}-${String(item.id ?? labelOf(item))}`} gap={2} slots={slot(
                            hrefOf(item) ? <Link {...r} href={hrefOf(item)} label={labelOf(item)} variant="ghost" tone="default" /> : <Text {...r} value={labelOf(item)} size="sm" />,
                        )} />
                    )))} />
                ) : null}
            </>,
        )} />

    );

}
