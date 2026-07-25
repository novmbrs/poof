import { describe, expect, it } from "vitest";
import { decryptPoof, encryptPoof, getPoofKeyFromHash } from "../lib/crypto";
import { generatePoofId, readOnce } from "../lib/poof.server";
import {
    createPoofInputSchema,
    encryptedPoofSchema,
    poofIdSchema,
    poofTextSchema
} from "../lib/poof.schema";

describe("poof crypto", () => {
    it("round-trips encrypted text with a random key", async () => {
        const encrypted = await encryptPoof("secret\nvalue");

        expect(JSON.stringify(encrypted.payload)).not.toContain("secret");
        expect(await decryptPoof(encrypted.payload, encrypted.key)).toBe("secret\nvalue");
    });

    it("rejects an incorrect encryption key", async () => {
        const encrypted = await encryptPoof("secret");
        const other = await encryptPoof("other");

        await expect(decryptPoof(encrypted.payload, other.key)).rejects.toThrow();
    });

    it("reads valid keys only from URL fragments", async () => {
        const { key } = await encryptPoof("secret");

        expect(getPoofKeyFromHash(`#key=${key}`)).toBe(key);
        expect(getPoofKeyFromHash("#key=invalid")).toBeNull();
        expect(getPoofKeyFromHash("")).toBeNull();
    });
});

describe("poof validation", () => {
    it("accepts generated ids", () => {
        const id = generatePoofId();

        expect(id).toHaveLength(12);
        expect(poofIdSchema.parse(id)).toBe(id);
    });

    it("rejects empty and oversized content", () => {
        expect(poofTextSchema.safeParse("   ").success).toBe(false);
        expect(poofTextSchema.safeParse("a".repeat(10_001)).success).toBe(false);
    });

    it("accepts a versioned encrypted payload", async () => {
        const { payload } = await encryptPoof("secret");

        expect(encryptedPoofSchema.parse(payload)).toEqual(payload);
        expect(createPoofInputSchema.safeParse({ payload }).success).toBe(true);
    });
});

describe("readOnce", () => {
    it("uses getDel when available", async () => {
        let value: string | null = "encrypted";
        const redis = {
            set: async () => undefined,
            getDel: async () => {
                const current = value;
                value = null;
                return current;
            },
            eval: async () => {
                throw new Error("eval should not be called");
            }
        };

        expect(await readOnce(redis, "poof:text:id")).toBe("encrypted");
        expect(await readOnce(redis, "poof:text:id")).toBeNull();
    });

    it("falls back to an atomic lua read-delete path", async () => {
        let value: string | null = "encrypted";
        const redis = {
            set: async () => undefined,
            eval: async () => {
                const current = value;
                value = null;
                return current;
            }
        };

        expect(await readOnce(redis, "poof:text:id")).toBe("encrypted");
        expect(await readOnce(redis, "poof:text:id")).toBeNull();
    });
});
