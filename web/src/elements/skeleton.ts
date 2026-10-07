import { z } from "../lib/providers/schema.ts";
import { kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "skeleton",
    props: { lines: z.number().int().min(1).max(12).optional(), shape: z.enum(["lines", "card", "row"]).optional() },
});
