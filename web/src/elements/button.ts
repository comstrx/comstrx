import { z } from "../lib/providers/schema.ts";
import { any, flag, kind, size, tone, variant } from "../lib/spec/kinds.ts";

export default kind({
    is: "button",
    props: { label: any.optional(), title: any.optional(), variant: variant.optional(), tone: tone.optional(), size: size.optional(), type: z.enum(["button", "submit", "reset"]).optional(), pending: flag.optional(), disabled: flag.optional(), block: flag.optional() },
    slots: { children: "one" },
    events: { click: {} },
    client: true,
});
