import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { encryptPoof } from "@/src/lib/crypto";
import { createPoof } from "@/src/lib/poof.functions";
import { poofTextSchema } from "@/src/lib/poof.schema";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftIcon, CopyIcon, SendIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/new")({
    component: NewPoof
});

function NewPoof() {
    const createPoofAction = useServerFn(createPoof);
    const [text, setText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdPoof, setCreatedPoof] = useState<{ id: string; key: string } | null>(null);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const parsed = poofTextSchema.safeParse(text);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Invalid poof content");
            return;
        }

        setIsSubmitting(true);
        try {
            const encrypted = await encryptPoof(parsed.data);
            const result = await createPoofAction({ data: { payload: encrypted.payload } });
            setCreatedPoof({ id: result.id, key: encrypted.key });
            setText("");
        } catch (cause) {
            console.error("Failed to create poof", cause);
            setError("Failed to create poof. Check Redis and server configuration.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <Link
                        to="/"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                    >
                        <ArrowLeftIcon className="size-3.5" />
                        Home
                    </Link>
                    <h1 className="mt-4 text-3xl leading-tight font-medium tracking-tight sm:text-4xl">
                        New poof
                    </h1>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <Textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Paste text here..."
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    className="bg-muted/30 min-h-[22rem] resize-y font-mono text-sm leading-relaxed shadow-none sm:min-h-[28rem]"
                    aria-invalid={Boolean(error)}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-sm">
                        Encrypted in your browser, stored briefly, and deleted after one view.
                    </p>
                    <Button type="submit" disabled={isSubmitting}>
                        <SendIcon className="size-3.5" />
                        {isSubmitting ? "Creating..." : "Create poof"}
                    </Button>
                </div>
                {error ? <p className="text-destructive text-sm">{error}</p> : null}
            </form>

            <SuccessDialog
                poof={createdPoof}
                onOpenChange={(open) => !open && setCreatedPoof(null)}
            />
        </div>
    );
}

function SuccessDialog({
    poof,
    onOpenChange
}: {
    poof: { id: string; key: string } | null;
    onOpenChange: (open: boolean) => void;
}) {
    const [copied, setCopied] = useState(false);
    const poofUrl = useMemo(() => {
        if (!poof || typeof window === "undefined") {
            return "";
        }
        const fragment = new URLSearchParams({ key: poof.key });
        return `${window.location.origin}/p/${poof.id}#${fragment}`;
    }, [poof]);

    async function copyToClipboard() {
        if (!poofUrl) return;
        await navigator.clipboard.writeText(poofUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    }

    return (
        <Dialog open={Boolean(poof)} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Your poof has been created</DialogTitle>
                    <DialogDescription>Share this one-time link with the recipient.</DialogDescription>
                </DialogHeader>
                <div className="border-border bg-muted/40 flex min-w-0 items-center gap-2 rounded-lg border p-2">
                    <code className="min-w-0 flex-1 overflow-hidden font-mono text-sm text-ellipsis whitespace-nowrap">
                        {poofUrl}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        <CopyIcon className="size-3.5" />
                        {copied ? "Copied" : "Copy"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
