import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
                code({
                    className,
                    children,
                    ...props
                }: React.HTMLAttributes<HTMLElement> & { node?: unknown }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    const inline = !className;

                    return !inline && match ? (
                        <CodeBlock
                            language={match[1]}
                            code={codeString}
                            {...props}
                        />
                    ) : (
                        <code
                            className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs md:text-sm"
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },
                pre({ children }) {
                    return <div className="my-2 md:my-4">{children}</div>;
                },
                h1({ children }) {
                    return (
                        <h1 className="text-xl md:text-2xl font-bold mt-4 mb-2 text-foreground">
                            {children}
                        </h1>
                    );
                },
                h2({ children }) {
                    return (
                        <h2 className="text-lg md:text-xl font-bold mt-3 mb-2 text-foreground">
                            {children}
                        </h2>
                    );
                },
                h3({ children }) {
                    return (
                        <h3 className="text-base md:text-lg font-semibold mt-3 mb-1 text-foreground">
                            {children}
                        </h3>
                    );
                },
                p({ children }) {
                    return (
                        <p className="my-2 leading-relaxed text-foreground break-words max-w-full">
                            {children}
                        </p>
                    );
                },
                ul({ children }) {
                    return (
                        <ul className="list-disc list-inside my-2 space-y-1 text-foreground max-w-full">
                            {children}
                        </ul>
                    );
                },
                ol({ children }) {
                    return (
                        <ol className="list-decimal list-inside my-2 space-y-1 text-foreground max-w-full">
                            {children}
                        </ol>
                    );
                },
                li({ children }) {
                    return (
                        <li className="ml-2 break-words max-w-full">
                            {children}
                        </li>
                    );
                },
                a({ href, children }) {
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {children}
                        </a>
                    );
                },
                blockquote({ children }) {
                    return (
                        <blockquote className="border-l-4 border-primary/50 pl-4 my-2 italic text-muted-foreground break-words max-w-full">
                            {children}
                        </blockquote>
                    );
                },
                table({ children }) {
                    return (
                        <div className="my-2 overflow-x-auto max-w-full">
                            <table className="w-full border-collapse border border-border">
                                {children}
                            </table>
                        </div>
                    );
                },
                th({ children }) {
                    return (
                        <th className="border border-border px-2 sm:px-3 py-1 sm:py-2 bg-muted font-semibold text-left text-xs sm:text-sm break-words">
                            {children}
                        </th>
                    );
                },
                td({ children }) {
                    return (
                        <td className="border border-border px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm break-words">
                            {children}
                        </td>
                    );
                },
                hr() {
                    return <hr className="my-4 border-border" />;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

interface CodeBlockProps {
    language: string;
    code: string;
}

const CodeBlock = ({ language, code }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="relative group rounded-lg overflow-hidden bg-[#1e1e1e] my-2">
            {/* Language label and copy button */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
                <span className="text-xs font-mono text-gray-400 uppercase">
                    {language}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 px-2 text-xs hover:bg-[#3e3e3e] transition-opacity opacity-70 hover:opacity-100"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                        </>
                    )}
                </Button>
            </div>

            {/* Code content */}
            <div className="overflow-x-auto max-w-full">
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: "0.75rem",
                        background: "#1e1e1e",
                        fontSize: "0.75rem",
                        maxWidth: "100%",
                    }}
                    wrapLongLines={true}
                    PreTag="div"
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};
