"use client";

import { useState } from "react";
import type { Runtime } from "@/lib/spec/kinds";

type Settings = Pick<Runtime, "emit"> & { entries: readonly { key: string }[]; value?: unknown };

export function useTabs ( { entries, value, emit }: Settings ) {

    const [own, setOwn] = useState(entries[0]?.key ?? "");
    const active = typeof value === "string" && value ? value : own;

    return {
        active,
        select: ( payload: unknown ) => {

            const key = payload && typeof payload === "object" && "key" in payload ? String(payload.key) : "";

            if ( !key ) return;

            setOwn(key);
            emit("change", { key });

        },
    };

}
