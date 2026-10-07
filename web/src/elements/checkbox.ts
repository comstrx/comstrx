import { z } from "../lib/providers/schema.ts";
import { any, flag, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "checkbox",
    props: { field: z.string(), label: any.optional(), checked: flag.optional(), disabled: flag.optional() },
    events: { change: { value: z.boolean() } },
    client: true,
});
