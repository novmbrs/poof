import type { EncryptedPoof } from "./poof.schema";
import { encryptedPoofSchema, poofKeySchema } from "./poof.schema";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const ALGORITHM = "AES-GCM";

function bytesToBase64Url(bytes: Uint8Array) {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importPoofKey(key: string, usage: KeyUsage) {
    const parsedKey = poofKeySchema.parse(key);
    return crypto.subtle.importKey("raw", base64UrlToBytes(parsedKey), ALGORITHM, false, [usage]);
}

export async function encryptPoof(plaintext: string) {
    const rawKey = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = bytesToBase64Url(rawKey);
    const cryptoKey = await importPoofKey(key, "encrypt");
    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        cryptoKey,
        new TextEncoder().encode(plaintext)
    );

    return {
        key,
        payload: {
            version: 1,
            iv: bytesToBase64Url(iv),
            ciphertext: bytesToBase64Url(new Uint8Array(ciphertext))
        } satisfies EncryptedPoof
    };
}

export async function decryptPoof(payload: EncryptedPoof, key: string) {
    const parsedPayload = encryptedPoofSchema.parse(payload);
    const cryptoKey = await importPoofKey(key, "decrypt");
    const plaintext = await crypto.subtle.decrypt(
        {
            name: ALGORITHM,
            iv: base64UrlToBytes(parsedPayload.iv)
        },
        cryptoKey,
        base64UrlToBytes(parsedPayload.ciphertext)
    );

    return new TextDecoder().decode(plaintext);
}

export function getPoofKeyFromHash(hash: string) {
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const key = params.get("key");
    return key && poofKeySchema.safeParse(key).success ? key : null;
}
