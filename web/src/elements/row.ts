import { align, flag, kind, step } from "../lib/spec/kinds.ts";

export default kind({
    is: "row",
    props: { gap: step.optional(), align: align.optional(), justify: align.optional(), wrap: flag.optional() },
    slots: { children: "one" },
});
