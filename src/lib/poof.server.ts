import { randomInt } from "node:crypto";
import { getServerEnv } from "./env.server";
import { encryptedPoofSchema, poofIdSchema, type EncryptedPoof } from "./poof.schema";
import { getRedisClient } from "./redis.server";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 12;
const KEY_PREFIX = "poof:text:";

type RedisLike = {
    set: (key: string, value: string, options?: { EX?: number }) => Promise<unknown>;
    getDel?: (key: string) => Promise<string | null>;
    eval: (script: string, options: { keys: string[]; arguments: string[] }) => Promise<unknown>;
    incr?: (key: string) => Promise<unknown>;
};

export type RevealPoofResult =
    | {
          found: true;
          id: string;
          payload: EncryptedPoof;
      }
    | {
          found: false;
      };

function poofKey(id: string) {
    return `${KEY_PREFIX}${id}`;
}

export function generatePoofId() {
    let id = "";
    for (let index = 0; index < ID_LENGTH; index += 1) {
        id += ALPHABET[randomInt(ALPHABET.length)];
    }
    return id;
}

export async function readOnce(redis: RedisLike, key: string) {
    if (redis.getDel) {
        return redis.getDel(key);
    }

    const value = await redis.eval(
        `
local value = redis.call("GET", KEYS[1])
if value then
  redis.call("DEL", KEYS[1])
end
return value
`,
        { keys: [key], arguments: [] }
    );

    return typeof value === "string" ? value : null;
}

export async function createPoofEntry(payload: EncryptedPoof, ttlSeconds?: number) {
    const env = getServerEnv();
    const redis = await getRedisClient();
    const id = generatePoofId();
    const encrypted = encryptedPoofSchema.parse(payload);

    await redis.set(poofKey(id), JSON.stringify(encrypted), {
        EX: ttlSeconds ?? env.POOF_DEFAULT_TTL_SECONDS
    });
    await redis.incr("poof:stats:total_created");

    return { id };
}

export async function revealPoofEntry(id: string): Promise<RevealPoofResult> {
    const parsedId = poofIdSchema.parse(id);
    const redis = await getRedisClient();
    const storedPayload = await readOnce(redis, poofKey(parsedId));

    if (!storedPayload) {
        return { found: false };
    }

    const payload = encryptedPoofSchema.parse(JSON.parse(storedPayload));
    await redis.incr("poof:stats:total_viewed");

    return {
        found: true,
        id: parsedId,
        payload
    };
}
