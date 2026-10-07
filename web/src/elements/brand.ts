import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "brand",
    props: { label: any.optional(), logo: any.optional(), href: any.optional() },
});
