import { resolve } from "node:path";
import { root } from "../core/index.ts";

export const source = resolve(root, "src");
export const foundation = /^(react(?:\/|$)|next(?:\/|$)|server-only$)/;

export const extensions = [
    "", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx", "/index.js"
];
export const helpers = [
    "defineConfig", "defineSchema", "screen", "zone", "split", "grid", "stack", "row",
    "t", "from", "param", "query", "state", "session", "item", "form", "event", "result", "site",
    "is", "not", "eq", "auth", "all", "any", "watch",
];
export const namespaces = [
    "e", "c", "api", "act"
];
export const structure = [
    "api", "app", "components", "elements", "hooks", "icons", "lib",
    "stores", "styles", "types", "proxy.ts", "instrumentation.ts", "instrumentation-client.ts"
];
const entrypoints = [
    "proxy.ts", "instrumentation.ts", "instrumentation-client.ts"
];
export const flat = [
    "styles", "elements", "icons", "components", "hooks", "types"
];
export const markup = [
    "elements", "icons"
];
export const executable = [
    "IfStatement", "SwitchStatement", "ForStatement", "ForOfStatement", "WhileStatement",
    "FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression",
    "NewExpression", "AwaitExpression", "MemberExpression", "ConditionalExpression",
];
export const owners: Readonly<Record<string, string[]>> = {
    "lib/spec/config.ts": ["@spec/connections", "@spec/routing"],
    "lib/spec/server.ts": ["@spec/config", "@spec/schema", "@spec/messages"],
    "lib/spec/browser.ts": ["@spec/browser"],
    "app/[locale]/layout.tsx": ["@spec/theme.css"],
    "app/[locale]/[[...path]]/render.tsx": ["@spec/registry.server"],
    "app/[locale]/[[...path]]/live.tsx": ["@spec/registry.client"],
};

export const declarations = ["types/", "../specs/", "lib/spec/define.ts"];

const protocol = [
    "client", "contract", "error", "realtime", "request", "response", "system", "wire",
].map(( name ) => `api/${name}.ts`);
const doors = [
    "server", "browser", "remote", "actions"
].map(( name ) => `api/${name}.ts`);
const layers: readonly (readonly string[])[] = [
    ["lib/std/", "lib/providers/", ...declarations],
    protocol,
    ["lib/spec/"],
    ["lib/site/", "lib/observe/"],
    doors,
    ["lib/seo/"],
    ["stores/"],
    ["hooks/"],
    markup.map(( folder ) => `${folder}/`),
    ["components/"],
    ["app/", ...entrypoints],
];

export function layer ( path: string ): number {

    return layers.findIndex(( members ) => members.some(( member ) => path === member || path.startsWith(member)));

}
