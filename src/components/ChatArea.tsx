import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Upload, FileText } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { MobileHeader } from "./MobileHeader";
import { DesktopHeader } from "./DesktopHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatDB, Message } from "@/lib/db";
import { aiApi, UnifiedMessage, Provider } from "@/lib/aiApi";
import { useToast } from "@/hooks/use-toast";
import {
    ProcessedDocument,
    formatDocumentsForRAG,
} from "@/lib/documentProcessor";
import { DocumentUpload } from "@/components/DocumentUpload";

interface ChatAreaProps {
    onMenuClick: () => void;
    sessionId?: string;
    modelName?: string;
    provider?: Provider;
    onOpenSettings?: () => void;
}

export const ChatArea = ({
    onMenuClick,
    sessionId,
    modelName,
    provider,
    onOpenSettings,
}: ChatAreaProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionTitle, setSessionTitle] = useState("");
    const [uploadedDocuments, setUploadedDocuments] = useState<
        ProcessedDocument[]
    >([]);
    const [documentPanelOpen, setDocumentPanelOpen] = useState(false);
    const [ragEnabledForSession, setRagEnabledForSession] = useState(true);
    const { toast } = useToast();

    // Copy markdown function
    const handleCopyMarkdown = async () => {
        if (!sessionId || messages.length === 0) {
            toast({
                title: "No Messages",
                description: "This chat session has no messages to copy.",
                variant: "destructive",
            });
            return;
        }

        try {
            const session = await chatDB.getSession(sessionId);

            // Format messages as markdown
            let markdown = `# Chat Session: ${session?.title || "Untitled"}\n\n`;
            markdown += `**Model:** ${modelName || "Unknown"}\n`;
            markdown += `**Provider:** ${provider || "Unknown"}\n`;
            markdown += `**Date:** ${new Date(session?.timestamp || Date.now()).toLocaleString()}\n\n`;
            markdown += `---\n\n`;

            messages.forEach((message) => {
                const role = message.role === "user" ? "👤 User" : "🤖 AI";
                markdown += `## ${role}\n\n`;
                markdown += `${message.content}\n\n`;

                if (message.metadata) {
                    markdown += `<details>\n<summary>Metadata</summary>\n\n`;
                    if (message.metadata.duration)
                        markdown += `- Duration: ${message.metadata.duration}\n`;
                    if (message.metadata.tokens)
                        markdown += `- Tokens: ${message.metadata.tokens}\n`;
                    if (message.metadata.speed)
                        markdown += `- Speed: ${message.metadata.speed}\n`;
                    markdown += `\n</details>\n\n`;
                }

                markdown += `---\n\n`;
            });

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(markdown);
                    toast({
                        title: "Copied!",
                        description:
                            "Chat session copied as markdown to clipboard.",
                    });
                    return;
                } catch (clipboardError) {
                    console.warn(
                        "Clipboard API failed, trying fallback:",
                        clipboardError,
                    );
                }
            }

            // Fallback method using textarea
            const textArea = document.createElement("textarea");
            textArea.value = markdown;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand("copy");
                if (successful) {
                    toast({
                        title: "Copied!",
                        description:
                            "Chat session copied as markdown to clipboard.",
                    });
                } else {
                    throw new Error("execCommand failed");
                }
            } catch (fallbackError) {
                console.error("Fallback copy failed:", fallbackError);
                // Show markdown in a modal as last resort
                toast({
                    title: "Copy Failed",
                    description:
                        "Please grant clipboard permission or copy manually.",
                    variant: "destructive",
                });
            } finally {
                document.body.removeChild(textArea);
            }
        } catch (error) {
            console.error("Error copying markdown:", error);
            toast({
                title: "Copy Failed",
                description: "An error occurred. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Get RAG settings from localStorage
    const getRAGSettings = () => {
        const settings = localStorage.getItem("chatbotx-settings");
        if (settings) {
            const parsed = JSON.parse(settings);
            return {
                ragEnabled: parsed.ragEnabled ?? true,
            };
        }
        return { ragEnabled: true };
    };

    const ragSettings = getRAGSettings();

    // Combined RAG enabled state (global setting AND session toggle)
    const isRagEnabled = ragSettings.ragEnabled && ragEnabledForSession;

    // Load messages when session changes
    useEffect(() => {
        if (sessionId) {
            loadMessages();
            loadSessionInfo();
        } else {
            setMessages([]);
            setSessionTitle("No session selected");
        }
    }, [sessionId]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                textareaRef.current.scrollHeight + "px";
        }
    }, [input]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector(
                "[data-radix-scroll-area-viewport]",
            );
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    const loadMessages = async () => {
        if (!sessionId) return;
        try {
            const sessionMessages =
                await chatDB.getMessagesBySession(sessionId);
            setMessages(sessionMessages);
        } catch (error) {
            console.error("Error loading messages:", error);
            toast({
                title: "Error",
                description: "Failed to load messages",
                variant: "destructive",
            });
        }
    };

    const loadSessionInfo = async () => {
        if (!sessionId) return;
        try {
            const session = await chatDB.getSession(sessionId);
            if (session) {
                setSessionTitle(session.title);
            }
        } catch (error) {
            console.error("Error loading session:", error);
        }
    };

    const generateDocumentInstruction = (documentCount: number): string => {
        return `\n\n[IMPORTANT INSTRUCTIONS - You MUST follow these guidelines]\n
You have access to ${documentCount} document(s) uploaded by the user. These documents contain crucial information that you should use to answer the user's questions.

GUIDELINES:
1. **Primary Source**: Always prioritize information from the uploaded documents when answering questions related to their content
2. **Citation**: When referencing information from documents, mention which document you're citing (e.g., "According to Document 1...")
3. **Accuracy**: Only state information that is explicitly mentioned in the documents. Do not make assumptions beyond what's written
4. **Completeness**: If the documents don't contain enough information to fully answer the question, acknowledge this limitation
5. **Context**: Use your general knowledge to provide context, but clearly distinguish between document content and your general knowledge
6. **Synthesis**: When multiple documents are relevant, synthesize information across them coherently

Now, please answer the user's question using the document context provided above.\n\n`;
    };

    const handleSendMessage = async () => {
        if (
            !input.trim() ||
            isLoading ||
            !sessionId ||
            !modelName ||
            !provider
        ) {
            if (!sessionId) {
                toast({
                    title: "No session",
                    description: "Please create a new chat session first",
                    variant: "destructive",
                });
            }
            return;
        }

        const userMessageContent = input.trim();
        setInput("");
        setIsLoading(true);

        // Add user message to UI and DB
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            sessionId,
            role: "user",
            content: userMessageContent,
            timestamp: Date.now(),
        };

        try {
            await chatDB.addMessage(userMessage);
            setMessages((prev) => [...prev, userMessage]);

            // Build RAG context from uploaded documents
            let ragContext = "";

            if (isRagEnabled && uploadedDocuments.length > 0) {
                const docContext = formatDocumentsForRAG(uploadedDocuments);
                ragContext += docContext;
                ragContext += generateDocumentInstruction(
                    uploadedDocuments.length,
                );
            }

            // Prepare messages for API
            const apiMessages: UnifiedMessage[] = messages
                .filter((m) => m.role === "user" || m.role === "ai")
                .map((m) => ({
                    role: m.role === "ai" ? "assistant" : "user",
                    content: m.content,
                }));

            // Add current user message with RAG context
            const messageContent = ragContext
                ? ragContext + userMessageContent
                : userMessageContent;

            apiMessages.push({
                role: "user",
                content: messageContent,
            });

            // Start timing
            const startTime = Date.now();
            let firstTokenTime: number | null = null;

            // Create placeholder for AI response
            const aiMessageId = `ai-${Date.now()}`;
            let aiContent = "";

            const aiMessage: Message = {
                id: aiMessageId,
                sessionId,
                role: "ai",
                content: "",
                timestamp: Date.now(),
                modelName,
                metadata: {},
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Call AI API with streaming
            await aiApi.sendMessage(
                {
                    provider,
                    model: modelName,
                    messages: apiMessages,
                    temperature: 0.7,
                    max_tokens: 2000,
                },
                // onChunk
                (chunk: string) => {
                    if (firstTokenTime === null) {
                        firstTokenTime = Date.now();
                    }
                    aiContent += chunk;
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiMessageId
                                ? { ...m, content: aiContent }
                                : m,
                        ),
                    );
                },
                // onComplete
                async () => {
                    const endTime = Date.now();
                    const duration = ((endTime - startTime) / 1000).toFixed(2);
                    const ttft = firstTokenTime
                        ? ((firstTokenTime - startTime) / 1000).toFixed(2)
                        : "0";

                    // Count tokens (approximate)
                    const tokenCount = aiContent.split(/\s+/).length;
                    const tokensPerSecond = (
                        tokenCount /
                        ((endTime - startTime) / 1000)
                    ).toFixed(0);

                    const finalMetadata = {
                        duration: `${duration}s`,
                        ttft: `${ttft}s`,
                        tokens: `${tokenCount} tokens`,
                        speed: `${tokensPerSecond} tok/s`,
                    };

                    // Update message with metadata
                    const finalMessage: Message = {
                        id: aiMessageId,
                        sessionId,
                        role: "ai",
                        content: aiContent,
                        timestamp: Date.now(),
                        modelName,
                        metadata: finalMetadata,
                    };

                    await chatDB.addMessage(finalMessage);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === aiMessageId ? finalMessage : m,
                        ),
                    );

                    // Update session with last message
                    const session = await chatDB.getSession(sessionId);
                    if (session) {
                        await chatDB.updateSession({
                            ...session,
                            lastMessage: userMessageContent.substring(0, 50),
                            timestamp: Date.now(),
                        });
                    }

                    setIsLoading(false);
                },
                // onError
                (error: Error) => {
                    console.error("Error from AI API:", error);
                    toast({
                        title: "Error",
                        description:
                            error.message || "Failed to get response from AI",
                        variant: "destructive",
                    });

                    // Remove the placeholder message
                    setMessages((prev) =>
                        prev.filter((m) => m.id !== aiMessageId),
                    );
                    setIsLoading(false);
                },
            );
        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive",
            });
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDocumentUpload = (documents: ProcessedDocument[]) => {
        setUploadedDocuments((prev) => [...prev, ...documents]);
        toast({
            title: "Documents Uploaded",
            description: `Successfully uploaded ${documents.length} document(s) for RAG context`,
        });
    };

    const handleRemoveDocument = (docId: string) => {
        setUploadedDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        toast({
            title: "Document Removed",
            description: "Document removed from RAG context",
        });
    };

    return (
        <div className="flex-1 flex flex-col h-screen">
            {/* Headers */}
            <div className="lg:hidden">
                <MobileHeader
                    onMenuClick={onMenuClick}
                    sessionTitle={sessionTitle}
                    ragEnabled={ragEnabledForSession}
                    uploadedDocumentCount={uploadedDocuments.length}
                    onOpenDocuments={() => setDocumentPanelOpen(true)}
                    onOpenSettings={onOpenSettings}
                    onCopyMarkdown={handleCopyMarkdown}
                />
            </div>
            <div className="hidden lg:block">
                <DesktopHeader
                    sessionTitle={sessionTitle}
                    ragEnabled={ragEnabledForSession}
                    uploadedDocumentCount={uploadedDocuments.length}
                    onOpenDocuments={() => setDocumentPanelOpen(true)}
                    onOpenSettings={onOpenSettings}
                    onCopyMarkdown={handleCopyMarkdown}
                />
            </div>

            {/* Main Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12 space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-foreground">
                                    Welcome to ChatBotX RAG! 🚀
                                </h2>
                                <p className="text-muted-foreground">
                                    Upload documents to enhance AI responses
                                    with your own content
                                </p>
                            </div>

                            {/* Document Upload Card */}
                            <div className="bg-muted/50 border-2 border-dashed rounded-lg p-8 max-w-2xl mx-auto">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-primary/10 rounded-full">
                                        <FileText className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <h3 className="font-semibold text-lg">
                                            Upload Your Documents
                                        </h3>
                                        <p className="text-sm text-muted-foreground max-w-md">
                                            Support for PDF, TXT, DOC, DOCX, and
                                            more. The AI will use your documents
                                            to provide accurate, context-aware
                                            answers.
                                        </p>
                                    </div>
                                    <DocumentUpload
                                        onDocumentsProcessed={
                                            handleDocumentUpload
                                        }
                                    />
                                </div>
                            </div>

                            {/* Feature Highlights */}
                            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6">
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <div className="text-2xl mb-2">📄</div>
                                    <h4 className="font-semibold mb-1">
                                        Document Context
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        AI uses your uploaded documents as
                                        primary source
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <div className="text-2xl mb-2">🎯</div>
                                    <h4 className="font-semibold mb-1">
                                        Accurate Answers
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Responses based on your specific content
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <div className="text-2xl mb-2">🔒</div>
                                    <h4 className="font-semibold mb-1">
                                        Private & Secure
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Documents processed locally in your
                                        browser
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))
                    )}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>AI is thinking...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-4xl mx-auto p-4">
                    {/* RAG Status Bar */}
                    {uploadedDocuments.length > 0 && (
                        <div className="mb-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">
                                        RAG Context Active:{" "}
                                        {uploadedDocuments.length} document(s)
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDocumentPanelOpen(true)}
                                >
                                    Manage
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                uploadedDocuments.length > 0
                                    ? "Ask questions about your documents..."
                                    : "Type your message... (Upload documents for RAG)"
                            }
                            className="min-h-[60px] max-h-[200px] resize-none pr-24"
                            disabled={isLoading}
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDocumentPanelOpen(true)}
                                title="Upload Documents"
                            >
                                <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground text-center">
                        Press Enter to send, Shift+Enter for new line
                        {uploadedDocuments.length > 0 && (
                            <span className="ml-2">
                                • Using {uploadedDocuments.length} document(s)
                                as context
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Management Panel */}
            {documentPanelOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-lg">
                                Manage RAG Documents
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDocumentPanelOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                <div className="border-2 border-dashed rounded-lg p-6">
                                    <DocumentUpload
                                        onDocumentsProcessed={
                                            handleDocumentUpload
                                        }
                                    />
                                </div>

                                {uploadedDocuments.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-muted-foreground">
                                            Uploaded Documents (
                                            {uploadedDocuments.length})
                                        </h4>
                                        {uploadedDocuments.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {doc.filename}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {(
                                                                doc.size / 1024
                                                            ).toFixed(1)}{" "}
                                                            KB • {doc.type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleRemoveDocument(
                                                            doc.id,
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </div>
    );
};
