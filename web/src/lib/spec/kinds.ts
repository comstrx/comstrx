import type { ComponentType, ReactNode } from "react";
import { z } from "../providers/schema.ts";

export type Slot = "one" | "each";
export type Events = Record<string, z.ZodObject>;
export type Kind<P extends z.ZodRawShape = z.ZodRawShape, E extends Events = Events> = {
    is: string;
    props: z.ZodObject<P>;
    slots: Record<string, Slot>;
    events: E;
    loose: boolean;
    raw: readonly string[];
    client: boolean;
};
export type Definition<P extends z.ZodRawShape, E extends Record<string, z.ZodRawShape>> = {
    is: string;
    props: P;
    slots?: Record<string, Slot>;
    events?: E;
    loose?: boolean;
    raw?: readonly string[];
    client?: boolean;
};
export type Catalogue = Readonly<Record<string, Kind>>;
export type Loaded = { default: ComponentType<never> };
export type Registry = Readonly<Record<string, () => Promise<Loaded>>>;
export type Failure = { kind: string; status: number; reason?: string; code?: string; message?: string; errors: Record<string, string[]> };
export type Scope = Partial<Record<string, unknown>>;
export type Runtime = {
    slots: Record<string, ( extra?: Scope ) => ReactNode>;
    state: { data: unknown; items: unknown[]; loading: boolean; error: Failure | null; reload: () => void };
    emit: ( event: string, payload?: unknown ) => Promise<void>;
    busy: boolean;
    failure: Failure | null;
    open: boolean;
    close: () => void;
    locale: string;
    t: ( key: string ) => string;
    name?: string;
};
export type Live<K extends Kind> = z.output<K["props"]> & Runtime;
export type Inert = Omit<Runtime, "name">;

const idle: Runtime["state"] = { data: undefined, items: [], loading: false, error: null, reload: () => {} };

export function inert ( runtime: Pick<Runtime, "locale" | "t"> & Partial<Runtime> ): Inert {

    return { slots: {}, state: runtime.state ?? idle, emit: async () => {}, busy: false, failure: null, open: false, close: () => {}, locale: runtime.locale, t: runtime.t };

}
export function slot ( children: ReactNode ): Record<string, () => ReactNode> {

    return { children: () => children };

}

export const reserved = ["id", "name", "when", "on", "read", "items", "watch", "layout"] as const;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const tones = ["default", "muted", "primary", "accent", "danger", "success", "warning"] as const;
const variants = ["filled", "outlined", "ghost", "soft", "link"] as const;
const widths = ["auto", "full", "half", "third", "two-thirds", "quarter", "narrow", "wide"] as const;
const aligns = ["start", "center", "end", "between", "stretch"] as const;
const steps = [0, 1, 2, 3, 4, 6, 8, 12] as const;
const breakpoints = ["base", "sm", "md", "lg", "xl"] as const;

export const size = z.enum(sizes);
export const tone = z.enum(tones);
export const variant = z.enum(variants);
export const width = z.enum(widths);
export const align = z.enum(aligns);
export const step = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(6), z.literal(8), z.literal(12)]);
export const columns = z.union([z.number().int().min(1).max(6), z.partialRecord(z.enum(breakpoints), z.number().int().min(1).max(6))]);
export const radius = z.enum(["none", "sm", "md", "lg", "xl", "full"]);
export const shadow = z.enum(["none", "sm", "md", "lg"]);
export const text = z.union([z.string(), z.number()]);
export const flag = z.boolean();
export const any = z.unknown();
export const href = z.string();
export const icon = z.string().regex(/^[a-z][a-z0-9-]*$/);
export const field = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_.]*$/);

export type Size = typeof sizes[number];
export type Tone = typeof tones[number];
export type Variant = typeof variants[number];
export type Width = typeof widths[number];
export type Align = typeof aligns[number];
export type Step = typeof steps[number];
export type Breakpoint = typeof breakpoints[number];
export type Columns = z.output<typeof columns>;

export function kind<const P extends z.ZodRawShape, const E extends Record<string, z.ZodRawShape> = Record<never, never>> ( definition: Definition<P, E> ) {

    const taken = Object.keys(definition.props).filter(( key ) => reserved.includes(key as typeof reserved[number]));

    if ( taken.length ) throw new Error(`${definition.is}: ${taken.join(", ")} are node keys, not props.`);

    const events = Object.fromEntries(Object.entries(definition.events ?? {}).map(( [name, shape] ) => [name, z.object(shape)]));

    return {
        is: definition.is,
        props: z.strictObject(definition.props),
        slots: definition.slots ?? {},
        events: events as { [K in keyof E]: z.ZodObject<E[K]> },
        loose: definition.loose ?? false,
        raw: definition.raw ?? [],
        client: definition.client ?? false,
    };

}
