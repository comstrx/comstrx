import { z } from "../lib/providers/schema.ts";
import { any, kind, tone } from "../lib/spec/kinds.ts";

export default kind({
    is: "heading",
    props: { value: any.optional(), level: z.number().int().min(1).max(4).optional(), tone: tone.optional() },
});
