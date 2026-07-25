import { Button } from "@/components/ui/button";
import { decryptPoof, getPoofKeyFromHash } from "@/src/lib/crypto";
import { revealPoof } from "@/src/lib/poof.functions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AsteriskIcon, CopyIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type RevealState =
    | { status: "loading" }
    | { status: "ready"; value: string }
    | { status: "missing" }
    | { status: "missing-key" }
    | { status: "error"; message: string };

export const Route = createFileRoute("/p/$id")({
    component: PoofView
});

function PoofView() {
    const { id } = Route.useParams();
    const revealPoofAction = useServerFn(revealPoof);
    const [state, setState] = useState<RevealState>({ status: "loading" });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function reveal() {
            setState({ status: "loading" });
            const key = getPoofKeyFromHash(window.location.hash);
            if (!key) {
                setState({ status: "missing-key" });
                return;
            }

            try {
                const result = await revealPoofAction({ data: { id } });
                if (cancelled) return;
                if (!result.found) {
                    setState({ status: "missing" });
                    return;
                }

                const value = await decryptPoof(result.payload, key);
                if (cancelled) return;
                window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
                setState({ status: "ready", value });
            } catch (cause) {
                console.error("Failed to reveal poof", cause);
                if (!cancelled) {
                    setState({
                        status: "error",
                        message: "This poof could not be decrypted. It may have an invalid key."
                    });
                }
            }
        }

        reveal();
        return () => {
            cancelled = true;
        };
    }, [id, revealPoofAction]);

    async function copyToClipboard() {
        if (state.status !== "ready") return;
        await navigator.clipboard.writeText(state.value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    }

    if (state.status === "loading") {
        return (
            <PoofShell>
                <div className="flex min-h-[22rem] items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                        <AsteriskIcon className="size-8 animate-spin" />
                        <p className="text-muted-foreground mt-4 text-sm">Loading poof...</p>
                    </div>
                </div>
            </PoofShell>
        );
    }

    if (state.status === "missing-key") {
        return (
            <PoofShell>
                <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
                    <h1 className="text-xl font-medium">Encryption key missing</h1>
                    <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                        This link does not include the key needed to decrypt the poof. Ask the sender
                        for the complete link.
                    </p>
                </div>
            </PoofShell>
        );
    }

    if (state.status === "missing" || state.status === "error") {
        return (
            <PoofShell>
                <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
                    <h1 className="text-xl font-medium">This poof is gone</h1>
                    <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                        {state.status === "missing"
                            ? "It was already viewed, expired, or never existed."
                            : state.message}
                    </p>
                    <Button
                        nativeButton={false}
                        render={<Link to="/new" />}
                        variant="outline"
                        className="mt-6"
                    >
                        <PlusIcon className="size-3.5" />
                        Create a new poof
                    </Button>
                </div>
            </PoofShell>
        );
    }

    return (
        <PoofShell>
            <p className="text-muted-foreground mx-auto max-w-2xl text-center text-sm leading-relaxed">
                This data has been permanently deleted and cannot be viewed again. After leaving
                this page, you will not be able to access it again.
            </p>
            <PoofContent value={state.value} copied={copied} onCopy={copyToClipboard} />
        </PoofShell>
    );
}

function PoofShell({ children }: { children: ReactNode }) {
    return <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-16">{children}</div>;
}

function PoofContent({
    value,
    copied,
    onCopy
}: {
    value: string;
    copied: boolean;
    onCopy: () => void;
}) {
    const lines = useMemo(() => value.split("\n"), [value]);

    return (
        <div className="relative mt-8 overflow-hidden rounded-lg border bg-muted/20">
            <div className="overflow-x-auto">
                <div className="flex min-w-max font-mono text-xs leading-relaxed">
                    <div className="bg-muted/40 text-muted-foreground shrink-0 border-r px-3 py-3 text-right select-none">
                        {lines.map((_, index) => (
                            <div key={index} className="min-w-7">
                                {index + 1}
                            </div>
                        ))}
                    </div>
                    <pre className="min-w-0 flex-1 px-4 py-3 whitespace-pre">
                        {lines.map((line, index) => (
                            <span key={index} className="block">
                                {line || "\u00A0"}
                            </span>
                        ))}
                    </pre>
                </div>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                className="bg-background/90 absolute top-2 right-2"
            >
                <CopyIcon className="size-3.5" />
                {copied ? "Copied" : "Copy"}
            </Button>
        </div>
    );
}
