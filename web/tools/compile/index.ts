import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { type BrowserConfig, browserConfig, packContract } from "../../src/api/contract.ts";
import type { CompiledConfig } from "../../src/lib/spec/shapes.ts";
import { mapValues } from "../../src/lib/std/object.ts";
import { assetFiles, composeAssets, specPaths } from "../assets/index.ts";
import { report, root, sha256, writeFile, writeJson } from "../core/index.ts";
import { loadSpec, type Spec, specFromEnvironment } from "../specs/index.ts";
import { themeCss } from "./theme.ts";

type Mode = "development" | "production";
type Endpoint = { baseUrl: string | null; development?: { baseUrl: string | null } };
type Assets = ReadonlyMap<string, Buffer>;

function select<T extends Endpoint> ( value: T, mode: Mode ): T {

    const { development, ...connection } = value;

    return { ...connection, ...(mode === "development" ? development : {}) } as T;

}
function forMode ( config: CompiledConfig, mode: Mode ): CompiledConfig {

    const connections = mapValues(config.api.connections, ( value ) => select(value, mode));

    return { ...config, api: { ...config.api, connections } };

}
function origins ( config: CompiledConfig, browser: BrowserConfig ) {

    const reachable = Object.values(browser.api.connections).flatMap(( value ) => (value.baseUrl ? [new URL(value.baseUrl)] : []));
    const sockets = reachable.map(( url ) => `${url.protocol === "https:" ? "wss" : "ws"}://${url.hostname}:*`);
    const served = Object.values(config.api.connections).flatMap(( value ) => (value.baseUrl ? [new URL(value.baseUrl).origin] : []));

    return {
        images: [...new Set([...served, ...config.settings.mediaOrigins])],
        frames: [...config.settings.frameOrigins],
        origins: [...new Set([...reachable.map(( url ) => url.origin), ...sockets])].sort(),
    };

}
function implementation ( folder: string, name: string ): string {

    const file = ["components", "elements"].map(( layer ) => resolve(root, "src", layer, `${name}.tsx`)).find(existsSync);

    if ( !file ) throw new Error(`Kind ${name} has a contract but no implementation.`);

    return relative(resolve(root, folder), file).replaceAll("\\", "/");

}
function registry ( folder: string, used: readonly string[], client: boolean ): string {

    const lines = used.map(( name ) => `    ${JSON.stringify(name)}: () => import(${JSON.stringify(implementation(folder, name))}),`);

    return `${client ? '"use client";\n\n' : ""}export default {\n${lines.join("\n")}\n};\n`;

}
function owned ( name: string ): boolean {

    return specPaths.some(( path ) => name.startsWith(`${path}/`));

}
function assetHash ( assets: Assets ): string {

    const digest = createHash("sha256");

    for ( const [name, bytes] of assets ) {

        digest.update(JSON.stringify([name, bytes.length]));
        digest.update(bytes);

    }

    return digest.digest("hex").slice(0, 20);

}
function brandImages ( config: CompiledConfig, assets: Assets ): void {

    for ( const path of [config.content.logo, config.content.logo_dark, config.content.icon, config.content.apple_icon] ) {

        if ( path !== null && !assets.has(path.slice(1)) ) {

            throw new Error(`Missing selected brand asset: ${path}`);

        }

    }

}
function writeArtifacts ( folder: string, data: Record<string, unknown> ): void {

    for ( const [name, value] of Object.entries(data) ) {

        writeJson(`${folder}/${name}.json`, value);

    }

}
function writePublic ( folder: string, identity: string, assets: Assets ): void {

    const shared = [...assetFiles(resolve(root, "public"), true)].filter(( [name] ) => !owned(name));
    const files = new Map([...shared, ...assets]);

    for ( const [name, bytes] of files ) {

        writeFile(`${folder}/public/${name}`, bytes);

    }

    writeJson(`${folder}/release.json`, { identity, files: [...files].map(( [path, bytes] ) => ({ path, sha256: sha256(bytes) })) });

}
function writeDevelopment ( assetRoot: string, assets: Assets ): void {

    for ( const [name, bytes] of assets ) {

        writeFile(`public${assetRoot}/${name}`, bytes);

    }

}
function aliases ( folder: string, names: string[] ): Record<string, string> {

    const prefix = `./${relative(root, resolve(root, folder)).replaceAll("\\", "/")}`;

    return {
        ...Object.fromEntries(names.map(( name ) => [`@spec/${name}`, `${prefix}/${name}.json`])),
        "@spec/theme.css": `${prefix}/theme.css`,
        "@spec/registry.server": `${prefix}/registry.server.js`,
        "@spec/registry.client": `${prefix}/registry.client.js`,
    };

}
export function assemble ( spec: Spec, assets: ReadonlyMap<string, Buffer>, mode: Mode ) {

    const config = forMode(spec.config, mode);
    const browser = browserConfig(config.api, config.contract);

    brandImages(config, assets);

    return {
        assetRoot: `/_generated/${mode}/${assetHash(assets)}`,
        css: themeCss(config, assets),
        data: {
            config: { ...config, contract: packContract(config.contract) },
            schema: spec.schema,
            messages: spec.messages,
            connections: origins(config, browser),
            routing: { locales: config.settings.locale.enabled, defaultLocale: config.settings.locale.default },
            browser: { ...browser, contract: packContract(browser.contract) },
        },
    };

}
export async function compileSpec ( mode: Mode ) {

    const spec = await loadSpec(specFromEnvironment());
    const assets = composeAssets(resolve(root, "public"), resolve(spec.folder, "brand"));
    const folder = `node_modules/.cache/spec/${mode}`;
    const { assetRoot, css, data } = assemble(spec, assets, mode);

    writeArtifacts(folder, data);
    writeFile(`${folder}/theme.css`, css);
    writeFile(`${folder}/registry.server.js`, registry(folder, spec.schema.kinds, false));
    writeFile(`${folder}/registry.client.js`, registry(folder, spec.schema.kinds, true));
    writePublic(folder, spec.identity, assets);

    if ( mode === "development" ) writeDevelopment(assetRoot, assets);

    const summary = `${spec.schema.screens.length} screen(s), ${Object.keys(spec.messages).length} languages, ${assets.size} spec assets`;

    report(`Compiled ${spec.identity}: ${summary}.`);

    return { identity: spec.identity, assetRoot, paths: specPaths, aliases: aliases(folder, Object.keys(data)) };

}
