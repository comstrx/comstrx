import type { Live } from "@/lib/spec/kinds";
import type contract from "./footbar";

export default function Footbar ({ slots }: Live<typeof contract>) {

    return (

        <footer className="mt-12 border-t border-line bg-surface">

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted">{slots.children?.()}</div>

        </footer>

    );

}
