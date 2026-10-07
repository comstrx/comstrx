"use client";

import type { Scope } from "@/lib/spec/runtime";
import type { CompiledNode } from "@/lib/spec/shapes";
import { Boundary } from "./boundary";
import { Live } from "./live";

type Props = { node: CompiledNode; scope: Scope; locale: string; initial?: unknown };

export function Island ({ node, scope, locale, initial }: Props) {

    return (

        <Boundary node={node.id}>

            <Live node={node} scope={scope} locale={locale} initial={initial} />

        </Boundary>

    );

}
