
const entities: Readonly<Record<string, string>> = { nbsp: " ", lt: "<", gt: ">", quot: "\"", amp: "&" };

export function plainText ( value: string | null | undefined ): string {

    return (value ?? "")
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&(nbsp|lt|gt|quot|amp);/g, ( _: string, name: string ) => entities[name] ?? "")
        .trim();

}
