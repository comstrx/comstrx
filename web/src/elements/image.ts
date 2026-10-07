import { z } from "../lib/providers/schema.ts";
import { any, kind, radius } from "../lib/spec/kinds.ts";

export default kind({
    is: "image",
    props: { src: any.optional(), alt: any.optional(), ratio: z.enum(["square", "video", "wide", "portrait", "auto"]).optional(), radius: radius.optional(), eager: z.boolean().optional() },
});
