import { z } from "../lib/providers/schema.ts";
import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "datatable",
    props: { columns: z.array(z.object({ key: z.string(), label: any })), rows: z.array(z.object({ key: z.string(), cells: z.record(z.string(), any) })) },
    slots: { actions: "each" },
    events: { select: { key: z.string() } },
    client: true,
});
