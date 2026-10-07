import { any, kind, tone } from "../lib/spec/kinds.ts";

export default kind({
    is: "badge",
    props: { value: any.optional(), tone: tone.optional() },
});
