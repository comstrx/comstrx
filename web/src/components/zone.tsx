import Block from "@/elements/block.tsx";
import Notice from "@/elements/notice.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import { statusOf } from "@/lib/spec/status";
import type contract from "./zone";

export default function Zone ( live: Live<typeof contract> ) {

    const r = inert(live);
    const status = statusOf(live);

    return (

        <Block {...r} gap={live.gap} padding={live.padding} width={live.width} align={live.align} radius={live.radius} surface={live.surface} slots={slot(
            status.loading ? <Skeleton /> : status.failed ? <Notice {...r} kind="error" text={status.message} detail={status.detail} /> : live.slots.children?.(),
        )} />

    );

}
