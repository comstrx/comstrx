import { any, kind } from "../lib/spec/kinds.ts";

export default kind({ is: "card", props: { href: any.optional() }, slots: { media: "one", children: "one", footer: "one" } });
