import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "frame",
    props: { src: any.optional(), alt: any.optional(), fit: z.enum(["cover", "contain"]).optional() },
});
