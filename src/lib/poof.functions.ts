import { createServerFn } from "@tanstack/react-start";
import { createPoofEntry, revealPoofEntry } from "./poof.server";
import { createPoofInputSchema, poofIdSchema } from "./poof.schema";
import { z } from "zod";

const revealPoofInputSchema = z.object({
    id: poofIdSchema
});

export const createPoof = createServerFn({ method: "POST" })
    .inputValidator((data) => createPoofInputSchema.parse(data))
    .handler(async ({ data }) => createPoofEntry(data.payload));

export const revealPoof = createServerFn({ method: "POST" })
    .inputValidator((data) => revealPoofInputSchema.parse(data))
    .handler(async ({ data }) => revealPoofEntry(data.id));
