import type { SiteConfig } from "../../../src/lib/spec/shapes.ts";

export default {
    motion: "system",
    density: "comfortable",
    maintenance: false,
    maintenanceMessage: "",
    locale: {
        default: "en",
        enabled: ["en", "ar"],
        timeZone: "Africa/Cairo",
    },
    currency: {
        default: "USD",
        enabled: ["USD", "SAR", "EGP"],
    },
    theme: {
        default: "light",
        enabled: ["light", "dark", "system"],
    },
    fonts: {
        en: [{ file: "latin.ttf", weight: "200 800" }],
        ar: [{ file: "arabic-regular.ttf", weight: "400" }, { file: "arabic-semibold.ttf", weight: "600" }],
    },
    mediaOrigins: [],
    frameOrigins: ["https://www.openstreetmap.org"],
} satisfies SiteConfig["settings"];
