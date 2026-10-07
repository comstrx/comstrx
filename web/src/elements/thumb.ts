import { any, flag, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "thumb",
    props: { src: any.optional(), alt: any.optional(), active: flag.optional() },
    events: { click: {} },
    client: true,
});
