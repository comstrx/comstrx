import { z } from "../lib/providers/schema.ts";
import { any, flag, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "field",
    props: { field: z.string(), label: any.optional(), hint: any.optional(), error: any.optional(), required: flag.optional() },
    slots: { children: "one" },
});
