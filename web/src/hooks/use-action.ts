"use client";

import type { Runtime } from "@/lib/spec/kinds";
import { statusOf } from "@/lib/spec/status";

type Settings = Pick<Runtime, "emit" | "busy" | "failure" | "t">;

export function useAction ( { emit, busy, failure, t }: Settings ) {

    const message = failure ? statusOf({ state: { data: null, items: [], loading: false, error: failure, reload: () => {} }, t }).message : "";

    return { pending: busy, failure: message, click: () => { emit("click").catch(() => undefined); } };

}
