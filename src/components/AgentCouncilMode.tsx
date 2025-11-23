/**
 * Agent Council Mode - Modern UI with Model Selector
 */

import { useState, useRef, useEffect, useMemo } from "react";
import {
    Send,
    Loader2,
    Users,
    Trophy,
    Award,
    BarChart3,
    Settings,
    Plus,
    Trash2,
    Save,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    History,
    X,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CouncilModelSelector } from "./CouncilModelSelector";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    run_full_council,
    get_council_members,
    get_chairman,
    is_council_available,
    getAvailableModels,
    saveCouncilConfig,
    loadCouncilConfig,
    Stage1Response,
    Stage2Ranking,
    Stage3Result,
    CouncilMetadata,
    CouncilMember,
    DEFAULT_COUNCIL_MEMBERS,
    DEFAULT_CHAIRMAN,
} from "@/lib/agentCouncil";
import { useGroqModels } from "@/hooks/useGroqModels";
import { useTogetherModels } from "@/hooks/useTogetherModels";
import { useOpenRouterModels } from "@/hooks/useOpenRouterModels";

interface CouncilTurn {
    id: string;
    query: string;
    stage1_results: Stage1Response[];
    stage2_results: Stage2Ranking[];
    stage3_result: Stage3Result;
    metadata: CouncilMetadata;
    timestamp: Date;
}

interface CouncilSession {
    id: string;
    title: string;
    turns: CouncilTurn[];
    createdAt: Date;
    updatedAt: Date;
}

