import type { z } from "../providers/schema.ts";
import type { fontsShape, settingsShape, themeShape } from "./shapes.ts";

export const fontDefaults = {
    en: [
        { file: "latin.ttf", weight: "200 800" }
    ],
    ar: [
        { file: "arabic-regular.ttf", weight: "400" },
        { file: "arabic-semibold.ttf", weight: "600" }
    ],
} satisfies z.input<typeof fontsShape>;

export const settingsDefaults = {
    motion: "system",
    density: "comfortable",
    maintenance: false,
    maintenanceMessage: "",
    fonts: fontDefaults,
    mediaOrigins: [],
    frameOrigins: [],
    locale: {
        default: "en",
        enabled: ["en", "ar"],
        timeZone: "Africa/Cairo"
    },
    currency: {
        default: "USD",
        enabled: ["USD", "SAR", "EGP"]
    },
    theme: {
        default: "light",
        enabled: ["light", "dark", "system"]
    },
} satisfies z.input<typeof settingsShape>;

export const themeDefaults = {
    colors: {
        light: {
            background: "#fcfdfb",
            foreground: "#173d35",
            surface: "#ffffff",
            muted: "#62776f",
            line: "#e3ebe5",
            focus: "#087f6c",
            primary: "#0aa38a",
            accent: "#e86a2c"
        },
        dark: {
            background: "#101e1b",
            foreground: "#edf6f0",
            surface: "#172b25",
            muted: "#abc3b9",
            line: "#30483d",
            focus: "#71dec4",
            primary: "#1fbb9c",
            accent: "#f08a4c"
        },
    },
} satisfies z.input<typeof themeShape>;
