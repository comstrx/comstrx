import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "divider",
    props: { label: any.optional() },
});
