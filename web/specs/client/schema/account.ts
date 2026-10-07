import { act, api, c, eq, event, from, screen, site, split, stack, state, t, zone } from "../../../src/lib/spec/define.ts";

export default screen({
    id: "account",
    path: "/account",
    access: "user",
    redirect: "/auth",
    state: { tab: "profile", order: null },
    title: t("account.title"),
    description: t("account.description"),
    layout: [
        c.navbar({ brand: site("content.name"), links: [{ label: t("nav.home"), href: "/" }, { label: t("nav.checkout"), href: "/checkout" }], account: "/account", login: "/auth" }),
        zone("profile", { read: api.get("account") }, [
            c.section({ width: "wide" }, [
                c.header({ title: from("profile.user.name"), subtitle: from("profile.user.email"), image: from("profile.user.image") }, {
                    actions: [
                        c.action({ label: t("account.logout"), variant: "outlined", on: { click: [act.call(api.post("account/logout")), act.session(null), act.go("/")] } }),
                    ],
                }),
                split([1, 3], [
                    [
                        c.sidebar("menu", { value: state("tab"), entries: [
                            { key: "profile", label: t("account.profile"), icon: "user" },
                            { key: "orders", label: t("account.orders"), icon: "receipt" },
                            { key: "favorites", label: t("account.favorites"), icon: "heart" },
                        ], on: { select: [act.set("tab", event("key"))] } }),
                    ],
                    [
                        stack([
                            c.form("name", { title: t("account.profile"), action: api.put("account/name"), submit: t("account.save"), fields: [
                                { name: "name", label: t("auth.name"), value: from("profile.user.name"), required: true },
                            ], on: { success: [act.refresh("profile")] } }),
                            c.form("phone", { action: api.put("account/phone"), submit: t("account.save"), fields: [
                                { name: "phone", type: "tel", label: t("auth.phone"), value: from("profile.user.phone"), required: true },
                                { name: "password", type: "password", label: t("auth.password") },
                            ], on: { success: [act.refresh("profile")] } }),
                        ], { when: eq(state("tab"), "profile") }),
                        c.table("orders", { when: eq(state("tab"), "orders"), read: api.get("orders", { limit: 10 }), empty: t("account.no_orders"), columns: [
                            { name: "id", label: "#" },
                            { name: "name", label: t("account.order") },
                            { name: "status", label: t("account.status"), format: "badge" },
                            { name: "total_amount", label: t("checkout.total"), format: "money" },
                            { name: "created_at", label: t("account.date"), format: "date" },
                        ], on: { select: [act.set("order", event("id")), act.open("order")] } }),
                        c.cards("favorites", { when: eq(state("tab"), "favorites"), read: api.get("favorites", { limit: 12 }), columns: { base: 1, md: 3 }, title: "catalog.name", date: "created_at", empty: t("account.no_favorites"), actions: [
                            { key: "remove", label: t("product.unfavorite"), variant: "ghost" },
                        ], on: { remove: [act.call(api.del("favorites/{favoriteId}", { favoriteId: event("id") })), act.refresh("favorites")] } }),
                    ],
                ], { gap: 8 }),
            ]),
        ]),
        c.popup("order", { size: "lg", title: t("account.order") }, [
            c.details("receipt", { read: api.get("orders/{orderId}", { orderId: state("order") }), fields: [
                { name: "id", label: "#" },
                { name: "name", label: t("account.order") },
                { name: "status", label: t("account.status"), format: "badge" },
                { name: "payment_state", label: t("account.payment"), format: "badge" },
                { name: "total_amount", label: t("checkout.total"), format: "money" },
                { name: "created_at", label: t("account.date"), format: "date" },
            ] }),
        ]),
        c.footer({ brand: site("content.name"), text: site("content.copyright") }),
    ],
});
