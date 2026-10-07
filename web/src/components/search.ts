import { z } from "../lib/providers/schema.ts";
import { any, field, kind } from "../lib/spec/kinds.ts";
import { call } from "../lib/spec/shapes.ts";

export default kind({
    is: "search",
    props: { placeholder: any.optional(), suggest: call.optional(), label: field.optional(), href: z.string().optional(), to: z.string().optional(), min: z.number().int().min(1).max(10).optional() },
    events: { submit: { query: z.string() } },
    raw: ["href", "to"],
    client: true,
});
