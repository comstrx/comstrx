import type { SiteConfig } from "../../../src/lib/spec/shapes.ts";

export default {
    colors: {
        light: {
            background: "#fcfdfb",
            foreground: "#173d35",
            surface: "#ffffff",
            muted: "#62776f",
            line: "#e3ebe5",
            focus: "#087f6c",
            primary: "#0aa38a",
            accent: "#e86a2c",
        },
        dark: {
            background: "#101e1b",
            foreground: "#edf6f0",
            surface: "#172b25",
            muted: "#abc3b9",
            line: "#30483d",
            focus: "#71dec4",
            primary: "#1fbb9c",
            accent: "#f08a4c",
        },
    },
} satisfies SiteConfig["themes"];
