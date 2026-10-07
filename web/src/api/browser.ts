"use client";

import type { UploadLimits } from "../lib/std/form.ts";
import { mapValues } from "../lib/std/object.ts";
import type { ApiClient, RequestOptions, SystemClient } from "./client.ts";
import type { LiveTopic } from "./contract.ts";
import { ApiError } from "./error.ts";
import type { Socket } from "./realtime.ts";
import type { remoteApi, Values, Watch } from "./remote.ts";
import type { ApiResult } from "./response.ts";
import { system } from "./system.ts";

type Remote = ReturnType<typeof remoteApi>;
type Load = () => Promise<Remote>;
type Loading = { pending?: Promise<Remote> };
type Live = { closed: boolean; close: () => void };
type Realtime = { realtime: { subscribe: ( topic: LiveTopic, options: Watch ) => () => void } };

export type BrowserApi = ApiClient & Realtime;

function loader ( values: Values, limits?: UploadLimits, socket?: Socket ): Load {

    const loading: Loading = {};

    return () => loading.pending ??= import("./remote.ts").then(( module ) => module.remoteApi(values, limits, socket), ( error: unknown ) => {

        loading.pending = undefined;
        throw error;

    });

}
function members ( load: Load ): SystemClient {

    const known: Record<string, Record<string, unknown>> = system;
    const typed = mapValues(known, ( operations, feature ) => mapValues(operations, ( _, operation ) => {

        return async ( input?: unknown, options?: RequestOptions ) => {

            const client = (await load()).api as unknown as Record<string, Record<string, ( input?: unknown, options?: RequestOptions ) => Promise<ApiResult<unknown>>>>;

            return client[feature]?.[operation]?.(input, options) ?? Promise.reject(new ApiError("input"));

        };

    }));

    return typed as SystemClient;

}
function subscribe ( load: Load, topic: LiveTopic, options: Watch ): () => void {

    const live: Live = { closed: false, close: () => {} };

    load().then(( remote ) => {

        if ( !live.closed ) live.close = remote.subscribe(topic, options);

    }).catch(() => options.onStatus?.(false));

    return () => {

        live.closed = true;
        live.close();

    };

}
export function browserApi ( values: Values, limits?: UploadLimits, socket?: Socket ): BrowserApi {

    const load = loader(values, limits, socket);

    return {
        ...members(load),
        call: async ( target, options ) => (await load()).api.call(target, options),
        realtime: { subscribe: ( topic, options ) => subscribe(load, topic, options) },
    };

}
