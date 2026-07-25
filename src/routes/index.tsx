import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

const notes = [
    {
        title: "One-time view",
        description: "The text is deleted as soon as the link is opened."
    },
    {
        title: "Anonymous",
        description: "No accounts, teams, dashboards, or tracking."
    },
    {
        title: "Encrypted",
        description: "Client side encryption, zero-knowledge server."
    }
];

const ASCII_LOGO = String.raw`
                                .o88o.            oooo
                                888                888
oo.ooooo.   .ooooo.   .ooooo.  o888oo     .oooo.o  888 .oo.
 888'  88b d88'  88b d88'  88b  888      d88(  "8  888P"Y88b
 888   888 888   888 888   888  888      "Y88b.    888   888
 888   888 888   888 888   888  888      o.  )88b  888   888
 888bod8P'  Y8bod8P'  Y8bod8P' o888o  8  8""888P' o888o o888o
 888
o888o
`;

function AsciiLogo({ className }: { className?: string }) {
    return (
        <pre
            aria-label="Poof Logo"
            role="img"
            className={cn(
                "text-muted-foreground font-mono text-[6px] leading-tight font-bold sm:text-[8px]",
                className
            )}
        >
            {ASCII_LOGO}
        </pre>
    );
}

export const Route = createFileRoute("/")({
    component: Home
});

function Home() {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pt-8 pb-12 sm:px-8 ">
            <div className="overflow-x-auto">
                <AsciiLogo className="text-foreground/80 text-[7px] sm:text-[9px]" />
            </div>

            <h1 className="mt-10 max-w-xl text-3xl leading-[1.1] font-medium tracking-tight md:text-5xl">
                Share text once,
                <br />
                <span className="text-muted-foreground">then let it disappear.</span>
            </h1>

            <p className="text-muted-foreground mt-5 max-w-md text-base leading-relaxed">
                Paste anything text-based, env files, code, docs, secrets, and get a private link. Send it. Read it. It vanishes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2">
                <Button nativeButton={false} render={<Link to="/new" />} size="lg">
                    New poof
                    <ArrowRightIcon className="size-3.5" />
                </Button>
                <Button
                    nativeButton={false}
                    render={
                        <a
                            href="https://github.com/novembersoftware/poof"
                            target="_blank"
                            rel="noopener noreferrer"
                        />
                    }
                    variant="ghost"
                    size="lg"
                >
                    View source
                </Button>
            </div>

            <section className="mt-20 divide-y divide-dashed">
                {notes.map((note, index) => (
                    <div
                        key={note.title}
                        className="grid grid-cols-[auto_1fr] gap-x-6 py-5 md:grid-cols-[auto_10rem_1fr] md:gap-x-10"
                    >
                        <span className="text-muted-foreground font-mono text-xs tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <h2 className="text-sm font-medium">{note.title}</h2>
                        <p className="text-muted-foreground col-span-2 mt-1 max-w-md text-sm leading-relaxed md:col-span-1 md:mt-0">
                            {note.description}
                        </p>
                    </div>
                ))}
            </section>

            <p className="text-muted-foreground mt-16 text-xs">
                Free, anonymous, open-source by{" "}
                <a
                    href="https://november.software"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline-offset-4 hover:underline"
                >
                    November
                </a>
                .
            </p>
        </div>
    );
}
