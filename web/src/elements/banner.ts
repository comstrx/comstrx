import { kind, tone } from "../lib/spec/kinds.ts";

export default kind({ is: "banner", props: { tone: tone.optional() }, slots: { children: "one" } });
