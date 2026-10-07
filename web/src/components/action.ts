import { z } from "../lib/providers/schema.ts";
import { any, flag, kind, size, tone, variant } from "../lib/spec/kinds.ts";

export default kind({
    is: "action",
    props: { label: any, icon: z.string().optional(), href: z.string().optional(), variant: variant.optional(), tone: tone.optional(), size: size.optional(), disabled: flag.optional(), block: flag.optional() },
    events: { click: {} },
    client: true,
});
