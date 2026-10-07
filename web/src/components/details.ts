import { z } from "../lib/providers/schema.ts";
import { any, field, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "details",
    props: { fields: z.array(z.object({ name: field, label: any.optional(), format: z.enum(["plain", "date", "number", "money", "badge"]).optional() })).min(1), empty: any.optional() },
    client: true,
});
