import { columns, kind, step } from "../lib/spec/kinds.ts";

export default kind({
    is: "grid",
    props: { columns: columns.optional(), gap: step.optional() },
    slots: { children: "one" },
});
