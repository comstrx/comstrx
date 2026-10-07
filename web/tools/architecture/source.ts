import { dirname, relative, resolve } from "node:path";
import { parse } from "@babel/parser";
import type { Node } from "@babel/types";
import { executable, foundation, helpers, layer, markup, namespaces, owners, source } from "./rules.ts";

type Context = { path: string; element: boolean; document: boolean; page: boolean; vendor: boolean; spec: boolean; api: boolean; };
type Reference = { name: string; typeOnly: boolean } | "dynamic" | undefined;
type Analysis = { imports: string[]; types: string[]; issues: string[] };

function context ( path: string ): Context {

    return {
        path,
        element: markup.some(( folder ) => path.startsWith(`${folder}/`)),
        document: ["app/[locale]/layout.tsx", "app/global-error.tsx"].includes(path),
        page: /(^|\/)page\.tsx$/.test(path),
        vendor: path.startsWith("lib/providers/"),
        spec: path.startsWith("../specs/"),
        api: path.startsWith("api/"),
    };

}
function walk ( node: unknown, visit: ( node: Node ) => void ): void {

    if ( !node || typeof node !== "object" ) return;
    if ( "type" in node && typeof node.type === "string" ) visit(node as Node);

    for ( const value of Object.values(node) ) {

        if ( Array.isArray(value) ) value.forEach(( child ) => { walk(child, visit); });
        else if ( value && typeof value === "object" ) walk(value, visit);

    }

}
function literal ( node: Node | undefined ): Reference {

    return node?.type === "StringLiteral" ? { name: node.value, typeOnly: false } : "dynamic";

}
function reference ( node: Node ): Reference {

    if ( node.type === "ImportDeclaration" ) {

        return { name: node.source.value, typeOnly: node.importKind === "type" };

    }
    if ( (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") && node.source ) {

        return { name: node.source.value, typeOnly: node.exportKind === "type" };

    }
    if ( node.type === "ImportExpression" ) {

        return literal(node.source);

    }
    if ( node.type !== "CallExpression" || node.callee.type !== "Import" ) {

        return undefined;

    }

    return literal(node.arguments[0]);

}
function dependencyIssues ( { path, spec, vendor }: Context, name: string ): string[] {

    const selected = name.startsWith("@spec/");
    const target = name.startsWith(".") ? relative(source, resolve(source, dirname(path), name)) : "";
    const standard = name.startsWith("@/") ? relative(source, resolve(source, name.slice(2))) : target;
    const external = !name.startsWith(".") && !name.startsWith("@/") && !selected && !foundation.test(name);

    return [
        ...(selected && !owners[path]?.includes(name) ? ["Selected specs belong behind lib/spec."] : []),
        ...(external && !vendor ? [`Third-party imports belong in lib/providers: ${name}`] : []),
        ...(spec && target !== "lib/spec/define.ts" && !target.startsWith(`${path.split("/").slice(0, 3).join("/")}/`)
            ? ["Specs may import their own modules and typed define helpers only."] : []),
        ...(layer(path) === 0 && !spec && !vendor && !standard.startsWith("lib/std/") ? ["Standard utilities must stay framework-independent."] : []),
    ];

}
/** `api.get(...)`, `act.set(...)` and chains rooted in them such as `api.get(...).cache(30)`. */
function dsl ( node: Node ): boolean {

    if ( node.type !== "MemberExpression" || node.property.type !== "Identifier" ) return false;
    if ( node.object.type === "Identifier" ) return namespaces.includes(node.object.name);

    return node.object.type === "CallExpression" && dsl(node.object.callee);

}
function specIssues ( { spec }: Context, node: Node ): string[] {

    if ( !spec ) return [];
    if ( dsl(node) ) return [];
    if ( executable.includes(node.type) ) return ["Specs are declarative data; execution and branching belong in src."];

    const helper = node.type === "CallExpression" && ((node.callee.type === "Identifier" && helpers.includes(node.callee.name)) || dsl(node.callee));

    return node.type === "CallExpression" && !helper ? ["Specs may call typed definition helpers only."] : [];

}
function markupIssues ( { element, document, page, api }: Context, node: Node ): string[] {

    const fetches = node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "fetch";

    if ( fetches && !api ) {

        return ["Backend transport belongs in src/api."];

    }
    if ( node.type === "JSXOpeningElement" && node.name.type === "JSXIdentifier" && /^[a-z]/.test(node.name.name) ) {

        const tag = node.name.name;
        const allowed = (document && ["html", "body"].includes(tag)) || (page && tag === "script");

        return element || allowed ? [] : [`HTML belongs in elements: ${tag}`];

    }

    const attribute = node.type === "JSXAttribute" && node.name.type === "JSXIdentifier" ? node.name.name : undefined;
    const styled = attribute !== undefined && ["className", "style", "css"].includes(attribute);

    return styled && !element ? ["Styling belongs in elements."] : [];

}
function visit ( scope: Context, node: Node, result: Analysis ): void {

    const found = reference(node);

    result.issues.push(...specIssues(scope, node));

    if ( found === "dynamic" ) {

        result.issues.push("Use explicit dynamic import paths.");

    }
    if ( found && found !== "dynamic" ) {

        if ( found.typeOnly ) result.types.push(found.name);
        else {

            result.imports.push(found.name);
            result.issues.push(...dependencyIssues(scope, found.name));

        }

    }

    result.issues.push(...markupIssues(scope, node));

}
export function analyze ( path: string, code: string ): Analysis {

    const ast = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] });
    const scope = context(path);
    const result: Analysis = { imports: [], types: [], issues: [] };

    walk(ast, ( node ) => { visit(scope, node, result); });

    return result;

}
