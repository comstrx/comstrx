import { act, all, any, api, c, eq, event, is, not, screen, site, state, t } from "../../../src/lib/spec/define.ts";

export default screen({
    id: "auth",
    path: "/auth",
    access: "guest",
    redirect: "/account",
    state: { mode: "login", challenge: null },
    title: t("auth.title"),
    description: t("auth.login_hint"),
    layout: [
        c.navbar({ brand: site("content.name"), links: [{ label: t("nav.home"), href: "/" }], account: "/account", login: "/auth" }),
        c.section({ title: t("auth.title"), width: "narrow" }, [
            c.tabs("mode", { value: state("mode"), entries: [
                { key: "login", label: t("auth.login") },
                { key: "register", label: t("auth.register") },
                { key: "forgot", label: t("auth.forgot") },
            ], on: { change: [act.set("mode", event("key")), act.set("challenge", null)] } }),
            c.form("login", { when: all(eq(state("mode"), "login"), not(state("challenge"))), action: api.post("auth/login"), submit: t("auth.login"), fields: [
                { name: "email", type: "email", label: t("auth.email"), required: true },
                { name: "password", type: "password", label: t("auth.password"), required: true },
            ], on: { success: [act.session(event()), act.set("challenge", event("challenge_token"))] } }),
            c.form("register", { when: all(eq(state("mode"), "register"), not(state("challenge"))), action: api.post("auth/register"), submit: t("auth.register"), fields: [
                { name: "name", label: t("auth.name"), required: true },
                { name: "email", type: "email", label: t("auth.email"), required: true },
                { name: "phone", type: "tel", label: t("auth.phone"), required: true },
                { name: "password", type: "password", label: t("auth.password"), required: true },
                { name: "password_confirmation", type: "password", label: t("auth.password_confirmation"), required: true },
            ], on: { success: [act.session(event()), act.set("challenge", event("challenge_token"))] } }),
            c.form("forgot", { when: all(eq(state("mode"), "forgot"), not(state("challenge"))), action: api.post("auth/recovery"), submit: t("auth.send_code"), hint: t("auth.forgot_hint"), fields: [
                { name: "email", type: "email", label: t("auth.email"), required: true },
            ], on: { success: [act.set("challenge", event("challenge_token"))] } }),
            c.form("verify", { when: all(any(eq(state("mode"), "login"), eq(state("mode"), "register")), is(state("challenge"))), action: api.post("auth/verify-otp", { challenge_token: state("challenge") }), submit: t("auth.verify"), hint: t("auth.otp_hint"), fields: [
                { name: "otp", type: "otp", label: t("auth.otp"), required: true },
            ], on: { success: [act.session(event()), act.go("/account")] } }),
            c.form("reset", { when: all(eq(state("mode"), "forgot"), is(state("challenge"))), action: api.post("auth/reset", { challenge_token: state("challenge") }), submit: t("auth.reset"), hint: t("auth.otp_hint"), fields: [
                { name: "otp", type: "otp", label: t("auth.otp"), required: true },
                { name: "password", type: "password", label: t("auth.new_password"), required: true },
                { name: "password_confirmation", type: "password", label: t("auth.password_confirmation"), required: true },
            ], on: { success: [act.set("challenge", null), act.set("mode", "login")] } }),
            c.action({ label: t("auth.resend"), variant: "ghost", when: is(state("challenge")), on: { click: [act.call(api.post("auth/resend", { challenge_token: state("challenge") }))] } }),
        ]),
        c.footer({ brand: site("content.name"), text: site("content.copyright") }),
    ],
});
