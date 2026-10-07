import type { CompiledConfig } from "../../src/lib/spec/shapes.ts";

type Face = { file: string; weight: string };
type Fonts = (readonly [string, Face[]])[];

function fonts ( config: CompiledConfig ): Fonts {

    return Object.entries(config.settings.fonts).map(( [locale, faces] ) => {

        return [locale, typeof faces === "string" ? [{ file: faces, weight: "100 900" }] : faces] as const;

    });

}
function face ( locale: string, font: Face, assets: ReadonlyMap<string, Buffer> ): string {

    if ( !assets.has(`assets/fonts/${font.file}`) ) throw new Error(`Missing selected font: ${font.file}`);

    return [
        `@font-face { font-family: "Site-${locale}"; src: url("/assets/fonts/${font.file}");`,
        `font-weight: ${font.weight}; font-style: normal; font-display: swap; }`,
    ].join(" ");

}
function palette ( theme: string, colors: Record<string, string> ): string {

    const tokens = Object.entries(colors).map(( [name, color] ) => `    --${name}: ${color};`);

    return `${theme === "light" ? ":root" : '[data-theme="dark"]'} {\n${tokens.join("\n")}\n}`;

}
function family ( locale: string, locales: string[] ): string {

    const stack = [locale, ...locales.filter(( other ) => other !== locale)].map(( name ) => `"Site-${name}"`);

    return `:root[lang="${locale}"] { --font-sans: ${[...stack, "sans-serif"].join(", ")}; }`;

}
export function themeCss ( config: CompiledConfig, assets: ReadonlyMap<string, Buffer> ): string {

    const selected = fonts(config);
    const locales = selected.map(( [locale] ) => locale);

    return [
        ...selected.flatMap(( [locale, faces] ) => faces.map(( font ) => face(locale, font, assets))),
        ...Object.entries(config.theme.colors).map(( [theme, colors] ) => palette(theme, colors)),
        ...locales.map(( locale ) => family(locale, locales)),
    ].join("\n");

}
