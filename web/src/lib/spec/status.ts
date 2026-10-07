import type { Runtime } from "./kinds.ts";

export type Status = { loading: boolean; failed: boolean; empty: boolean; message: string; detail: string };

export function statusOf ( { state, t }: Pick<Runtime, "state" | "t"> ): Status {

    const failed = state.error !== null;
    const reason = state.error?.reason ?? state.error?.code ?? state.error?.kind ?? "";
    const known = reason ? t(`errors.${reason}`) : "";
    const fields = Object.entries(state.error?.errors ?? {}).map(( [name, texts] ) => `${name}: ${texts[0] ?? ""}`).join(" · ");

    return {
        loading: state.loading && (state.data === null || state.data === undefined),
        failed,
        empty: !failed && !state.loading && (state.data === null || (Array.isArray(state.data) && state.data.length === 0)),
        message: failed ? (known && known !== `errors.${reason}` ? known : state.error?.message ?? reason) : "",
        detail: fields,
    };

}
