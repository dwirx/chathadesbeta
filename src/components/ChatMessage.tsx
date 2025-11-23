import { Bot, User, Copy, Check } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Message } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
    const { role, content, modelName, metadata } = message;
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleCopyMessage = async () => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast({
                        title: "Copied!",
                        description: "Message copied to clipboard.",
                    });
                    return;
                } catch (clipboardError) {
                    console.warn(
                        "Clipboard API failed, trying fallback:",
                        clipboardError,
                    );
                }
            }

            // Fallback method
            const textArea = document.createElement("textarea");
            textArea.value = content;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.select();

            try {
                const successful = document.execCommand("copy");
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast({
                        title: "Copied!",
                        description: "Message copied to clipboard.",
                    });
                } else {
                    throw new Error("execCommand failed");
                }
            } finally {
                document.body.removeChild(textArea);
            }
        } catch (error) {
            console.error("Error copying message:", error);
            toast({
                title: "Copy Failed",
                description: "Failed to copy message.",
                variant: "destructive",
            });
        }
    };

    return (
        <div
            className={`flex gap-2 sm:gap-2.5 mb-3 sm:mb-4 px-1 group ${role === "user" ? "justify-end" : "justify-start"}`}
        >
            {role === "ai" && (
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
            )}

            <div
                className={`max-w-[85%] sm:max-w-[80%] md:max-w-2xl min-w-0 ${role === "user" ? "order-first" : ""}`}
            >
                <div
                    className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 ${
                        role === "ai" ? "bg-chat-ai" : "bg-chat-user"
                    }`}
                >
                    {role === "ai" && modelName && (
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-border/5">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                <div className="w-1 h-1 rounded-full bg-primary/60 flex-shrink-0"></div>
                                <span className="text-[9px] font-medium text-primary/60 truncate">
                                    {modelName}
                                </span>
                            </div>
                            <button
                                onClick={handleCopyMessage}
                                className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200 ${
                                    copied
                                        ? "opacity-100 bg-green-500/15 text-green-600 dark:text-green-400"
                                        : isMobile
                                          ? "opacity-25 active:opacity-100 active:bg-muted/40 text-muted-foreground/50 active:scale-95"
                                          : "opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-muted/40 hover:scale-110 text-muted-foreground/60"
                                }`}
                                title="Copy message"
                            >
                                {copied ? (
                                    <Check className="h-3 w-3 stroke-[2.5] animate-in zoom-in duration-200" />
                                ) : (
                                    <Copy className="h-3 w-3 stroke-[2]" />
                                )}
                            </button>
                        </div>
                    )}
                    {role === "user" && (
                        <div className="flex items-center justify-end mb-1.5 pb-1 border-b border-border/5">
                            <button
                                onClick={handleCopyMessage}
                                className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200 ${
                                    copied
                                        ? "opacity-100 bg-green-500/15 text-green-600 dark:text-green-400"
                                        : isMobile
                                          ? "opacity-25 active:opacity-100 active:bg-muted/40 text-muted-foreground/50 active:scale-95"
                                          : "opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-muted/40 hover:scale-110 text-muted-foreground/60"
                                }`}
                                title="Copy message"
                            >
                                {copied ? (
                                    <Check className="h-3 w-3 stroke-[2.5] animate-in zoom-in duration-200" />
                                ) : (
                                    <Copy className="h-3 w-3 stroke-[2]" />
                                )}
                            </button>
                        </div>
                    )}

                    <div className="text-[13px] sm:text-[13.5px] text-foreground leading-[1.65] break-words prose prose-sm max-w-none dark:prose-invert antialiased">
                        {role === "ai" ? (
                            <MarkdownRenderer content={content} />
                        ) : (
                            <p className="whitespace-pre-wrap m-0">{content}</p>
                        )}
                    </div>

                    {metadata && (
                        <div className="mt-2 pt-1.5 border-t border-border/5">
                            <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground/70 font-mono">
                                {metadata.duration && (
                                    <span className="whitespace-nowrap">
                                        ⏱ {metadata.duration}
                                    </span>
                                )}
                                {metadata.ttft && (
                                    <span className="whitespace-nowrap">
                                        ⚡ {metadata.ttft}
                                    </span>
                                )}
                                {metadata.tokens && (
                                    <span className="hidden sm:inline whitespace-nowrap">
                                        📊 {metadata.tokens}
                                    </span>
                                )}
                                {metadata.speed && (
                                    <span className="whitespace-nowrap">
                                        🚀 {metadata.speed}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {role === "user" && (
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-foreground" />
                </div>
            )}
        </div>
    );
};
