import { useState, useEffect, useRef } from "react";
import {
    DEBUG_MODE,
    debugLog,
    debugInfo,
    debugWarn,
    debugError,
} from "@/lib/debug";
import {
    Send,
    Loader2,
    X,
    CheckSquare,
    Square,
    Zap,
    Trash2,
    MessageSquare,
    Plus,
    Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { aiApi, Provider } from "@/lib/aiApi";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { cn } from "@/lib/utils";
import { chatDB, AgentSession, AgentResponse } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModelSelection {
    provider: Provider;
    modelId: string;
    modelName: string;
}

interface ModelResponse {
    provider: Provider;
    modelId: string;
    modelName: string;
    content: string;
    isLoading: boolean;
    error?: string;
    metadata?: {
        duration?: string;
        tokens?: string;
        speed?: string;
    };
}

interface ConversationTurn {
    id: string;
    userMessage: string;
    responses: ModelResponse[];
    timestamp: number;
}

interface AgentModeProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AgentMode = ({ isOpen, onClose }: AgentModeProps) => {
    const [selectedModels, setSelectedModels] = useState<ModelSelection[]>([]);
    const [input, setInput] = useState("");
    const [conversation, setConversation] = useState<ConversationTurn[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessions, setSessions] = useState<AgentSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(
        null,
    );
    const [sessionTitle, setSessionTitle] = useState("");
    const [showSessions, setShowSessions] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const allModels = aiApi.getAllModels();
    const availableProviders = aiApi.getAvailableProviders();

    // Quick presets
    const quickPresets = [
        {
            name: "Fast Trio",
            icon: "⚡",
            models: [
                {
                    provider: "groq" as Provider,
                    modelId: "llama-3.1-8b-instant",
                },
                { provider: "groq" as Provider, modelId: "mixtral-8x7b-32768" },
                { provider: "groq" as Provider, modelId: "gemma2-9b-it" },
            ],
        },
        {
            name: "Best of Each",
            icon: "🏆",
            models: [
                { provider: "poe" as Provider, modelId: "GPT-5-mini" },
                {
                    provider: "together" as Provider,
                    modelId: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                },
                {
                    provider: "groq" as Provider,
                    modelId: "llama-3.1-8b-instant",
                },
            ],
        },
    ];

    useEffect(() => {
        if (isOpen) {
            loadSessions();
        }
    }, [isOpen]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                textareaRef.current.scrollHeight + "px";
        }
    }, [input]);

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation]);

    const loadSessions = async () => {
        try {
            const allSessions = await chatDB.getAllAgentSessions();
            setSessions(allSessions);
        } catch (error) {
            console.error("Error loading agent sessions:", error);
        }
    };

    const createNewSession = async () => {
        if (selectedModels.length === 0) {
            toast({
                title: "No models selected",
                description: "Please select at least one model first",
                variant: "destructive",
            });
            return;
        }

        const timestamp = Date.now();
        const newSession: AgentSession = {
            id: `agent-${timestamp}`,
            title: `Agent Chat ${new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
            timestamp,
            models: selectedModels,
        };

        try {
            await chatDB.createAgentSession(newSession);
            setCurrentSessionId(newSession.id);
            setSessionTitle(newSession.title);
            setConversation([]);
            await loadSessions();
            setShowSessions(false);
            toast({
                title: "Session Created",
                description: `New agent session with ${selectedModels.length} models`,
            });
        } catch (error) {
            console.error("Error creating session:", error);
            toast({
                title: "Error",
                description: "Failed to create session",
                variant: "destructive",
            });
        }
    };

    const loadSession = async (sessionId: string) => {
        debugInfo("📂", "Loading session:", sessionId);
        try {
            const session = await chatDB.getAgentSession(sessionId);
            if (!session) return;

            const responses =
                await chatDB.getAgentResponsesBySession(sessionId);

            debugInfo("📊", "Loaded responses:", {
                sessionId,
                count: responses.length,
                responses: responses.map((r) => ({
                    userMsg: r.userMessage.substring(0, 30),
                    responsesCount: r.responses.length,
                    hasContent: r.responses.every(
                        (rr) => rr.content && rr.content.length > 0,
                    ),
                })),
            });

            setCurrentSessionId(sessionId);
            setSessionTitle(session.title);
            setSelectedModels(
                session.models.map((m) => ({
                    provider: m.provider as Provider,
                    modelId: m.modelId,
                    modelName: m.modelName,
                })),
            );

            // Convert stored responses to conversation format
            const conversationHistory: ConversationTurn[] = responses.map(
                (resp) => ({
                    id: resp.id,
                    userMessage: resp.userMessage,
                    timestamp: resp.timestamp,
                    responses: resp.responses.map((r) => ({
                        provider: r.provider as Provider,
                        modelId: r.modelId,
                        modelName: r.modelName,
                        content: r.content,
                        isLoading: false,
                        error: r.error,
                        metadata: r.metadata,
                    })),
                }),
            );

            debugInfo(
                "✓",
                "Setting conversation with",
                conversationHistory.length,
                "turns",
            );
            setConversation(conversationHistory);
            setShowSessions(false);
            toast({
                title: "Session Loaded",
                description: session.title,
            });
        } catch (error) {
            console.error("Error loading session:", error);
            toast({
                title: "Error",
                description: "Failed to load session",
                variant: "destructive",
            });
        }
    };

    const updateSessionTitle = async (newTitle: string) => {
        if (!currentSessionId || !newTitle.trim()) return;

        try {
            const session = await chatDB.getAgentSession(currentSessionId);
            if (session) {
                session.title = newTitle.trim();
                await chatDB.updateAgentSession(session);
                setSessionTitle(newTitle.trim());
                await loadSessions();
                setIsEditingTitle(false);
                toast({
                    title: "Title Updated",
                    description: "Session title has been updated",
                });
            }
        } catch (error) {
            console.error("Error updating title:", error);
        }
    };

    const deleteSession = async (sessionId: string) => {
        try {
            await chatDB.deleteAgentSession(sessionId);
            await loadSessions();
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setConversation([]);
                setSessionTitle("");
            }
            setShowDeleteDialog(false);
            toast({
                title: "Session Deleted",
                description: "Agent session has been deleted",
            });
        } catch (error) {
            console.error("Error deleting session:", error);
            toast({
                title: "Error",
                description: "Failed to delete session",
                variant: "destructive",
            });
        }
    };

    const toggleModelSelection = (
        provider: Provider,
        modelId: string,
        modelName: string,
    ) => {
        const exists = selectedModels.find(
            (m) => m.provider === provider && m.modelId === modelId,
        );

        if (exists) {
            setSelectedModels(
                selectedModels.filter(
                    (m) => !(m.provider === provider && m.modelId === modelId),
                ),
            );
        } else {
            setSelectedModels([
                ...selectedModels,
                { provider, modelId, modelName },
            ]);
        }
    };

    const isModelSelected = (provider: Provider, modelId: string) => {
        return selectedModels.some(
            (m) => m.provider === provider && m.modelId === modelId,
        );
    };

    const applyQuickPreset = (preset: (typeof quickPresets)[0]) => {
        const newSelections: ModelSelection[] = [];
        preset.models.forEach(({ provider, modelId }) => {
            const models = aiApi.getModelsByProvider(provider);
            const model = models.find((m) => m.id === modelId);
            if (model && availableProviders.includes(provider)) {
                newSelections.push({
                    provider,
                    modelId,
                    modelName: model.name,
                });
            }
        });
        setSelectedModels(newSelections);
    };

    const getProviderColor = (provider: Provider) => {
        switch (provider) {
            case "poe":
                return "border-blue-500 bg-blue-500/10";
            case "together":
                return "border-purple-500 bg-purple-500/10";
            case "groq":
                return "border-yellow-500 bg-yellow-500/10";
            case "openrouter":
                return "border-green-500 bg-green-500/10";
            default:
                return "border-gray-500 bg-gray-500/10";
        }
    };

    const getProviderBadgeColor = (provider: Provider) => {
        switch (provider) {
            case "poe":
                return "bg-blue-500/20 text-blue-300 border-blue-500/30";
            case "together":
                return "bg-purple-500/20 text-purple-300 border-purple-500/30";
            case "groq":
                return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
            case "openrouter":
                return "bg-green-500/20 text-green-300 border-green-500/30";
            default:
                return "bg-gray-500/20 text-gray-300 border-gray-500/30";
        }
    };

    const buildContextMessages = (userMessage: string) => {
        const contextMessages: Array<{
            role: "user" | "assistant";
            content: string;
        }> = [];

        // Add previous conversation turns
        conversation.forEach((turn) => {
            contextMessages.push({ role: "user", content: turn.userMessage });

            // Add first model's response as context (or aggregate if needed)
            if (turn.responses.length > 0 && turn.responses[0].content) {
                contextMessages.push({
                    role: "assistant",
                    content: turn.responses[0].content,
                });
            }
        });

        // Add current message
        contextMessages.push({ role: "user", content: userMessage });

        return contextMessages;
    };

    const handleSendMessage = async () => {
        if (!input.trim() || selectedModels.length === 0) return;

        // Ensure we have a session
        let sessionId = currentSessionId;
        if (!sessionId) {
            debugInfo("⚡", "No session, creating new one...");
            const timestamp = Date.now();
            const newSession: AgentSession = {
                id: `agent-${timestamp}`,
                title: `Agent Chat ${new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
                timestamp,
                models: selectedModels,
            };

            try {
                await chatDB.createAgentSession(newSession);
                sessionId = newSession.id;
                setCurrentSessionId(sessionId);
                setSessionTitle(newSession.title);
                await loadSessions();
                debugInfo("✓", "Session created:", sessionId);
            } catch (error) {
                console.error("Error creating session:", error);
                toast({
                    title: "Error",
                    description: "Failed to create session",
                    variant: "destructive",
                });
                return;
            }
        }

        setIsProcessing(true);
        const userMessage = input.trim();
        setInput("");

        const turnId = `turn-${Date.now()}`;

        debugInfo("🚀", "Starting message send:", {
            sessionId,
            models: selectedModels.length,
            hasSession: !!sessionId,
        });
        const contextMessages = buildContextMessages(userMessage);

        // Initialize empty responses
        const initialResponses: ModelResponse[] = selectedModels.map(
            (model) => ({
                provider: model.provider,
                modelId: model.modelId,
                modelName: model.modelName,
                content: "",
                isLoading: true,
            }),
        );

        // Collect final responses for database save
        const finalResponsesMap = new Map<number, ModelResponse>();

        const newTurn: ConversationTurn = {
            id: turnId,
            userMessage,
            responses: initialResponses,
            timestamp: Date.now(),
        };

        setConversation((prev) => [...prev, newTurn]);

        // Send to all models in parallel
        const promises = selectedModels.map(async (model, index) => {
            const startTime = Date.now();
            let content = "";
            let tokenCount = 0;

            try {
                await aiApi.sendMessage(
                    {
                        provider: model.provider,
                        model: model.modelId,
                        messages: contextMessages,
                    },
                    (chunk: string) => {
                        content += chunk;
                        tokenCount = content.split(/\s+/).length;

                        setConversation((prev) =>
                            prev.map((turn) =>
                                turn.id === turnId
                                    ? {
                                          ...turn,
                                          responses: turn.responses.map(
                                              (r, i) =>
                                                  i === index
                                                      ? {
                                                            ...r,
                                                            content,
                                                            isLoading: true,
                                                        }
                                                      : r,
                                          ),
                                      }
                                    : turn,
                            ),
                        );
                    },
                    () => {
                        const endTime = Date.now();
                        const duration = ((endTime - startTime) / 1000).toFixed(
                            2,
                        );
                        const tokensPerSecond = (
                            tokenCount /
                            ((endTime - startTime) / 1000)
                        ).toFixed(0);

                        const metadata = {
                            duration: `${duration}s`,
                            tokens: `${tokenCount} tokens`,
                            speed: `${tokensPerSecond} tok/s`,
                        };

                        // Store final response in Map
                        finalResponsesMap.set(index, {
                            provider: model.provider,
                            modelId: model.modelId,
                            modelName: model.modelName,
                            content: content,
                            isLoading: false,
                            metadata: metadata,
                        });

                        debugInfo(
                            "✓",
                            `Collected response ${index + 1}/${selectedModels.length}:`,
                            {
                                provider: model.provider,
                                contentLength: content.length,
                                model: model.modelName,
                            },
                        );

                        setConversation((prev) =>
                            prev.map((turn) =>
                                turn.id === turnId
                                    ? {
                                          ...turn,
                                          responses: turn.responses.map(
                                              (r, i) =>
                                                  i === index
                                                      ? {
                                                            ...r,
                                                            content,
                                                            isLoading: false,
                                                            metadata,
                                                        }
                                                      : r,
                                          ),
                                      }
                                    : turn,
                            ),
                        );
                    },
                    (error: Error) => {
                        setConversation((prev) =>
                            prev.map((turn) =>
                                turn.id === turnId
                                    ? {
                                          ...turn,
                                          responses: turn.responses.map(
                                              (r, i) =>
                                                  i === index
                                                      ? {
                                                            ...r,
                                                            isLoading: false,
                                                            error: error.message,
                                                        }
                                                      : r,
                                          ),
                                      }
                                    : turn,
                            ),
                        );
                    },
                );
            } catch (error) {
                setConversation((prev) =>
                    prev.map((turn) =>
                        turn.id === turnId
                            ? {
                                  ...turn,
                                  responses: turn.responses.map((r, i) =>
                                      i === index
                                          ? {
                                                ...r,
                                                isLoading: false,
                                                error:
                                                    error instanceof Error
                                                        ? error.message
                                                        : "Unknown error",
                                            }
                                          : r,
                                  ),
                              }
                            : turn,
                    ),
                );
            }
        });

        await Promise.all(promises);

        // Save to database using collected final responses
        try {
            if (sessionId && finalResponsesMap.size > 0) {
                // Wait a bit to ensure all state updates are done
                await new Promise((resolve) => setTimeout(resolve, 200));

                const finalResponses = Array.from(finalResponsesMap.values());

                const agentResponse: AgentResponse = {
                    id: turnId,
                    sessionId: sessionId,
                    userMessage,
                    timestamp: Date.now(),
                    responses: finalResponses.map((r) => ({
                        provider: r.provider,
                        modelId: r.modelId,
                        modelName: r.modelName,
                        content: r.content,
                        metadata: r.metadata,
                        error: r.error,
                    })),
                };

                debugInfo("💾", "Saving agent response:", {
                    sessionId: sessionId,
                    turnId,
                    responses: finalResponses.length,
                    hasContent: finalResponses.every(
                        (r) => r.content.length > 0,
                    ),
                });

                await chatDB.addAgentResponse(agentResponse);

                debugInfo("✓", "Agent response saved successfully");

                // Update session lastMessage
                const session = await chatDB.getAgentSession(sessionId);
                if (session) {
                    session.lastMessage = userMessage.substring(0, 50);
                    session.timestamp = Date.now();
                    await chatDB.updateAgentSession(session);
                    debugInfo("✓", "Session updated");
                }
            } else {
                debugWarn("⚠️ No session or responses to save");
            }
        } catch (error) {
            console.error("❌ Error saving to database:", error);
        }

        setIsProcessing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[100vw] sm:max-w-[95vw] w-full h-[100vh] sm:h-[95vh] max-h-[100vh] sm:max-h-[95vh] p-0 gap-0 flex flex-col">
                <DialogHeader className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                            {currentSessionId && !isEditingTitle ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <DialogTitle className="text-sm sm:text-base truncate">
                                        {sessionTitle}
                                    </DialogTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 flex-shrink-0 hidden sm:flex"
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ) : isEditingTitle ? (
                                <Input
                                    value={sessionTitle}
                                    onChange={(e) =>
                                        setSessionTitle(e.target.value)
                                    }
                                    onBlur={() =>
                                        updateSessionTitle(sessionTitle)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            updateSessionTitle(sessionTitle);
                                        }
                                    }}
                                    className="h-8 sm:h-9 text-sm"
                                    autoFocus
                                />
                            ) : (
                                <DialogTitle className="text-sm sm:text-base truncate">
                                    Agent Mode
                                </DialogTitle>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge
                                variant="outline"
                                className="text-[9px] sm:text-[10px] px-1.5 py-0.5"
                            >
                                {selectedModels.length}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSessions(!showSessions)}
                                className="h-8 sm:h-9 text-xs px-2.5 sm:px-3 lg:hidden"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                            {/* Debug Button - Controlled by VITE_DEBUG_MODE */}
                            {DEBUG_MODE && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        console.log("=== AGENT DB DEBUG ===");
                                        const allSessions =
                                            await chatDB.getAllAgentSessions();
                                        console.log(
                                            "Total sessions:",
                                            allSessions.length,
                                        );
                                        for (const s of allSessions) {
                                            const resp =
                                                await chatDB.getAgentResponsesBySession(
                                                    s.id,
                                                );
                                            console.log(`Session: ${s.title}`, {
                                                id: s.id,
                                                models: s.models.length,
                                                responses: resp.length,
                                                data: resp,
                                            });
                                        }
                                    }}
                                    className="h-7 sm:h-8 text-[10px] sm:text-xs"
                                    title="Debug DB"
                                >
                                    🐛
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogDescription className="text-xs mt-1.5 hidden sm:block">
                        Multi-model comparison with continuous context
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 sm:p-4 overflow-hidden min-h-0">
                    {/* Sessions Sidebar - Mobile Overlay */}
                    {showSessions && (
                        <div
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                            onClick={() => setShowSessions(false)}
                        />
                    )}

                    <div
                        className={cn(
                            "flex-shrink-0 flex flex-col border border-border rounded-lg overflow-hidden bg-sidebar",
                            showSessions
                                ? "fixed inset-y-0 left-0 w-[90vw] max-w-[340px] z-50 lg:relative lg:w-72 xl:w-80"
                                : "hidden lg:flex lg:w-72 xl:w-80",
                        )}
                    >
                        <div className="p-3 border-b border-border bg-sidebar-accent/50 flex-shrink-0">
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-sm font-semibold">
                                    Model Selection
                                </h3>
                                {showSessions && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 lg:hidden"
                                        onClick={() => setShowSessions(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-1.5 flex-wrap mb-2">
                                {quickPresets.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => applyQuickPreset(preset)}
                                        className="text-[10px] px-2.5 py-1.5 rounded bg-sidebar-accent hover:bg-sidebar-accent/80 border border-border transition-all"
                                    >
                                        {preset.icon} {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-3 space-y-3">
                                {availableProviders.map((provider) => {
                                    const models =
                                        aiApi.getModelsByProvider(provider);
                                    return (
                                        <div key={provider}>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                                {provider}
                                            </h4>
                                            <div className="space-y-1.5">
                                                {models.map((model) => {
                                                    const selected =
                                                        isModelSelected(
                                                            provider,
                                                            model.id,
                                                        );
                                                    return (
                                                        <button
                                                            key={model.id}
                                                            onClick={() =>
                                                                toggleModelSelection(
                                                                    provider,
                                                                    model.id,
                                                                    model.name,
                                                                )
                                                            }
                                                            className={cn(
                                                                "w-full text-left p-2.5 rounded-md border transition-all hover:bg-sidebar-accent/80",
                                                                selected
                                                                    ? "border-primary bg-primary/10"
                                                                    : "border-border bg-sidebar-accent/30",
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                {selected ? (
                                                                    <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                                                                ) : (
                                                                    <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-medium truncate">
                                                                        {
                                                                            model.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground truncate">
                                                                        {model.description.substring(
                                                                            0,
                                                                            30,
                                                                        )}
                                                                        ...
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Sessions List */}
                        <div className="border-t border-border flex-shrink-0">
                            <div className="p-3 border-b border-border bg-sidebar-accent/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Sessions
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={createNewSession}
                                        className="h-8 text-xs px-2.5"
                                        disabled={selectedModels.length === 0}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        <span>New</span>
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-36 sm:h-44">
                                <div className="p-2.5 space-y-1.5">
                                    {sessions.length === 0 ? (
                                        <div className="text-xs text-muted-foreground text-center py-6">
                                            No sessions yet
                                        </div>
                                    ) : (
                                        sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "p-2.5 rounded hover:bg-sidebar-accent cursor-pointer group flex items-center justify-between",
                                                    currentSessionId ===
                                                        session.id &&
                                                        "bg-sidebar-accent border-l-2 border-primary",
                                                )}
                                                onClick={() =>
                                                    loadSession(session.id)
                                                }
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium truncate">
                                                        {session.title}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {session.models.length}{" "}
                                                        models •{" "}
                                                        {new Date(
                                                            session.timestamp,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSessionToDelete(
                                                            session.id,
                                                        );
                                                        setShowDeleteDialog(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0 min-h-0">
                        {/* Conversation Area */}
                        <ScrollArea className="flex-1 mb-4 min-h-0">
                            {conversation.length === 0 ? (
                                <div className="h-full flex items-center justify-center p-4">
                                    <div className="text-center text-muted-foreground">
                                        <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-sm font-medium">
                                            Agent Mode Ready
                                        </p>
                                        <p className="text-xs mt-2">
                                            {currentSessionId
                                                ? "Start chatting with context preservation"
                                                : "Select models and create a session to start"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 p-4">
                                    {conversation.map((turn) => (
                                        <div
                                            key={turn.id}
                                            className="space-y-3 sm:space-y-4"
                                        >
                                            {/* User Message */}
                                            <div className="flex justify-end">
                                                <div className="bg-primary/20 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-[80%]">
                                                    <p className="text-[11px] sm:text-xs lg:text-sm text-foreground whitespace-pre-wrap break-words">
                                                        {turn.userMessage}
                                                    </p>
                                                    <span className="text-[8px] sm:text-[9px] text-muted-foreground mt-1 block">
                                                        {new Date(
                                                            turn.timestamp,
                                                        ).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Model Responses */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                                                {turn.responses.map(
                                                    (response, idx) => (
                                                        <Card
                                                            key={`${response.provider}-${response.modelId}-${idx}`}
                                                            className={cn(
                                                                "flex flex-col border-2",
                                                                getProviderColor(
                                                                    response.provider,
                                                                ),
                                                            )}
                                                        >
                                                            <CardHeader className="pb-2 p-2 sm:p-3">
                                                                <CardTitle className="text-[11px] sm:text-xs flex items-center justify-between">
                                                                    <span className="truncate">
                                                                        {
                                                                            response.modelName
                                                                        }
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "text-[8px] sm:text-[8px] px-1 py-0 ml-1 flex-shrink-0",
                                                                            getProviderBadgeColor(
                                                                                response.provider,
                                                                            ),
                                                                        )}
                                                                    >
                                                                        {
                                                                            response.provider
                                                                        }
                                                                    </Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="flex-1 pt-0 p-2 sm:p-3 flex flex-col min-h-0">
                                                                <ScrollArea className="flex-1 -mx-2 px-2 sm:-mx-3 sm:px-3 min-h-[120px] sm:min-h-[150px]">
                                                                    {response.error ? (
                                                                        <div className="text-[10px] sm:text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/30">
                                                                            <p className="font-semibold mb-1">
                                                                                Error:
                                                                            </p>
                                                                            <p>
                                                                                {
                                                                                    response.error
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    ) : response.isLoading &&
                                                                      !response.content ? (
                                                                        <div className="flex items-center gap-2 text-muted-foreground text-[10px] sm:text-xs">
                                                                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                                                            Waiting...
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-[10px] sm:text-xs leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                                                                            <MarkdownRenderer
                                                                                content={
                                                                                    response.content
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </ScrollArea>
                                                                {response.metadata &&
                                                                    !response.isLoading && (
                                                                        <div className="mt-2 pt-2 border-t border-border">
                                                                            <div className="flex flex-wrap gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] text-muted-foreground">
                                                                                {response
                                                                                    .metadata
                                                                                    .duration && (
                                                                                    <span>
                                                                                        ⏱️{" "}
                                                                                        {
                                                                                            response
                                                                                                .metadata
                                                                                                .duration
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                                {response
                                                                                    .metadata
                                                                                    .tokens && (
                                                                                    <span className="hidden sm:inline">
                                                                                        📊{" "}
                                                                                        {
                                                                                            response
                                                                                                .metadata
                                                                                                .tokens
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                                {response
                                                                                    .metadata
                                                                                    .speed && (
                                                                                    <span>
                                                                                        ⚡{" "}
                                                                                        {
                                                                                            response
                                                                                                .metadata
                                                                                                .speed
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                {response.isLoading &&
                                                                    response.content && (
                                                                        <div className="mt-1 flex items-center gap-1 text-[8px] sm:text-[9px] text-muted-foreground">
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                            Streaming...
                                                                        </div>
                                                                    )}
                                                            </CardContent>
                                                        </Card>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={conversationEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border bg-sidebar/50">
                            <div className="flex gap-2">
                                <Textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        !currentSessionId
                                            ? "Create session first..."
                                            : selectedModels.length === 0
                                              ? "Select models first..."
                                              : `Continue conversation with ${selectedModels.length} models...`
                                    }
                                    rows={1}
                                    disabled={
                                        isProcessing ||
                                        selectedModels.length === 0
                                    }
                                    className="min-h-[44px] max-h-32 resize-none text-sm flex-1"
                                />
                                <Button
                                    size="icon"
                                    className="h-11 w-11 flex-shrink-0"
                                    onClick={handleSendMessage}
                                    disabled={
                                        isProcessing ||
                                        !input.trim() ||
                                        selectedModels.length === 0 ||
                                        !currentSessionId
                                    }
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                            {conversation.length > 0 && (
                                <div className="flex justify-between items-center mt-2.5 text-[10px] text-muted-foreground">
                                    <span>
                                        {conversation.length} turns • Context
                                        preserved
                                    </span>
                                    {isProcessing && (
                                        <span className="flex items-center gap-1.5">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Processing...
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this agent session and
                            all its conversation history. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                sessionToDelete &&
                                deleteSession(sessionToDelete)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
};
