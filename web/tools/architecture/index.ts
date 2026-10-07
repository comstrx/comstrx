import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { report, root, task, walk } from "../core/index.ts";
import { declarations, extensions, flat, layer, source, structure } from "./rules.ts";
import { analyze } from "./source.ts";

type Sources = ReadonlyMap<string, string>;
type Graph = Map<string, string[]>;

function code ( directory: string ): string[] {

    return walk(directory).filter(( item ) => /\.[jt]sx?$/.test(item.entry.name)).map(( item ) => item.path);

}
export function sources (): Map<string, string> {

    const paths = [...code(source), ...code(resolve(root, "specs"))];

    return new Map(paths.map(( path ) => [relative(source, path), readFileSync(path, "utf8")]));

}
function layers (): string[] {

    return readdirSync(source)
        .filter(( entry ) => !structure.includes(entry))
        .map(( entry ) => `src/ holds the fixed layers only: ${entry}`);

}
function nesting (): string[] {

    return flat.flatMap(( folder ) => readdirSync(resolve(source, folder), { withFileTypes: true })
        .filter(( entry ) => entry.isDirectory())
        .map(( entry ) => `src/${folder}/ must stay flat: ${entry.name}`));

}
function layoutIssues (): string[] {

    return [...layers(), ...nesting()];

}
function target ( path: string, name: string, sources: Sources ): string | undefined {

    const local = name.startsWith(".") ? relative(source, resolve(source, dirname(path), name)) : null;
    const candidate = name.startsWith("@/") ? name.slice(2) : local;

    return candidate === null ? undefined : extensions.map(( suffix ) => candidate + suffix).find(( value ) => sources.has(value));

}
function edgeIssues ( path: string, to: string ): string[] {

    return [
        ...(to.startsWith("../specs/") && !path.startsWith("../specs/") ? [`${path}: direct project import; use lib/spec.`] : []),
        ...(layer(to) > layer(path) ? [`${path}: upward dependency on ${to}`] : []),
    ];

}
function cycle ( graph: Graph, path: string, chain: string[], seen: Set<string>, problems: string[] ): void {

    if ( chain.includes(path) ) {

        problems.push(`Import cycle: ${[...chain, path].join(" -> ")}`);
        return;

    }

    if ( seen.has(path) ) return;
    seen.add(path);

    for ( const child of graph.get(path) ?? [] ) {

        cycle(graph, child, [...chain, path], seen, problems);

    }

}
export function inspect ( sources: Sources ): string[] {

    const problems: string[] = [];
    const graph: Graph = new Map();
    const seen = new Set<string>();

    for ( const [path, code] of sources ) {

        const { imports, types, issues } = analyze(path, code);
        const edges = imports.flatMap(( name ) => target(path, name, sources) ?? []);
        const shapes = declarations.some(( entry ) => path.startsWith(entry)) ? [] : types.flatMap(( name ) => target(path, name, sources) ?? []);

        problems.push(
            ...issues.map(( issue ) => `${path}: ${issue}`),
            ...edges.flatMap(( to ) => edgeIssues(path, to)),
            ...shapes.filter(( to ) => layer(to) > layer(path)).map(( to ) => `${path}: upward type dependency on ${to}`),
        );
        graph.set(path, edges);

    }
    for ( const path of graph.keys() ) {

        cycle(graph, path, [], seen, problems);

    }

    return problems;

}
function check (): void {

    const problems = [...inspect(sources()), ...layoutIssues()];

    report(problems.length ? problems.join("\n") : "Architecture: layers, imports and cycles passed.");
    process.exitCode = problems.length ? 1 : 0;

}

task(import.meta.url, check);
