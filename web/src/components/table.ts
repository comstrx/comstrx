import { z } from "../lib/providers/schema.ts";
import { any, field, kind, tone, variant } from "../lib/spec/kinds.ts";

export default kind({
    is: "table",
    props: {
        columns: z.array(z.object({ name: field, label: any.optional(), format: z.enum(["plain", "date", "number", "money", "badge"]).optional() })).min(1),
        actions: z.array(z.object({ key: z.string(), label: any.optional(), icon: z.string().optional(), variant: variant.optional(), tone: tone.optional() })).optional(),
        empty: any.optional(),
        key: field.optional(),
    },
    events: { select: { id: z.unknown(), item: z.unknown() } },
    loose: true,
    client: true,
});
