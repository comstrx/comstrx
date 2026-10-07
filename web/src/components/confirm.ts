import { any, kind, tone } from "../lib/spec/kinds.ts";

export default kind({
    is: "confirm",
    props: { title: any.optional(), text: any.optional(), accept: any.optional(), cancel: any.optional(), tone: tone.optional() },
    events: { accept: {}, cancel: {} },
    client: true,
});
