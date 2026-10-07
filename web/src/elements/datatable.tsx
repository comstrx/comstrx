"use client";

import type { Live } from "@/lib/spec/kinds";
import type contract from "./datatable";

function cell ( value: unknown ): string {

    return typeof value === "string" || typeof value === "number" ? String(value) : "";

}
export default function Datatable ({ columns, rows, slots, emit }: Live<typeof contract>) {

    const actions = slots.actions;

    return (

        <div className="overflow-x-auto rounded-lg border border-line">

            <table className="w-full text-sm">

                <thead className="bg-muted/10">

                    <tr>

                        {columns.map(( column ) => <th key={column.key} className="px-3 py-2 text-start font-medium text-muted">{cell(column.label)}</th>)}

                        {actions ? <th className="px-3 py-2" /> : null}

                    </tr>

                </thead>

                <tbody>

                    {rows.map(( row ) => (
                        <tr key={row.key} onClick={() => emit("select", { key: row.key })} className="border-t border-line hover:bg-muted/5">
                            {columns.map(( column ) => <td key={column.key} className="px-3 py-2">{cell(row.cells[column.key])}</td>)}
                            {actions ? <td className="px-3 py-2"><div className="flex flex-wrap justify-end gap-1">{actions({ item: row.cells, key: row.key })}</div></td> : null}
                        </tr>
                    ))}

                </tbody>

            </table>

        </div>

    );

}
