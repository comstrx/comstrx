import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "viewer",
    props: { images: any.optional(), cover: any.optional(), index: z.number().int().min(0).optional(), alt: any.optional() },
    client: true,
});
