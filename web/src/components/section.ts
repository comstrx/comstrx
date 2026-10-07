import { any, kind, width } from "../lib/spec/kinds.ts";

export default kind({ is: "section", props: { title: any.optional(), description: any.optional(), width: width.optional() }, slots: { children: "one", aside: "one" } });
