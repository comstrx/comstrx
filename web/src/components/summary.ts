import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "summary",
    props: { badge: any.optional(), title: any.optional(), text: any.optional(), price: any.optional(), rating: any.optional(), count: any.optional() },
});
