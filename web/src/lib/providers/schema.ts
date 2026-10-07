import { z } from "zod";

if ( typeof window !== "undefined" ) z.config({ jitless: true });

export type { JSONSchema } from "zod/v4/core";
export { z };