interface AgentCouncilModeProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AgentCouncilMode = ({
    isOpen,
    onClose,
}: AgentCouncilModeProps) => {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentStage, setCurrentStage] = useState<
        "idle" | "stage1" | "stage2" | "stage3" | "complete"
    >("idle");
    const [sessions, setSessions] = useState<CouncilSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(
        null,
    );
    const [currentTurns, setCurrentTurns] = useState<CouncilTurn[]>([]);
    const [showConfig, setShowConfig] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>(
        get_council_members(),
    );
    const [chairman, setChairman] = useState<CouncilMember>(get_chairman());
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const SESSIONS_STORAGE_KEY = "agent_council_sessions";

    // Load models from hooks
    const { models: groqModels } = useGroqModels();
    const { models: togetherModels } = useTogetherModels();
    const { freeModels: openrouterModels } = useOpenRouterModels();

    const availableProviders = getAvailableModels();
    const councilAvailable = is_council_available();

    // Build model options
    const modelOptions = useMemo(
        () => ({
            groq: groqModels,
            together: togetherModels,
            openrouter: openrouterModels,
        }),
        [groqModels, togetherModels, openrouterModels],
    );

    // Get current session - MUST be before useEffect that uses it
    const currentSession = useMemo(
        () => sessions.find((s) => s.id === currentSessionId),
        [sessions, currentSessionId],
    );

    // Auto-scroll
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector(
                "[data-radix-scroll-area-viewport]",
            );
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [currentSession, currentStage]);

    // Load saved config and sessions on mount
    useEffect(() => {
        const saved = loadCouncilConfig();
        if (saved) {
            setCouncilMembers(saved.members);
            setChairman(saved.chairman);
        }

        // Load sessions
        const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                setSessions(
                    parsed.map((s: any) => ({
                        ...s,
                        createdAt: new Date(s.createdAt),
                        updatedAt: new Date(s.updatedAt),
                        turns: s.turns.map((t: any) => ({
                            ...t,
                            timestamp: new Date(t.timestamp),
                        })),
                    })),
                );
            } catch (error) {
                console.error("Error loading sessions:", error);
            }
        }
    }, []);

    // Save sessions to localStorage
    const saveSessions = (newSessions: CouncilSession[]) => {
        try {
            localStorage.setItem(
                SESSIONS_STORAGE_KEY,
                JSON.stringify(newSessions),
            );
        } catch (error) {
            console.error("Error saving sessions:", error);
        }
    };

    const handleSubmit = async () => {
        if (!input.trim() || isLoading || !councilAvailable) return;

        const query = input.trim();
        setInput("");
        setIsLoading(true);
        setCurrentStage("stage1");

        try {
            setCurrentStage("stage1");
            await new Promise((resolve) => setTimeout(resolve, 500));

            const result = await run_full_council(query, {
                members: councilMembers,
                chairman,
            });

            setCurrentStage("stage2");
            await new Promise((resolve) => setTimeout(resolve, 500));

            setCurrentStage("stage3");
            await new Promise((resolve) => setTimeout(resolve, 500));

            setCurrentStage("complete");

            const turn: CouncilTurn = {
                id: Date.now().toString(),
                query,
                ...result,
                timestamp: new Date(),
            };

            // Add turn to current session or create new session
            if (currentSessionId && currentSession) {
                const updatedSession = {
                    ...currentSession,
                    turns: [...currentSession.turns, turn],
                    updatedAt: new Date(),
                };
                const newSessions = sessions.map((s) =>
                    s.id === currentSessionId ? updatedSession : s,
                );
                setSessions(newSessions);
                saveSessions(newSessions);
            } else {
                // Create new session
                const newSession: CouncilSession = {
                    id: Date.now().toString(),
                    title: query.slice(0, 50) + (query.length > 50 ? "..." : ""),
                    turns: [turn],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const newSessions = [newSession, ...sessions];
                setSessions(newSessions);
                setCurrentSessionId(newSession.id);
                saveSessions(newSessions);
            }

            toast({
                title: "Council Complete!",
                description: `${result.stage1_results.length} members participated`,
            });
        } catch (error) {
            console.error("Error running council:", error);
            toast({
                title: "Council Failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "An error occurred",
                variant: "destructive",
            });
            setCurrentStage("idle");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewSession = () => {
        setCurrentSessionId(null);
        setCurrentTurns([]);
        toast({
            title: "New Session",
            description: "Started a new council session",
        });
    };

    const handleSelectSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
            setCurrentTurns(session.turns);
        }
        setShowSessions(false);
    };

    const handleDeleteSession = (sessionId: string) => {
        const newSessions = sessions.filter((s) => s.id !== sessionId);
        setSessions(newSessions);
        saveSessions(newSessions);
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            setCurrentTurns([]);
        }
        setSessionToDelete(null);
        toast({
            title: "Session Deleted",
            description: "Council session has been removed",
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSaveConfig = () => {
        saveCouncilConfig({ members: councilMembers, chairman });
        toast({
            title: "Configuration Saved",
            description: "Council settings saved successfully",
        });
    };

    const handleResetConfig = () => {
        setCouncilMembers(DEFAULT_COUNCIL_MEMBERS);
        setChairman(DEFAULT_CHAIRMAN);
        saveCouncilConfig({
            members: DEFAULT_COUNCIL_MEMBERS,
            chairman: DEFAULT_CHAIRMAN,
        });
        toast({
            title: "Configuration Reset",
            description: "Council reset to default configuration",
        });
    };

    const handleAddMember = () => {
        if (councilMembers.length >= 10) {
            toast({
                title: "Maximum Members",
                description: "Council can have maximum 10 members",
                variant: "destructive",
            });
            return;
        }

        // Find first available provider
        const firstProvider = availableProviders.groq
            ? "groq"
            : availableProviders.together
              ? "together"
              : "openrouter";
        const firstModel =
            modelOptions[firstProvider][0]?.id || "llama-3.1-8b-instant";

        const newMember: CouncilMember = {
            name: `Member ${councilMembers.length + 1}`,
            provider: firstProvider,
            modelId: firstModel,
        };
        setCouncilMembers([...councilMembers, newMember]);
    };

    const handleRemoveMember = (index: number) => {
        if (councilMembers.length <= 2) {
            toast({
                title: "Minimum Members",
                description: "Council must have at least 2 members",
                variant: "destructive",
            });
            return;
        }
        setCouncilMembers(councilMembers.filter((_, i) => i !== index));
    };

    const handleUpdateMember = (
        index: number,
        field: keyof CouncilMember,
        value: string,
    ) => {
        const updated = [...councilMembers];
        updated[index] = { ...updated[index], [field]: value };

        // If provider changed, update to first model of that provider
        if (field === "provider") {
            const newProvider = value as "groq" | "together" | "openrouter";
            const firstModel = modelOptions[newProvider][0]?.id || "";
            updated[index].modelId = firstModel;
        }

        setCouncilMembers(updated);
    };

    const getStageProgress = () => {
        switch (currentStage) {
            case "idle":
                return 0;
            case "stage1":
                return 25;
            case "stage2":
                return 50;
            case "stage3":
                return 75;
            case "complete":
                return 100;
            default:
                return 0;
        }
    };

    const getStageLabel = () => {
        switch (currentStage) {
            case "stage1":
                return "Stage 1: Collecting responses...";
            case "stage2":
                return "Stage 2: Peer ranking...";
            case "stage3":
                return "Stage 3: Chairman synthesis...";
            case "complete":
                return "Complete!";
            default:
                return "";
        }
    };

    const getProviderBadgeColor = (provider: string) => {
        const colors = {
            groq: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
            together: "bg-purple-500/20 text-purple-300 border-purple-500/30",
            openrouter: "bg-green-500/20 text-green-300 border-green-500/30",
        };
        return colors[provider as keyof typeof colors] || "";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl max-h-[95vh] p-0 gap-0">
                <DialogHeader className="border-b bg-card p-3 sm:p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="p-1.5 sm:p-2 bg-primary/10 border border-primary/20 rounded-lg flex-shrink-0">
                                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-base sm:text-xl">
                                    Agent Council Mode
                                </DialogTitle>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    {currentSession
                                        ? currentSession.title
                                        : "New Session"}{" "}
                                    • {councilMembers.length} Members
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNewSession}
                                className="h-8 px-2"
                            >
                                <Sparkles className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline text-xs">
                                    New
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSessions(!showSessions)}
                                className="h-8 px-2"
                            >
                                <History className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline text-xs">
                                    {sessions.length}
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowConfig(!showConfig)}
                                className="h-8 px-2"
                            >
                                {showConfig ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                    <Settings className="w-3.5 h-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Configuration Panel */}
                    <Collapsible open={showConfig}>
                        <CollapsibleContent>
                            <div className="pt-2">
                                <div className="bg-background rounded-lg border p-3 space-y-3 max-h-[40vh] overflow-y-auto">
                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-xs font-semibold">
                                            Council Configuration
                                        </h4>
                                        <div className="flex gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleAddMember}
                                                className="h-7 text-xs"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Add
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleResetConfig}
                                                className="h-7 text-xs"
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                Reset
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveConfig}
                                                className="h-7 text-xs"
                                            >
                                                <Save className="w-3 h-3 mr-1" />
                                                Save
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Council Members */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium">
                                            Council Members ({councilMembers.length}
                                            )
                                        </Label>
                                        {councilMembers.map((member, index) => (
                                            <Card
                                                key={index}
                                                className="p-2.5 bg-card/50"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Input
                                                            value={member.name}
                                                            onChange={(e) =>
                                                                handleUpdateMember(
                                                                    index,
                                                                    "name",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="h-7 text-xs font-medium"
                                                            placeholder="Member name"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleRemoveMember(
                                                                    index,
                                                                )
                                                            }
                                                            className="h-7 w-7 p-0 flex-shrink-0"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-destructive" />
                                                        </Button>
                                                    </div>
                                                    <CouncilModelSelector
                                                        provider={member.provider}
                                                        modelId={member.modelId}
                                                        modelOptions={modelOptions}
                                                        onProviderChange={(
                                                            newProvider,
                                                        ) =>
                                                            handleUpdateMember(
                                                                index,
                                                                "provider",
                                                                newProvider,
                                                            )
                                                        }
                                                        onModelChange={(
                                                            newModelId,
                                                        ) =>
                                                            handleUpdateMember(
                                                                index,
                                                                "modelId",
                                                                newModelId,
                                                            )
                                                        }
                                                        availableProviders={
                                                            availableProviders
                                                        }
                                                    />
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    <Separator />

                                    {/* Chairman */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium flex items-center gap-1.5">
                                            <Trophy className="w-3.5 h-3.5 text-primary" />
                                            Chairman
                                        </Label>
                                        <Card className="p-2.5 bg-primary/5 border-primary/20">
                                            <div className="space-y-2">
                                                <Input
                                                    value={chairman.name}
                                                    onChange={(e) =>
                                                        setChairman({
                                                            ...chairman,
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    className="h-7 text-xs font-medium"
                                                    placeholder="Chairman name"
                                                />
                                                <CouncilModelSelector
                                                    provider={chairman.provider}
                                                    modelId={chairman.modelId}
                                                    modelOptions={modelOptions}
                                                    onProviderChange={(
                                                        newProvider,
                                                    ) =>
                                                        setChairman({
                                                            ...chairman,
                                                            provider: newProvider,
                                                            modelId:
                                                                modelOptions[
                                                                    newProvider
                                                                ][0]?.id || "",
                                                        })
                                                    }
                                                    onModelChange={(newModelId) =>
                                                        setChairman({
                                                            ...chairman,
                                                            modelId: newModelId,
                                                        })
                                                    }
                                                    availableProviders={
                                                        availableProviders
                                                    }
                                                />
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </DialogHeader>

                <div className="flex h-[calc(95vh-200px)] sm:h-[calc(95vh-180px)] relative">
                    {/* Sessions Sidebar */}
                    {showSessions && (
                        <div className="absolute sm:relative z-10 w-full sm:w-64 h-full border-r bg-background sm:bg-muted/30 flex flex-col shadow-lg sm:shadow-none">
                            <div className="p-3 border-b bg-card sm:bg-transparent">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">
                                        Sessions History
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowSessions(false)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    {sessions.length === 0 ? (
                                        <div className="text-center text-xs text-muted-foreground p-4">
                                            No sessions yet
                                        </div>
                                    ) : (
                                        sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "group relative p-2 rounded-lg cursor-pointer transition-colors",
                                                    "hover:bg-accent",
                                                    currentSessionId ===
                                                        session.id &&
                                                        "bg-primary/10 border border-primary/20",
                                                )}
                                                onClick={() =>
                                                    handleSelectSession(
                                                        session.id,
                                                    )
                                                }
                                            >
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">
                                                            {session.title}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {session.turns.length}{" "}
                                                            turns •{" "}
                                                            {session.updatedAt.toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSessionToDelete(
                                                                session.id,
                                                            );
                                                        }}
                                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Main Content */}
                    <ScrollArea
                        className="flex-1 px-3 sm:px-6"
                        ref={scrollAreaRef}
                    >
                        <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
                            {/* Welcome */}
                            {!currentSession &&
                                !isLoading &&
                                sessions.length === 0 && (
                                    <Card className="border-primary/20">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                                <Users className="w-4 h-4 text-primary" />
                                                Welcome to Agent Council Mode
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                A collaborative AI system where
                                                multiple models work together in 3
                                                stages:
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                                                        1
                                                    </div>
                                                    <span className="text-xs">
                                                        {councilMembers.length}{" "}
                                                        models respond
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                                                        2
                                                    </div>
                                                    <span className="text-xs">
                                                        Peer ranking
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                                                        3
                                                    </div>
                                                    <span className="text-xs">
                                                        Chairman synthesis
                                                    </span>
                                                </div>
                                            </div>
                                            {!councilAvailable && (
                                                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                                                    <p className="text-xs text-destructive font-medium">
                                                        ⚠️ Configure API keys
                                                        first
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                            {/* Loading */}
                            {isLoading && (
                                <Card className="border-primary/50">
                                    <CardContent className="pt-4 pb-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span className="text-xs sm:text-sm font-medium">
                                                    {getStageLabel()}
                                                </span>
                                            </div>
                                            <Progress
                                                value={getStageProgress()}
                                                className="h-1.5"
                                            />
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                <span>Stage {currentStage === "stage1" ? "1" : currentStage === "stage2" ? "2" : "3"} of 3</span>
                                                <span>{getStageProgress()}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Results - Show all turns */}
                            {currentSession && currentSession.turns.length > 0 && (
                                <div className="space-y-5 sm:space-y-6">
                                    {currentSession.turns.map((turn, turnIndex) => (
                                        <div key={turn.id} className="space-y-4">
                                            {turnIndex > 0 && <Separator className="my-6 sm:my-8" />}
                                            
                                            {/* Turn Header */}
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <Badge variant="outline" className="text-xs font-medium">
                                                    Turn {turnIndex + 1}
                                                </Badge>
                                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                                    {turn.timestamp.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Question */}
                                            <Card className="bg-muted/30 border-muted shadow-sm">
                                                <CardHeader className="pb-2 sm:pb-3">
                                                    <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                                                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                                        Question
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                                                        {turn.query}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            {/* Final Answer */}
                                            <Card className="bg-primary/5 border-primary/20 shadow-md">
                                                <CardHeader className="pb-2 sm:pb-3">
                                                    <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                                                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                                        Final Answer
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px] sm:text-xs">
                                                        Synthesized by{" "}
                                                        <span className="font-medium text-foreground/80">
                                                            {turn.stage3_result.chairman}
                                                        </span>
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                                        <MarkdownRenderer
                                                            content={
                                                                turn.stage3_result
                                                                    .response
                                                            }
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Details Tabs - Collapsible */}
                                            <Collapsible>
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-xs sm:text-sm"
                                                    >
                                                        <BarChart3 className="w-3.5 h-3.5 mr-2" />
                                                        <span className="hidden sm:inline">
                                                            View Details (Rankings, Stage 1, Stage 2)
                                                        </span>
                                                        <span className="inline sm:hidden">
                                                            View Details
                                                        </span>
                                                        <ChevronDown className="w-3.5 h-3.5 ml-auto" />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="mt-3 sm:mt-4">
                                                    <Tabs defaultValue="rankings" className="w-full">
                                                        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                                                            <TabsTrigger
                                                                value="rankings"
                                                                className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 py-2"
                                                            >
                                                                <BarChart3 className="w-3 h-3 sm:mr-1.5" />
                                                                <span className="hidden sm:inline">
                                                                    Rankings
                                                                </span>
                                                            </TabsTrigger>
                                                            <TabsTrigger
                                                                value="stage1"
                                                                className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 py-2"
                                                            >
                                                                <Users className="w-3 h-3 sm:mr-1.5" />
                                                                <span className="hidden sm:inline">
                                                                    Stage 1
                                                                </span>
                                                            </TabsTrigger>
                                                            <TabsTrigger
                                                                value="stage2"
                                                                className="text-[10px] sm:text-xs data-[state=active]:bg-primary/10 py-2"
                                                            >
                                                                <Award className="w-3 h-3 sm:mr-1.5" />
                                                                <span className="hidden sm:inline">
                                                                    Stage 2
                                                                </span>
                                                            </TabsTrigger>
                                                        </TabsList>

                                                        {/* Rankings Tab */}
                                                        <TabsContent value="rankings" className="mt-3">
                                                            <Card className="bg-card border-muted shadow-sm">
                                                                <CardHeader className="pb-3 sm:pb-4">
                                                                    <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                                                                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                                                        Aggregate Rankings
                                                                    </CardTitle>
                                                                    <CardDescription className="text-[10px] sm:text-xs">
                                                                        Average ranking from peer
                                                                        reviews
                                                                    </CardDescription>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="space-y-2 sm:space-y-2.5">
                                                                        {turn.metadata.aggregate_rankings.map(
                                                            (
                                                                ranking,
                                                                index,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        ranking.member
                                                                    }
                                                                    className={cn(
                                                                        "p-2.5 rounded-lg border transition-all",
                                                                        index ===
                                                                            0 &&
                                                                            "bg-yellow-500/10 border-yellow-500/30",
                                                                        index ===
                                                                            1 &&
                                                                            "bg-muted/50 border-muted",
                                                                        index ===
                                                                            2 &&
                                                                            "bg-orange-500/10 border-orange-500/30",
                                                                        index >
                                                                            2 &&
                                                                            "bg-muted/30 border-muted/50",
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                                            <div
                                                                                className={cn(
                                                                                    "text-base sm:text-lg flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full",
                                                                                    index ===
                                                                                        0 &&
                                                                                        "bg-yellow-500/20",
                                                                                    index ===
                                                                                        1 &&
                                                                                        "bg-muted",
                                                                                    index ===
                                                                                        2 &&
                                                                                        "bg-orange-500/20",
                                                                                    index >
                                                                                        2 &&
                                                                                        "bg-muted/50 text-[10px] sm:text-xs font-semibold",
                                                                                )}
                                                                            >
                                                                                {index ===
                                                                                0
                                                                                    ? "🥇"
                                                                                    : index ===
                                                                                        1
                                                                                      ? "🥈"
                                                                                      : index ===
                                                                                          2
                                                                                        ? "🥉"
                                                                                        : index +
                                                                                          1}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="font-semibold text-xs sm:text-sm truncate">
                                                                                    {
                                                                                        ranking.member
                                                                                    }
                                                                                </div>
                                                                                <div className="text-[10px] sm:text-xs text-muted-foreground">
                                                                                    {
                                                                                        ranking.rankings_count
                                                                                    }{" "}
                                                                                    votes
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right flex-shrink-0">
                                                                            <div className="text-lg sm:text-xl font-bold">
                                                                                {
                                                                                    ranking.average_rank
                                                                                }
                                                                            </div>
                                                                            <div className="text-[9px] sm:text-[10px] text-muted-foreground">
                                                                                Avg
                                                                                Rank
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* Stage 1 Tab */}
                                        <TabsContent value="stage1" className="mt-3">
                                            <div className="space-y-3 sm:space-y-4">
                                                {turn.stage1_results?.map(
                                                    (result, index) => (
                                                        <Card key={index} className="bg-card border-muted shadow-sm">
                                                            <CardHeader className="pb-2 sm:pb-3">
                                                                <CardTitle className="text-xs sm:text-sm flex items-center justify-between gap-2">
                                                                    <span className="truncate font-semibold">
                                                                        {
                                                                            result.member
                                                                        }
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "text-[9px] sm:text-[10px] flex-shrink-0",
                                                                            getProviderBadgeColor(
                                                                                result.provider,
                                                                            ),
                                                                        )}
                                                                    >
                                                                        {result.provider.toUpperCase()}
                                                                    </Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                                    <MarkdownRenderer
                                                                        content={
                                                                            result.response
                                                                        }
                                                                    />
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </TabsContent>

                                                        {/* Stage 2 Tab */}
                                                        <TabsContent value="stage2" className="mt-3">
                                                            <div className="space-y-3 sm:space-y-4">
                                                                {turn.stage2_results.map(
                                                    (result, index) => (
                                                        <Card key={index} className="bg-card border-muted shadow-sm">
                                                            <CardHeader className="pb-2 sm:pb-3">
                                                                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                                                                    <Award className="w-3.5 h-3.5 text-primary" />
                                                                    {result.member}'s Ranking
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                                    <MarkdownRenderer
                                                                        content={
                                                                            result.ranking
                                                                        }
                                                                    />
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </TabsContent>
                                                    </Tabs>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="border-t bg-background p-3 sm:p-4">
                        {currentSession && currentSession.turns.length > 0 && (
                            <div className="mb-2 text-[10px] text-muted-foreground">
                                💬 Continue conversation in this session
                            </div>
                        )}
                        <div className="relative">
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    councilAvailable
                                        ? currentSession
                                            ? "Ask a follow-up question..."
                                            : "Ask the council a question..."
                                        : "Please configure API keys first..."
                                }
                                className="min-h-[60px] sm:min-h-[70px] pr-12 resize-none text-xs sm:text-sm"
                                disabled={isLoading || !councilAvailable}
                            />
                            <Button
                                size="icon"
                                onClick={handleSubmit}
                                disabled={
                                    !input.trim() ||
                                    isLoading ||
                                    !councilAvailable
                                }
                                className="absolute bottom-2 right-2 h-8 w-8"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        <div className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground text-center">
                            Enter to submit • Shift+Enter for new line
                            {currentSession && " • Asking in same session"}
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={!!sessionToDelete}
                    onOpenChange={() => setSessionToDelete(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Delete Session?</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                            This will permanently delete this council session and
                            all its turns. This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSessionToDelete(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    sessionToDelete &&
                                    handleDeleteSession(sessionToDelete)
                                }
                            >
                                Delete
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
};
