"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import type { Runtime } from "@/lib/spec/kinds";
import { isCall, targetOf } from "@/lib/spec/runtime";
import type { CallData } from "@/lib/spec/shapes";
import { statusOf } from "@/lib/spec/status";
import { isRecord, pathGet } from "@/lib/std/object";

type Option = { value: string | number; label: unknown };
type Spec = { name: string; type?: string; value?: unknown; required?: boolean; bind?: string; options?: Option[] | CallData; text?: string };
type Settings = Pick<Runtime, "name" | "emit" | "locale" | "t" | "state"> & { action?: CallData; fields: readonly Spec[] };

function useRemoteOptions ( fields: readonly Spec[] ): Record<string, Option[]> {

    const api = useApi();
    const [loaded, setLoaded] = useState<Record<string, Option[]>>({});
    const key = JSON.stringify(fields.filter(( spec ) => isCall(spec.options)).map(( spec ) => ({ name: spec.name, options: spec.options, text: spec.text })));
    const remote = useMemo(() => JSON.parse(key) as Spec[], [key]);

    useEffect(() => {

        const controller = new AbortController();

        for ( const spec of remote ) {

            if ( !isCall(spec.options) ) continue;

            api.call(targetOf(spec.options), { signal: controller.signal }).then(( result ) => {

                const rows = Array.isArray(result.resource) ? result.resource.filter(isRecord) : [];
                const options = rows.map(( row ) => ({ value: String(row.id ?? ""), label: spec.text ? pathGet(row, spec.text) : row.name ?? row.label }));

                if ( !controller.signal.aborted ) setLoaded(( current ) => ({ ...current, [spec.name]: options }));

            }).catch(() => undefined);

        }

        return () => controller.abort();

    }, [remote, api]);

    return loaded;

}
export function useFormNode ( live: Settings ) {

    const remote = useRemoteOptions(live.fields);
    const form = useForm({ name: live.name ?? "form", action: live.action, fields: live.fields }, live.emit);
    const message = form.failure ? statusOf({ state: { data: null, items: [], loading: false, error: form.failure, reload: () => {} }, t: live.t }).message : "";

    return {
        form,
        message,
        optionsOf: ( spec: Spec ) => (Array.isArray(spec.options) ? spec.options : remote[spec.name] ?? []),
        submit: ( event?: FormEvent ) => form.submit(event),
    };

}
