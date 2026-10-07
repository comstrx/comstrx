
declare module "@spec/theme.css";

declare module "@spec/config" {

    import type { PackedContract } from "@/api/contract";
    import type { CompiledConfig } from "@/lib/spec/shapes";

    const config: Omit<CompiledConfig, "contract"> & { contract: PackedContract };

    export default config;

}
declare module "@spec/connections" {

    const connections: { origins: string[]; images: string[]; frames: string[] };

    export default connections;

}
declare module "@spec/routing" {

    import type { Locale } from "@/lib/spec/languages";

    const routing: { locales: Locale[]; defaultLocale: Locale };

    export default routing;

}
declare module "@spec/schema" {

    import type { Compiled } from "@/lib/spec/shapes";

    const schema: Compiled;

    export default schema;

}
declare module "@spec/registry.server" {

    import type { Registry } from "@/lib/spec/kinds";

    const registry: Registry;

    export default registry;

}
declare module "@spec/registry.client" {

    import type { Registry } from "@/lib/spec/kinds";

    const registry: Registry;

    export default registry;

}
declare module "@spec/messages" {

    import type { Locale } from "@/lib/spec/languages";
    import type { Messages } from "@/lib/std/messages";
    import type messages from "../../messages/en.json";

    const dictionaries: Record<Locale, typeof messages & Messages>;

    export default dictionaries;

}
declare module "@spec/browser" {

    import type { BrowserConfig, PackedContract } from "@/api/contract";

    const browser: Omit<BrowserConfig, "contract"> & { contract: PackedContract };

    export default browser;

}
