import { any, kind } from "../lib/spec/kinds.ts";

export default kind({ is: "footer", props: { brand: any.optional(), text: any.optional() } });
