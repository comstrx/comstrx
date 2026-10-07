import { any, field, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "comments",
    props: { author: field.optional(), avatar: field.optional(), text: field.optional(), rating: field.optional(), date: field.optional(), empty: any.optional() },
});
