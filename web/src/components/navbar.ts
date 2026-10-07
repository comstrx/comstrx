import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "navbar",
    props: { brand: any.optional(), logo: any.optional(), links: z.array(z.object({ label: any, href: z.string() })).optional(), account: z.string().optional(), login: z.string().optional() },
    client: true,
});
