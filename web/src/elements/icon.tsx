import { CaretLeft, CaretRight, Check, Heart, House, MagnifyingGlass, MapPin, Minus, Plus, Receipt, ShoppingCart, SignOut, User, X } from "@/lib/providers/icons";
import { tv } from "@/lib/providers/variants";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./icon";

const glyphs = {
    "caret-left": CaretLeft,
    "caret-right": CaretRight,
    check: Check,
    heart: Heart,
    house: House,
    search: MagnifyingGlass,
    pin: MapPin,
    minus: Minus,
    plus: Plus,
    receipt: Receipt,
    cart: ShoppingCart,
    "sign-out": SignOut,
    user: User,
    close: X,
};
const styles = tv({
    base: "shrink-0",
    variants: {
        size: { xs: "size-3", sm: "size-4", md: "size-5", lg: "size-6", xl: "size-8" },
        tone: { default: "text-current", muted: "text-muted", primary: "text-primary", accent: "text-accent", danger: "text-red-600", success: "text-green-700", warning: "text-amber-700" },
    },
    defaultVariants: { size: "md", tone: "default" },
});

export type IconName = keyof typeof glyphs;

export default function Icon ({ glyph, size, tone }: Live<typeof contract>) {

    const Glyph = Object.hasOwn(glyphs, glyph) ? glyphs[glyph as IconName] : undefined;

    if ( !Glyph ) return null;

    return <Glyph className={styles({ size, tone })} aria-hidden="true" />;

}
