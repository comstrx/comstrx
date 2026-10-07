
export type Point = { latitude: number; longitude: number };

export const currencyCode = /^[A-Z]{3}$/;

const currencies: Readonly<Record<string, readonly string[]>> = {
    AED: ["AE"],
    AFN: ["AF"],
    ALL: ["AL"],
    AMD: ["AM"],
    AOA: ["AO"],
    ARS: ["AR"],
    AUD: ["AU", "CC", "CX", "HM", "KI", "NF", "NR", "TV"],
    AWG: ["AW"],
    AZN: ["AZ"],
    BAM: ["BA"],
    BBD: ["BB"],
    BDT: ["BD"],
    BHD: ["BH"],
    BIF: ["BI"],
    BMD: ["BM"],
    BND: ["BN"],
    BOB: ["BO"],
    BRL: ["BR"],
    BSD: ["BS"],
    BTN: ["BT"],
    BWP: ["BW"],
    BYN: ["BY"],
    BZD: ["BZ"],
    CAD: ["CA"],
    CDF: ["CD"],
    CHF: ["CH", "LI"],
    CLP: ["CL"],
    CNY: ["CN"],
    COP: ["CO"],
    CRC: ["CR"],
    CUP: ["CU"],
    CVE: ["CV"],
    CZK: ["CZ"],
    DJF: ["DJ"],
    DKK: ["DK", "FO", "GL"],
    DOP: ["DO"],
    DZD: ["DZ"],
    EGP: ["EG"],
    ERN: ["ER"],
    ETB: ["ET"],
    EUR: [
        "AD", "AT", "AX", "BE", "BG", "BL", "CY", "DE", "EE", "ES", "FI", "FR", "GF", "GP", "GR", "HR", "IE", "IT", "LT",
        "LU", "LV", "MC", "ME", "MF", "MQ", "MT", "NL", "PM", "PT", "RE", "SI", "SK", "SM", "TF", "VA", "XK", "YT"
    ],
    FJD: ["FJ"],
    FKP: ["FK"],
    GBP: ["GB", "GG", "GS", "IM", "JE"],
    GEL: ["GE"],
    GHS: ["GH"],
    GIP: ["GI"],
    GMD: ["GM"],
    GNF: ["GN"],
    GTQ: ["GT"],
    GYD: ["GY"],
    HKD: ["HK"],
    HNL: ["HN"],
    HTG: ["HT"],
    HUF: ["HU"],
    IDR: ["ID"],
    ILS: ["IL", "PS"],
    INR: ["IN"],
    IQD: ["IQ"],
    IRR: ["IR"],
    ISK: ["IS"],
    JMD: ["JM"],
    JOD: ["JO"],
    JPY: ["JP"],
    KES: ["KE"],
    KGS: ["KG"],
    KHR: ["KH"],
    KMF: ["KM"],
    KPW: ["KP"],
    KRW: ["KR"],
    KWD: ["KW"],
    KYD: ["KY"],
    KZT: ["KZ"],
    LAK: ["LA"],
    LBP: ["LB"],
    LKR: ["LK"],
    LRD: ["LR"],
    LSL: ["LS"],
    LYD: ["LY"],
    MAD: ["EH", "MA"],
    MDL: ["MD"],
    MGA: ["MG"],
    MKD: ["MK"],
    MMK: ["MM"],
    MNT: ["MN"],
    MOP: ["MO"],
    MRU: ["MR"],
    MUR: ["MU"],
    MVR: ["MV"],
    MWK: ["MW"],
    MXN: ["MX"],
    MYR: ["MY"],
    MZN: ["MZ"],
    NAD: ["NA"],
    NGN: ["NG"],
    NIO: ["NI"],
    NOK: ["BV", "NO", "SJ"],
    NPR: ["NP"],
    NZD: ["CK", "NU", "NZ", "PN", "TK"],
    OMR: ["OM"],
    PAB: ["PA"],
    PEN: ["PE"],
    PGK: ["PG"],
    PHP: ["PH"],
    PKR: ["PK"],
    PLN: ["PL"],
    PYG: ["PY"],
    QAR: ["QA"],
    RON: ["RO"],
    RSD: ["RS"],
    RUB: ["RU"],
    RWF: ["RW"],
    SAR: ["SA"],
    SBD: ["SB"],
    SCR: ["SC"],
    SDG: ["SD"],
    SEK: ["SE"],
    SGD: ["SG"],
    SHP: ["SH"],
    SLE: ["SL"],
    SOS: ["SO"],
    SRD: ["SR"],
    SSP: ["SS"],
    STN: ["ST"],
    SYP: ["SY"],
    SZL: ["SZ"],
    THB: ["TH"],
    TJS: ["TJ"],
    TMT: ["TM"],
    TND: ["TN"],
    TOP: ["TO"],
    TRY: ["TR"],
    TTD: ["TT"],
    TWD: ["TW"],
    TZS: ["TZ"],
    UAH: ["UA"],
    UGX: ["UG"],
    USD: ["AS", "BQ", "EC", "FM", "GU", "IO", "MH", "MP", "PR", "PW", "SV", "TC", "TL", "UM", "US", "VG", "VI"],
    UYU: ["UY"],
    UZS: ["UZ"],
    VES: ["VE"],
    VND: ["VN"],
    VUV: ["VU"],
    WST: ["WS"],
    XAF: ["CF", "CG", "CM", "GA", "GQ", "TD"],
    XCD: ["AG", "AI", "DM", "GD", "KN", "LC", "MS", "VC"],
    XCG: ["CW", "SX"],
    XOF: ["BF", "BJ", "CI", "GW", "ML", "NE", "SN", "TG"],
    XPF: ["NC", "PF", "WF"],
    YER: ["YE"],
    ZAR: ["ZA"],
    ZMW: ["ZM"],
    ZWG: ["ZW"]
};
const countries = new Map(Object.entries(currencies).flatMap(( [currency, codes] ) => codes.map(( code ) => [code, currency] as const)));

export function isPoint ( value: unknown ): value is Point {

    if ( !value || typeof value !== "object" ) return false;

    const { latitude, longitude } = value as Record<string, unknown>;

    return typeof latitude === "number" && typeof longitude === "number" && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;

}
export function parsePoint ( value: string | undefined ): Point | undefined {

    const [latitude, longitude, ...rest] = (value ?? "").split(",").map(( part ) => (part.trim() ? Number(part) : Number.NaN));
    const point = { latitude, longitude };

    return rest.length === 0 && isPoint(point) ? point : undefined;

}
export function formatPoint ( { latitude, longitude }: Point, digits = 5 ): string {

    return `${latitude.toFixed(digits)},${longitude.toFixed(digits)}`;

}
export function isCountry ( value: unknown ): value is string {

    return typeof value === "string" && countries.has(value);

}
export function isCurrency ( value: unknown ): value is string {

    return typeof value === "string" && currencyCode.test(value);

}
export function currencyOf ( country: string ): string | undefined {

    return countries.get(country);

}
