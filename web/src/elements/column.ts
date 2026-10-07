import { align, kind, step, width } from "../lib/spec/kinds.ts";

export default kind({
    is: "column",
    props: { gap: step.optional(), align: align.optional(), width: width.optional() },
    slots: { children: "one" },
});
