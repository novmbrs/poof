import { revealPoofEntry } from "@/src/lib/poof.server";
import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

export const Route = createFileRoute("/text/$id")({
    server: {
        handlers: {
            GET: async ({ params }) => {
                try {
                    const result = await revealPoofEntry(params.id);
                    if (!result.found) {
                        return Response.json({ error: "entry not found" }, { status: 404 });
                    }

                    return Response.json({ id: result.id, payload: result.payload });
                } catch (error) {
                    if (error instanceof ZodError) {
                        return Response.json({ error: "invalid id" }, { status: 400 });
                    }

                    console.error("Failed to reveal poof through API", error);
                    return Response.json({ error: "failed to retrieve entry" }, { status: 500 });
                }
            }
        }
    }
});
