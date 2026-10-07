import type { Point } from "./geo.ts";

export type Area = "local" | "session";

export function media ( query: string ) {

    return {
        subscribe ( listener: () => void ) {

            const match = window.matchMedia(query);

            match.addEventListener("change", listener);
            return () => match.removeEventListener("change", listener);

        },
        getSnapshot: () => window.matchMedia(query).matches,
        getServerSnapshot: () => false,
    };

}
function area ( name: Area ): Storage | undefined {

    try {

        return name === "local" ? globalThis.localStorage : globalThis.sessionStorage;

    }
    catch {

        return undefined;

    }

}
export function storage ( name: Area ) {

    return {
        read ( key: string ): unknown {

            try {

                const raw = area(name)?.getItem(key);

                return raw ? JSON.parse(raw) as unknown : undefined;

            }
            catch {

                return undefined;

            }

        },
        write ( key: string, value: unknown ): void {

            try {

                if ( value === undefined || value === null ) {

                    area(name)?.removeItem(key);
                    return;

                }

                area(name)?.setItem(key, JSON.stringify(value));

            }
            catch {}

        },
    };

}
export function onFirstGesture ( run: () => void ): () => void {

    const controller = new AbortController();
    const fire = () => {

        controller.abort();
        run();

    };

    for ( const name of ["pointerdown", "keydown"] ) {

        window.addEventListener(name, fire, { passive: true, signal: controller.signal });

    }

    return () => controller.abort();

}
export function locate ( remember: ( location: Point | null ) => void ): void {

    navigator.geolocation.getCurrentPosition(
        ( { coords } ) => remember({ latitude: coords.latitude, longitude: coords.longitude }),
        ( error ) => { if ( error.code === error.PERMISSION_DENIED ) remember(null); },
        { maximumAge: 600000, timeout: 15000 },
    );

}
