import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "popup",
    props: { title: any.optional(), size: z.enum(["sm", "md", "lg", "full"]).optional() },
    slots: { children: "one", footer: "one" },
    events: { close: {} },
    client: true,
});
