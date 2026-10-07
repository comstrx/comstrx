import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "sidebar",
    props: { entries: z.array(z.object({ key: z.string(), label: any, icon: z.string().optional(), href: z.string().optional() })).min(1), value: any.optional(), title: any.optional() },
    events: { select: { key: z.string() } },
    client: true,
});
