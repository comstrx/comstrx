import { z } from "../lib/providers/schema.ts";
import { any, field, flag, kind } from "../lib/spec/kinds.ts";
import { call } from "../lib/spec/shapes.ts";

const option = z.object({ value: z.union([z.string(), z.number()]), label: any });
const spec = z.object({
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    type: z.enum(["text", "email", "password", "tel", "number", "search", "date", "otp", "url", "textarea", "select", "checkbox"]).optional(),
    label: any.optional(),
    placeholder: any.optional(),
    hint: any.optional(),
    value: any.optional(),
    required: flag.optional(),
    bind: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/).optional(),
    options: z.union([z.array(option), call]).optional(),
    text: field.optional(),
    rows: z.number().int().min(2).max(20).optional(),
});

export default kind({
    is: "form",
    props: { title: any.optional(), hint: any.optional(), action: call.optional(), fields: z.array(spec).min(1), submit: any.optional(), done: any.optional() },
    slots: { children: "one" },
    events: { success: {}, failure: {} },
    client: true,
});
