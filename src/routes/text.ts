import { createPoofEntry } from "@/src/lib/poof.server";
import { createPoofApiSchema } from "@/src/lib/poof.schema";
import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

export const Route = createFileRoute("/text")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const data = createPoofApiSchema.parse(body);
                    const result = await createPoofEntry(data.payload, data.ttl);
                    return Response.json(result, { status: 201 });
                } catch (error) {
                    if (error instanceof ZodError || error instanceof SyntaxError) {
                        return Response.json({ error: "invalid request body" }, { status: 400 });
                    }

                    console.error("Failed to create poof through API", error);
                    return Response.json({ error: "failed to save entry" }, { status: 500 });
                }
            }
        }
    }
});
