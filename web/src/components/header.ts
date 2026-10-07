import { any, kind } from "../lib/spec/kinds.ts";

export default kind({ is: "header", props: { title: any.optional(), subtitle: any.optional(), image: any.optional() }, slots: { actions: "one" } });
