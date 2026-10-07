import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "gallery",
    props: { images: any.optional(), cover: any.optional(), alt: any.optional() },
    events: { select: { index: z.number() } },
    client: true,
});
