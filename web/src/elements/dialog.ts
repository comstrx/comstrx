import { z } from "../lib/providers/schema.ts";
import { any, flag, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "dialog",
    props: { shown: flag, title: any.optional(), size: z.enum(["sm", "md", "lg", "full"]).optional() },
    slots: { children: "one", footer: "one" },
    events: { dismiss: {} },
    client: true,
});
