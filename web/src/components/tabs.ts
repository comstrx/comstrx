import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "tabs",
    props: { entries: z.array(z.object({ key: z.string(), label: any })).min(1), value: any.optional() },
    slots: { children: "one" },
    events: { change: { key: z.string() } },
    client: true,
});
