import { any, kind } from "../lib/spec/kinds.ts";

export default kind({ is: "map", props: { lat: any.optional(), lng: any.optional(), label: any.optional() } });
