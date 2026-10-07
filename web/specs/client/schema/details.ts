import { act, api, auth, c, event, from, is, not, row, screen, site, split, state, t, zone } from "../../../src/lib/spec/define.ts";

export default screen({
    id: "details",
    path: "/details/:productId",
    feed: "catalogs",
    state: { image: 0 },
    title: t("product.title"),
    description: t("product.description"),
    seo: { zone: "product", title: from("product.name"), description: from("product.description"), image: from("product.image") },
    layout: [
        c.navbar({ brand: site("content.name"), links: [{ label: t("nav.home"), href: "/" }, { label: t("nav.checkout"), href: "/checkout" }], account: "/account", login: "/auth" }),
        zone("product", { read: api.get("catalogs/{productId}").cache(30) }, [
            c.section({ width: "wide" }, [
                split([1, 1], [
                    [
                        c.gallery("gallery", { images: from("product.attachments"), cover: from("product.image"), alt: from("product.name"), on: { select: [act.set("image", event("index")), act.open("viewer")] } }),
                    ],
                    [
                        c.summary({ badge: from("product.type"), title: from("product.name"), text: from("product.description"), price: from("product.min_price"), rating: from("product.rating"), count: from("product.reviews") }),
                        zone("personal", { read: api.get("catalogs/{productId}"), when: auth() }, [
                            row([
                                c.action({ label: t("product.add_to_cart"), when: not(from("personal.in_cart")), on: { click: [act.call(api.post("catalogs/{productId}/cart", { quantity: 1, starts_at: from("personal.starts_at", "date") })), act.refresh("personal")] } }),
                                c.action({ label: t("product.in_cart"), href: "/checkout", variant: "soft", when: is(from("personal.in_cart")) }),
                                c.action({ label: t("product.favorite"), variant: "outlined", when: not(from("personal.in_favorites")), on: { click: [act.call(api.post("catalogs/{productId}/favorite")), act.refresh("personal")] } }),
                                c.action({ label: t("product.unfavorite"), variant: "ghost", when: is(from("personal.in_favorites")), on: { click: [act.call(api.post("catalogs/{productId}/unfavorite")), act.refresh("personal")] } }),
                            ], { gap: 2 }),
                        ]),
                        c.action({ label: t("product.sign_in_to_buy"), href: "/auth", when: auth(false) }),
                        c.map({ lat: from("product.geo.latitude"), lng: from("product.geo.longitude"), label: from("product.geo.address"), when: is(from("product.geo")) }),
                    ],
                ], { gap: 8 }),
            ]),
            c.section({ title: t("product.reviews") }, [
                c.comments("reviews", { read: api.get("catalogs/{productId}/reviews", { limit: 6 }), author: "user.name", text: "content", rating: "rating", date: "created_at", empty: t("product.no_reviews") }),
            ]),
            c.section({ title: t("product.similar") }, [
                c.cards("similar", { read: api.get("catalogs/{productId}/similar", { limit: 4 }), columns: { base: 1, sm: 2, lg: 4 }, image: "image", title: "name", price: "min_price", href: "/details/{item.id}-{item.slug}", empty: t("product.no_similar") }),
            ]),
        ]),
        c.popup("viewer", { size: "full", title: from("product.name") }, [
            c.viewer({ images: from("product.attachments"), cover: from("product.image"), index: state("image"), alt: from("product.name") }),
        ]),
        c.footer({ brand: site("content.name"), text: site("content.copyright") }),
    ],
});
