export const supportedLocales = ["en", "ar"] as const;

export type Locale = typeof supportedLocales[number];

export const languages = {
    en: { label: "English", direction: "ltr", openGraph: "en_US" },
    ar: { label: "العربية", direction: "rtl", openGraph: "ar_AR" },
} as const;
