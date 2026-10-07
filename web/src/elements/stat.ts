import { any, flag, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "stat",
    props: { label: any, value: any.optional(), badge: flag.optional() },
});
