import { z } from "../lib/providers/schema.ts";
import { any, flag, kind, size } from "../lib/spec/kinds.ts";

export default kind({
    is: "input",
    props: {
        field: z.string(),
        type: z.enum(["text", "email", "password", "tel", "number", "search", "date", "otp", "url"]).optional(),
        value: any.optional(),
        placeholder: any.optional(),
        required: flag.optional(),
        disabled: flag.optional(),
        invalid: flag.optional(),
        size: size.optional(),
    },
    events: { change: { value: z.string() }, submit: {} },
    client: true,
});
