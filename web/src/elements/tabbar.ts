import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "tabbar",
    props: { entries: z.array(z.object({ key: z.string(), label: any })), value: any.optional() },
    events: { select: { key: z.string() } },
    client: true,
});
