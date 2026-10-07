import Area from "@/elements/area.tsx";
import { inert, type Live } from "@/lib/spec/kinds";
import type contract from "./section";

export default function Section ( live: Live<typeof contract> ) {

    return <Area {...inert(live)} title={live.title} description={live.description} width={live.width} slots={live.slots} />;

}
