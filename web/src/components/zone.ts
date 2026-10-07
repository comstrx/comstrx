import { align, flag, kind, radius, step, width } from "../lib/spec/kinds.ts";

/** A named block of the screen: owns one read, shows its status, publishes its data to every `from("<name>.…")`. */
export default kind({ is: "zone", props: { gap: step.optional(), padding: step.optional(), width: width.optional(), align: align.optional(), radius: radius.optional(), surface: flag.optional() }, slots: { children: "one" } });
