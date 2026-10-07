import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "rating",
    props: { value: any.optional(), count: any.optional() },
});
