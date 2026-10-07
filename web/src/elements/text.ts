import { z } from "../lib/providers/schema.ts";
import { any, flag, kind, size, tone } from "../lib/spec/kinds.ts";

export default kind({
    is: "text",
    props: { value: any.optional(), size: size.optional(), tone: tone.optional(), format: z.enum(["plain", "date", "number", "money", "lines"]).optional(), bold: flag.optional(), clamp: z.number().int().min(1).max(6).optional() },
});
