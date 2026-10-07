import { api, c, screen, site, t } from "../../../src/lib/spec/define.ts";

export default screen({
    id: "home",
    path: "/",
    title: t("home.title"),
    description: t("home.description"),
    layout: [
        c.navbar({ brand: site("content.name"), links: [{ label: t("nav.home"), href: "/" }, { label: t("nav.checkout"), href: "/checkout" }], account: "/account", login: "/auth" }),
        c.hero({ title: site("content.name"), subtitle: t("home.title"), text: t("home.description") }, [
            c.search("quick", { placeholder: t("home.search"), suggest: api.get("search/suggest", { limit: 6 }), label: "label", href: "/details/{item.id}" }),
        ]),
        c.section({ title: t("home.categories") }, [
            c.cards("categories", { read: api.get("home/recently-categories", { limit: 8 }), columns: { base: 2, md: 4 }, image: "image", title: "name", meta: "catalogs", shape: "square", empty: t("home.empty") }),
        ]),
        c.section({ title: t("home.products"), description: t("home.products_hint") }, [
            c.cards("products", { read: api.get("home/recently-catalogs", { limit: 8 }), columns: { base: 1, sm: 2, lg: 4 }, image: "image", title: "name", price: "min_price", badge: "type", href: "/details/{item.id}-{item.slug}", empty: t("home.empty") }),
        ]),
        c.section({ title: t("home.offers") }, [
            c.cards("offers", { read: api.get("home/recently-offers", { limit: 4 }), columns: { base: 1, md: 2 }, title: "name", text: "description", date: "expires_at", empty: t("home.empty") }),
        ]),
        c.footer({ brand: site("content.name"), text: site("content.copyright") }),
    ],
});
