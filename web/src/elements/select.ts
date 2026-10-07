import { z } from "../lib/providers/schema.ts";
import { any, flag, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "select",
    props: {
        field: z.string(),
        value: any.optional(),
        placeholder: any.optional(),
        options: z.array(z.object({ value: z.union([z.string(), z.number()]), label: any })).optional(),
        required: flag.optional(),
        disabled: flag.optional(),
        invalid: flag.optional(),
    },
    events: { change: { value: z.string() } },
    client: true,
});
