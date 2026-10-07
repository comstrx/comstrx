import { isRecord } from "./object.ts";

type Money = { amount: number; currency: string };

function moneyOf ( value: unknown ): Money | undefined {

    if ( !isRecord(value) ) return undefined;
    if ( isRecord(value.display) ) return moneyOf(value.display);

    const amount = Number(value.amount);

    return typeof value.currency === "string" && value.currency && Number.isFinite(amount) ? { amount, currency: value.currency } : undefined;

}
export function formatMoney ( value: unknown, locale: string, currency?: string ): string {

    const money = moneyOf(value) ?? (Number.isFinite(Number(value)) && value !== "" && value !== null && currency ? { amount: Number(value), currency } : undefined);

    if ( !money ) return "";

    try { return new Intl.NumberFormat(locale, { style: "currency", currency: money.currency }).format(money.amount); }
    catch { return `${money.amount} ${money.currency}`; }

}
export function formatNumber ( value: unknown, locale: string ): string {

    const number = Number(value);

    return value === null || value === "" || !Number.isFinite(number) ? "" : new Intl.NumberFormat(locale).format(number);

}
export function formatDate ( value: unknown, locale: string, timeZone?: string ): string {

    const stamp = typeof value === "string" || typeof value === "number" ? new Date(value) : undefined;

    if ( !stamp || Number.isNaN(stamp.getTime()) ) return "";

    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(stamp);

}
