import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "stats",
    props: { entries: z.array(z.object({ label: any, value: any.optional(), format: z.enum(["plain", "date", "number", "money"]).optional() })).min(1) },
});
