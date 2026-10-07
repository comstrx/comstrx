import Block from "@/elements/block.tsx";
import Stat from "@/elements/stat.tsx";
import { formatted } from "@/elements/text.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./stats";

export default function Stats ( live: Live<typeof contract> ) {

    const r = inert(live);

    return (

        <Block {...r} gap={0} padding={4} radius="lg" surface slots={slot(
            live.entries.map(( item ) => <Stat {...r} key={String(item.label)} label={item.label} value={formatted(item.value, item.format, live.locale)} />),
        )} />

    );

}
