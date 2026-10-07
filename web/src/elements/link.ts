import { any, flag, kind, size, tone, variant } from "../lib/spec/kinds.ts";

export default kind({
    is: "link",
    props: { href: any, label: any.optional(), variant: variant.optional(), tone: tone.optional(), size: size.optional(), block: flag.optional() },
    slots: { children: "one" },
});
