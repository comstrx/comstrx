import { z } from "../lib/providers/schema.ts";
import { any, kind, size } from "../lib/spec/kinds.ts";

export default kind({
    is: "price",
    props: { value: any.optional(), currency: z.string().optional(), size: size.optional() },
});
