"use client";

import type { FormEvent } from "react";
import type { Live } from "@/lib/spec/kinds";
import type contract from "./formbox";

export default function Formbox ({ slots, emit }: Live<typeof contract>) {

    const submit = ( event: FormEvent ) => { event.preventDefault(); emit("submit").catch(() => undefined); };

    return (

        <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">

            {slots.children?.()}

        </form>

    );

}
