import { any, kind, size } from "../lib/spec/kinds.ts";

export default kind({
    is: "avatar",
    props: { src: any.optional(), label: any.optional(), size: size.optional() },
});
