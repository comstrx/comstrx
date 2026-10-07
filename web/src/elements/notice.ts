import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "notice",
    props: { kind: z.enum(["info", "empty", "error", "loading", "success", "offline"]).optional(), text: any.optional(), detail: any.optional() },
    slots: { children: "one" },
});
