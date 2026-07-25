import { z } from "zod";

const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export const poofIdSchema = z
    .string()
    .regex(/^[A-Za-z0-9]{12}$/, "Invalid poof id");

export const poofTextSchema = z
    .string()
    .min(1, "Content cannot be empty")
    .max(10_000, "Content must be less than 10,000 characters")
    .refine((value) => value.trim().length > 0, "Content cannot be only whitespace");

export const poofKeySchema = z
    .string()
    .length(43, "Invalid encryption key")
    .regex(BASE64_URL_PATTERN, "Invalid encryption key");

export const encryptedPoofSchema = z.object({
    version: z.literal(1),
    iv: z.string().length(16).regex(BASE64_URL_PATTERN, "Invalid initialization vector"),
    ciphertext: z
        .string()
        .min(22, "Ciphertext is too short")
        .max(60_000, "Ciphertext is too large")
        .regex(BASE64_URL_PATTERN, "Invalid ciphertext")
});

export const createPoofInputSchema = z.object({
    payload: encryptedPoofSchema
});

export const createPoofApiSchema = createPoofInputSchema.extend({
    ttl: z.number().int().positive().optional()
});

export type EncryptedPoof = z.infer<typeof encryptedPoofSchema>;
export type CreatePoofInput = z.infer<typeof createPoofInputSchema>;
export type CreatePoofApiInput = z.infer<typeof createPoofApiSchema>;
