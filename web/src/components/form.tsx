"use client";

import Button from "@/elements/button.tsx";
import Checkbox from "@/elements/checkbox.tsx";
import Field from "@/elements/field.tsx";
import Formbox from "@/elements/formbox.tsx";
import Heading from "@/elements/heading.tsx";
import Input from "@/elements/input.tsx";
import Notice from "@/elements/notice.tsx";
import Select from "@/elements/select.tsx";
import Text from "@/elements/text.tsx";
import Textarea from "@/elements/textarea.tsx";
import { useFormNode } from "@/hooks/use-form-node";
import { inert, type Live, slot } from "@/lib/spec/kinds";
import type contract from "./form";

export default function Form ( live: Live<typeof contract> ) {

    const r = inert(live);
    const { form, optionsOf, message, submit } = useFormNode(live);
    const fields = live.fields.map(( spec ) => {

        const value = form.values[spec.name];
        const error = form.errors[spec.name]?.[0];
        const change = async ( _: string, payload?: unknown ) => { if ( payload && typeof payload === "object" && "value" in payload ) form.setValue(spec.name, payload.value); };

        if ( spec.type === "checkbox" ) return <Checkbox {...r} key={spec.name} field={spec.name} label={spec.label} checked={value === true} emit={change} />;

        return (
            <Field {...r} key={spec.name} field={spec.name} label={spec.label} hint={spec.hint} error={error} required={spec.required} slots={slot(
                spec.type === "textarea" ? <Textarea {...r} field={spec.name} value={value} placeholder={spec.placeholder} rows={spec.rows} required={spec.required} invalid={!!error} emit={change} />
                    : spec.type === "select" ? <Select {...r} field={spec.name} value={value} placeholder={spec.placeholder} options={optionsOf(spec)} required={spec.required} invalid={!!error} emit={change} />
                    : <Input {...r} field={spec.name} type={spec.type} value={value} placeholder={spec.placeholder} required={spec.required} invalid={!!error} emit={change} />,
            )} />
        );

    });

    return (

        <Formbox {...r} emit={async () => submit()} slots={slot(
            <>
                {live.title ? <Heading {...r} value={live.title} level={3} /> : null}
                {live.hint ? <Text {...r} value={live.hint} size="sm" tone="muted" /> : null}
                {fields}
                {live.slots.children?.({ form: form.values })}
                {message ? <Notice {...r} kind="error" text={message} /> : null}
                {form.done && live.done ? <Notice {...r} kind="success" text={live.done} /> : null}
                {live.action && live.submit ? <Button {...r} label={live.submit} type="submit" pending={form.pending} /> : null}
            </>,
        )} />

    );

}
