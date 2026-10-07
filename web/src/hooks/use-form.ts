"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { usePage, usePageStore } from "@/hooks/use-page";
import { useCommand } from "@/hooks/use-request";
import type { Failure, Runtime } from "@/lib/spec/kinds";
import { failureOf, targetOf } from "@/lib/spec/runtime";
import type { CallData } from "@/lib/spec/shapes";

export type FieldSpec = { name: string; type?: string; bind?: string; value?: unknown; required?: boolean };
export type FormHandle = {
    values: Record<string, unknown>;
    errors: Record<string, string[]>;
    failure: Failure | null;
    pending: boolean;
    done: boolean;
    setValue: ( name: string, value: unknown ) => void;
    submit: ( event?: FormEvent ) => void;
    reset: () => void;
};
type Definition = { name: string; action?: CallData; fields: readonly FieldSpec[] };

function initial ( fields: readonly FieldSpec[], state: Record<string, unknown> ): Record<string, unknown> {

    return Object.fromEntries(fields.map(( field ) => [field.name, field.bind ? state[field.bind] ?? field.value : field.value]));

}
function coerced ( values: Record<string, unknown>, fields: readonly FieldSpec[] ): Record<string, unknown> {

    const types = new Map(fields.map(( field ) => [field.name, field.type]));
    const entries = Object.entries(values).map(( [name, value] ) => {

        if ( value === "" || value === undefined || value === null ) return [name, undefined];
        if ( types.get(name) === "number" || (types.get(name) === "select" && String(value).trim() !== "" && Number.isFinite(Number(value))) ) return [name, Number(value)];
        if ( types.get(name) === "checkbox" ) return [name, value === true || value === "true"];

        return [name, value];

    });

    return Object.fromEntries(entries.filter(( [, value] ) => value !== undefined));

}
function given ( action: CallData | undefined ): Record<string, unknown> {

    return Object.fromEntries(Object.entries(action?.input ?? {}).filter(( [, value] ) => value !== undefined && value !== null));

}
export function useForm ( definition: Definition, emit: Runtime["emit"] ): FormHandle {

    const api = useApi();
    const store = usePageStore();
    const command = useCommand();
    const state = usePage(( page ) => page.state);
    const [values, setValues] = useState<Record<string, unknown>>(() => initial(definition.fields, state));
    const [done, setDone] = useState(false);
    const { action, fields } = definition;
    const reset = useCallback(() => { setValues(initial(fields, store.getState().state)); setDone(false); command.clear(); }, [fields, store, command.clear]);

    const setValue = useCallback(( name: string, value: unknown ) => {

        const bound = fields.find(( field ) => field.name === name)?.bind;

        setValues(( current ) => ({ ...current, [name]: value }));

        if ( bound ) store.getState().set(bound, value);

    }, [fields, store]);

    const submit = useCallback(( event?: FormEvent ) => {

        event?.preventDefault();

        if ( !action ) return;

        const payload = { ...given(action), ...coerced(values, fields) };

        command.run(JSON.stringify(payload), ( { signal, idempotencyKey } ) => api.call(targetOf(action, payload), { signal, idempotencyKey })).then(( result ) => {

            if ( result === undefined ) return emit("failure");

            setDone(true);

            return emit("success", result.resource);

        }).catch(() => undefined);

    }, [action, fields, values, command.run, api, emit]);

    useEffect(() => {

        store.getState().register(definition.name, { reset, values });

        return () => store.getState().release(definition.name);

    }, [store, definition.name, reset, values]);

    return { values, errors: command.error?.errors ?? {}, failure: command.error ? failureOf(command.error) : null, pending: command.pending, done, setValue, submit, reset };

}
