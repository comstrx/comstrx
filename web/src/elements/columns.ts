import { z } from "../lib/providers/schema.ts";
import { kind, step } from "../lib/spec/kinds.ts";

export default kind({
    is: "columns",
    props: { sizes: z.array(z.number().int().min(1).max(6)).min(1).max(6).optional(), gap: step.optional() },
    slots: { children: "one" },
});
