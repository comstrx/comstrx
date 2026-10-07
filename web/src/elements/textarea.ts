import { z } from "../lib/providers/schema.ts";
import { any, flag, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "textarea",
    props: { field: z.string(), value: any.optional(), placeholder: any.optional(), rows: z.number().int().min(2).max(20).optional(), required: flag.optional(), disabled: flag.optional(), invalid: flag.optional() },
    events: { change: { value: z.string() } },
    client: true,
});
