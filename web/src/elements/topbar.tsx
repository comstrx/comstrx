import type { Live } from "@/lib/spec/kinds";
import type contract from "./topbar";

export default function Topbar ({ slots }: Live<typeof contract>) {

    return (

        <header className="sticky top-0 z-30 border-b border-line bg-background/90 backdrop-blur">

            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">{slots.children?.()}</div>

        </header>

    );

}
