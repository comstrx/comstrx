import { any, kind } from "../lib/spec/kinds.ts";

export default kind({
    is: "pin",
    props: { lat: any, lng: any, label: any.optional() },
});
