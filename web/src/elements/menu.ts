import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "menu",
    props: { entries: z.array(z.object({ key: z.string(), label: any, icon: z.string().optional(), href: z.string().optional() })), value: any.optional(), direction: z.enum(["row", "column"]).optional() },
    events: { select: { key: z.string() } },
    client: true,
});
