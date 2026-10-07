import { any, kind, tone } from "../lib/spec/kinds.ts";

export default kind({ is: "hero", props: { title: any.optional(), subtitle: any.optional(), text: any.optional(), tone: tone.optional() }, slots: { children: "one" } });
