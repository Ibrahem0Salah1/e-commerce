import { Decimal } from "@prisma/client/runtime/library";

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function plain<T>(obj: T): T {
    if (obj instanceof Decimal) {
        return Number(obj) as unknown as T;
    }

    if (obj instanceof Date) {
        return obj.toISOString() as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(plain) as unknown as T;
    }

    if (isPlainObject(obj)) {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(obj)) {
            out[key] = plain(val);
        }
        return out as unknown as T;
    }

    return obj;
}