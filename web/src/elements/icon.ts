import { icon, kind, size, tone } from "../lib/spec/kinds.ts";

export default kind({
    is: "icon",
    props: { glyph: icon, size: size.optional(), tone: tone.optional() },
});
