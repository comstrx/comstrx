import assert from "node:assert/strict";
import { test } from "node:test";
import { inspect, sources } from "../../tools/architecture/index.ts";

const planted: Record<string, string> = {
    "lib/std/bad.ts": 'import { x } from "@/lib/spec/server";\nimport z from "zod";',
    "hooks/use-bad.ts": 'import { a } from "@/components/list";\nexport const f = () => fetch("/x");',
    "components/list.tsx": 'export const a = <div className="x" style={{}}>hi</div>;',
    "elements/button.tsx": 'import { u } from "@/hooks/use-bad";\nexport const B = () => <button className="a" />;',
    "api/a.ts": 'import { b } from "./b";\nexport const a = fetch("/");',
    "api/b.ts": 'import { a } from "./a";\nexport const b = import(name);',
    "app/page.tsx": 'import c from "@spec/config";\nexport default () => <main><script /></main>;',
    "app/x.tsx": [
        'import { y } from "../../specs/r/config/api.ts";',
        'const z = import("./q");',
        'export * from "left-pad";',
        'export type { T } from "evil";',
    ].join("\n"),
    "lib/spec/config.ts": 'import c from "@spec/config";',
    "lib/spec/bad.ts": 'import { x } from "@/lib/site/settings";',
    "lib/site/bad.ts": 'import { y } from "@/api/server";',
    "lib/observe/bad.ts": 'import { r } from "@/lib/seo";',
    "api/core/bad.ts": 'import { c } from "@/lib/spec/config";',
    "lib/providers/bad.ts": 'import { o } from "@/lib/std/object";\nexport { z } from "zod";',
    "stores/bad.ts": 'import { h } from "@/hooks/use-api";',
    "lib/site/shape.ts": 'import type { Reading } from "@/api/server";\nexport type R = Reading;',
    "../specs/r/config/api.ts": "export default {};",
    "../specs/r/config/index.ts": [
        'import x from "../../../src/api/server.ts";',
        "if (a) { foo(); }",
        "export default defineConfig({ a: b.c, d: () => 1, e: new Date() });",
    ].join("\n"),
};
const expected = [
    "lib/spec/config.ts: Selected specs belong behind lib/spec.",
    "lib/std/bad.ts: Standard utilities must stay framework-independent.",
    "lib/std/bad.ts: Third-party imports belong in lib/providers: zod",
    "lib/std/bad.ts: Standard utilities must stay framework-independent.",
    "lib/std/bad.ts: upward dependency on lib/spec/server.ts",
    "lib/spec/bad.ts: upward dependency on lib/site/settings.ts",
    "lib/site/bad.ts: upward dependency on api/server.ts",
    "lib/observe/bad.ts: upward dependency on lib/seo/index.ts",
    "api/core/bad.ts: upward dependency on lib/spec/config.ts",
    "stores/bad.ts: upward dependency on hooks/use-api.ts",
    "lib/site/shape.ts: upward type dependency on api/server.ts",
    "hooks/use-bad.ts: Backend transport belongs in src/api.",
    "hooks/use-bad.ts: upward dependency on components/list.tsx",
    "components/list.tsx: HTML belongs in elements: div",
    "components/list.tsx: Styling belongs in elements.",
    "components/list.tsx: Styling belongs in elements.",
    "api/b.ts: Use explicit dynamic import paths.",
    "app/page.tsx: Selected specs belong behind lib/spec.",
    "app/page.tsx: HTML belongs in elements: main",
    "app/x.tsx: Third-party imports belong in lib/providers: left-pad",
    "app/x.tsx: direct project import; use lib/spec.",
    "../specs/r/config/index.ts: Specs may import their own modules and typed define helpers only.",
    "../specs/r/config/index.ts: Specs are declarative data; execution and branching belong in src.",
    "../specs/r/config/index.ts: Specs may call typed definition helpers only.",
    "../specs/r/config/index.ts: Specs are declarative data; execution and branching belong in src.",
    "../specs/r/config/index.ts: Specs are declarative data; execution and branching belong in src.",
    "../specs/r/config/index.ts: Specs are declarative data; execution and branching belong in src.",
    "../specs/r/config/index.ts: upward dependency on api/server.ts",
    "Import cycle: api/a.ts -> api/b.ts -> api/a.ts",
];

test("the architecture tool names every planted violation and nothing else", () => {

    const tree = new Map([...sources()].filter(( [path] ) => !path.startsWith("../specs/")));

    for ( const [path, code] of Object.entries(planted) ) {

        tree.set(path, code);

    }

    assert.deepEqual(inspect(tree).sort(), [...expected].sort());

});
