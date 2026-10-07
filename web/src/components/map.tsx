import Pin from "@/elements/pin.tsx";
import { inert, type Live } from "@/lib/spec/kinds";
import type contract from "./map";

export default function Place ( live: Live<typeof contract> ) {

    return <Pin {...inert(live)} lat={live.lat} lng={live.lng} label={live.label} />;

}
