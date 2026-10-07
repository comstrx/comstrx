import { align, flag, kind, radius, shadow, step, width } from "../lib/spec/kinds.ts";

export default kind({
    is: "block",
    props: { gap: step.optional(), padding: step.optional(), width: width.optional(), align: align.optional(), radius: radius.optional(), shadow: shadow.optional(), surface: flag.optional(), center: flag.optional() },
    slots: { children: "one" },
});
