import { z } from "../lib/providers/schema.ts";
import { any, columns, field, kind, tone, variant } from "../lib/spec/kinds.ts";

export default kind({
    is: "cards",
    props: {
        columns: columns.optional(),
        image: field.optional(),
        title: field.optional(),
        text: field.optional(),
        meta: field.optional(),
        price: field.optional(),
        badge: field.optional(),
        date: field.optional(),
        href: z.string().optional(),
        shape: z.enum(["square", "video", "wide", "portrait"]).optional(),
        empty: any.optional(),
        actions: z.array(z.object({ key: z.string(), label: any.optional(), icon: z.string().optional(), variant: variant.optional(), tone: tone.optional() })).optional(),
    },
    slots: { item: "each" },
    loose: true,
    raw: ["href"],
    client: true,
});
