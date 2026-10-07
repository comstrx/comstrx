import { act, api, c, event, from, screen, site, split, state, t, zone } from "../../../src/lib/spec/define.ts";

export default screen({
    id: "checkout",
    path: "/checkout",
    access: "user",
    redirect: "/auth",
    state: { gateway: null, pay: "later", line: null },
    title: t("checkout.title"),
    description: t("checkout.description"),
    layout: [
        c.navbar({ brand: site("content.name"), links: [{ label: t("nav.home"), href: "/" }], account: "/account", login: "/auth" }),
        c.section({ title: t("checkout.title"), description: t("checkout.description"), width: "wide" }, [
            zone("cart", { read: api.get("cart").map({ data: "$", fields: { items: "data", summary: "meta.summary" } }) }, [
                split([2, 1], [
                    [
                        c.table("lines", { items: from("cart.items"), empty: t("checkout.empty"), columns: [
                            { name: "catalog.name", label: t("checkout.item") },
                            { name: "starts_at", label: t("checkout.date"), format: "date" },
                            { name: "quantity", label: t("checkout.quantity"), format: "number" },
                            { name: "total", label: t("checkout.total"), format: "money" },
                        ], actions: [
                            { key: "less", icon: "minus", variant: "outlined" },
                            { key: "more", icon: "plus", variant: "outlined" },
                            { key: "remove", label: t("checkout.remove"), variant: "ghost", tone: "danger" },
                            { key: "order", label: t("checkout.place_order") },
                        ], on: {
                            less: [act.call(api.post("cart/{cartId}/decrement", { cartId: event("id"), quantity: 1 })), act.refresh("cart")],
                            more: [act.call(api.post("cart/{cartId}/increment", { cartId: event("id"), quantity: 1 })), act.refresh("cart")],
                            remove: [act.call(api.del("cart/{cartId}", { cartId: event("id") })), act.refresh("cart")],
                            order: [act.set("line", event("id")), act.open("confirm")],
                        } }),
                        c.stats({ entries: [
                            { label: t("checkout.lines"), value: from("cart.summary.lines"), format: "number" },
                            { label: t("checkout.quantity"), value: from("cart.summary.quantity"), format: "number" },
                            { label: t("checkout.total"), value: from("cart.summary.subtotal"), format: "money" },
                        ] }),
                    ],
                    [
                        c.form("settle", { title: t("checkout.payment"), fields: [
                            { name: "gateway_id", type: "select", label: t("checkout.gateway"), bind: "gateway", options: api.get("gateways"), text: "label", required: true },
                            { name: "pay_type", type: "select", label: t("checkout.pay_type"), bind: "pay", options: [
                                { value: "later", label: t("checkout.pay_later") },
                                { value: "wallet", label: t("checkout.pay_wallet") },
                            ] },
                        ] }),
                    ],
                ], { gap: 8 }),
            ]),
        ]),
        c.confirm("confirm", { title: t("checkout.confirm_title"), text: t("checkout.confirm_text"), accept: t("checkout.place_order"), cancel: t("checkout.cancel"), on: {
            accept: [act.call(api.post("cart/{cartId}/checkout", { cartId: state("line"), gateway_id: state("gateway", "number"), pay_type: state("pay") })), act.close("confirm"), act.refresh("cart"), act.go("/account")],
        } }),
        c.footer({ brand: site("content.name"), text: site("content.copyright") }),
    ],
});
