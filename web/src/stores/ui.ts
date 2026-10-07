import { createStore } from "../lib/providers/store.ts";
import { isRecord } from "../lib/std/object.ts";

const effectModes = ["full", "reduced"] as const;

export type EffectMode = typeof effectModes[number];
export type SessionOrigin = "login" | "register";
export type SessionUser = { id: number; name?: string | null; email?: string | null; language?: string | null; currency?: string | null; theme?: string | null; [key: string]: unknown };
export type SessionReply = { token: string; user: SessionUser };

export type UiState = {
    effects: EffectMode; setEffects: ( effects: EffectMode ) => void;
    currency: string; setCurrency: ( currency: string ) => void;
    ready: boolean; token: string | null; user: SessionUser | null; origin: SessionOrigin | null;
    session: ( token: string | null, user: SessionUser | null ) => void;
    join: ( token: string, user: SessionUser, origin: SessionOrigin ) => void;
    settle: () => void;
    hydrate: () => void;
};

export function isSessionUser ( value: unknown ): value is SessionUser {

    return isRecord(value) && typeof value.id === "number" && ["name", "email", "language", "currency", "theme"].every(( key ) => value[key] == null || typeof value[key] === "string");

}
export function sessionReply ( value: unknown ): SessionReply | undefined {

    return isRecord(value) && typeof value.token === "string" && value.token.length > 0 && isSessionUser(value.user) ? { token: value.token, user: value.user } : undefined;

}
export function createUiStore ( currency: string ) {

    return createStore<UiState>()(( set ) => ({
        effects: "full",
        setEffects: ( effects ) => set({ effects }),
        currency,
        setCurrency: ( next ) => set({ currency: next }),
        ready: false,
        token: null,
        user: null,
        origin: null,
        session: ( token, user ) => set({ token, user, origin: null }),
        join: ( token, user, origin ) => set({ token, user, origin }),
        settle: () => set({ origin: null }),
        hydrate: () => set({ ready: true }),
    }));

}
