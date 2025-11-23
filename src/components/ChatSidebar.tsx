import { useState, useEffect } from "react";
import {
    MessageSquare,
    MoreVertical,
    X,
    Trash2,
    ChevronDown,
    ChevronUp,
    Calendar,
    Clock,
    Trash,
    AlertTriangle,
    Zap,
    Users,
    Search,
    Filter,
    DollarSign,
    TrendingDown,
    TrendingUp,
    Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { chatDB, Session } from "@/lib/db";
import { Provider, aiApi } from "@/lib/aiApi";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenRouterModelManager } from "@/components/OpenRouterModelManager";
import { TogetherModelManager } from "@/components/TogetherModelManager";
import { GroqModelManager } from "@/components/GroqModelManager";
import { GeneralSettings } from "@/components/GeneralSettings";
import { useTogetherModels, formatPrice } from "@/hooks/useTogetherModels";

interface EnhancedModel {
    id: string;
    name: string;
    description: string;
    speed: string;
    features: string[];
    pricing?: {
        input: number;
        output: number;
    };
    isFree?: boolean;
}

interface ChatSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    currentSessionId?: string;
    onSessionChange?: (sessionId: string) => void;
    onNewSession?: (provider: Provider, modelId: string) => void;
    onOpenAgentMode?: () => void;
    onOpenASSDebateMode?: () => void;
    onOpenAgentCouncilMode?: () => void;
}

interface GroupedSessions {
    label: string;
    sessions: Session[];
}

export const ChatSidebar = ({
    isOpen = true,
    onClose,
    currentSessionId,
    onSessionChange,
    onNewSession,
    onOpenAgentMode,
    onOpenASSDebateMode,
    onOpenAgentCouncilMode,
}: ChatSidebarProps) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [expandedProvider, setExpandedProvider] = useState<Provider | null>(
        "poe",
    );
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(["Today"]),
    );
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<"models" | "settings">("models");
    const [searchQuery, setSearchQuery] = useState("");
    const [modelFilter, setModelFilter] = useState<"all" | "free">("all");
    const [priceFilter, setPriceFilter] = useState<
        "all" | "free" | "cheapest" | "expensive"
    >("all");

    // Use Together models hook for dynamic pricing
    const { models: togetherModelsData, freeModels: togetherFreeModels } =
        useTogetherModels();

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const allSessions = await chatDB.getAllSessions();
            setSessions(allSessions);
        } catch (error) {
            console.error("Error loading sessions:", error);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await chatDB.deleteSession(sessionId);
            await loadSessions();

            if (currentSessionId === sessionId && sessions.length > 0) {
                const remainingSessions = sessions.filter(
                    (s) => s.id !== sessionId,
                );
                if (remainingSessions.length > 0 && onSessionChange) {
                    onSessionChange(remainingSessions[0].id);
                }
            }
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    };

    const handleDeleteAllSessions = async () => {
        try {
            for (const session of sessions) {
                await chatDB.deleteSession(session.id);
            }
            await loadSessions();
            setShowDeleteAllDialog(false);
            if (onSessionChange) {
                onSessionChange("");
            }
        } catch (error) {
            console.error("Error deleting all sessions:", error);
        }
    };

    const handleNewChat = (provider: Provider, modelId: string) => {
        if (onNewSession) {
            onNewSession(provider, modelId);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const groupSessionsByDate = (): GroupedSessions[] => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const groups: { [key: string]: Session[] } = {
            Today: [],
            Yesterday: [],
            "Last 7 Days": [],
            Older: [],
        };

        sessions.forEach((session) => {
            const sessionDate = new Date(session.timestamp);
            const sessionDay = new Date(
                sessionDate.getFullYear(),
                sessionDate.getMonth(),
                sessionDate.getDate(),
            );

            if (sessionDay.getTime() === today.getTime()) {
                groups.Today.push(session);
            } else if (sessionDay.getTime() === yesterday.getTime()) {
                groups.Yesterday.push(session);
            } else if (sessionDate >= lastWeek) {
                groups["Last 7 Days"].push(session);
            } else {
                groups.Older.push(session);
            }
        });

        return Object.entries(groups)
            .filter(([_, sessions]) => sessions.length > 0)
            .map(([label, sessions]) => ({ label, sessions }));
    };

    const toggleGroup = (label: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(label)) {
            newExpanded.delete(label);
        } else {
            newExpanded.add(label);
        }
        setExpandedGroups(newExpanded);
    };

    const availableProviders = aiApi.getAvailableProviders();

    // Get all models and apply search/filter
    const allModels = aiApi.getAllModels();
    const filteredModels = allModels.filter((model) => {
        // Search filter
        const matchesSearch =
            searchQuery === "" ||
            model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.description.toLowerCase().includes(searchQuery.toLowerCase());

        // Free filter
        const matchesFreeFilter =
            modelFilter === "all" ||
            (modelFilter === "free" &&
                (model.features.some(
                    (f) => f.includes("Free") || f.includes("🆓"),
                ) ||
                    model.id.includes(":free")));

        // Price filter for Together AI models
        const matchesPriceFilter = (() => {
            if (model.provider !== "together") return true; // Non-Together models pass
            if (priceFilter === "all") return true;

            const togetherModel = togetherModelsData.find(
                (m) => m.id === model.id,
            );
            if (!togetherModel) return true;

            if (priceFilter === "free") return togetherModel.isFree;
            if (priceFilter === "cheapest") {
                const totalCost =
                    togetherModel.pricing.input + togetherModel.pricing.output;
                return totalCost < 1; // Cheapest: under $1/1M
            }
            if (priceFilter === "expensive") {
                const totalCost =
                    togetherModel.pricing.input + togetherModel.pricing.output;
                return totalCost >= 2; // Premium: $2+/1M
            }
            return true;
        })();

        return matchesSearch && matchesFreeFilter && matchesPriceFilter;
    });

    // Group filtered models by provider
    const poeModels = filteredModels.filter((m) => m.provider === "poe");
    const togetherModels = filteredModels.filter(
        (m) => m.provider === "together",
    );
    const groqModels = filteredModels.filter((m) => m.provider === "groq");
    const openrouterModels = filteredModels.filter(
        (m) => m.provider === "openrouter",
    );

    // Count free models
    const freeModelsCount = allModels.filter(
        (m) =>
            m.features.some((f) => f.includes("Free") || f.includes("🆓")) ||
            m.id.includes(":free"),
    ).length;

    const getProviderColor = (provider: Provider) => {
        switch (provider) {
            case "poe":
                return "text-blue-400";
            case "together":
                return "text-purple-400";
            case "groq":
                return "text-yellow-400";
            case "openrouter":
                return "text-green-400";
            default:
                return "text-gray-400";
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

    const getProviderDisplayName = (provider: string) => {
        switch (provider) {
            case "poe":
                return "Poe";
            case "together":
                return "Together";
            case "groq":
                return "Groq";
            case "openrouter":
                return "OpenRouter";
            default:
                return provider;
        }
    };

    const renderProviderSection = (
        provider: Provider,
        models: EnhancedModel[],
        providerName: string,
    ) => {
        // Enhance Together models with pricing from hook
        const enhancedModels = models.map((model) => {
            if (provider === "together") {
                const togetherModel = togetherModelsData.find(
                    (m) => m.id === model.id,
                );
                if (togetherModel) {
                    return {
                        ...model,
                        pricing: togetherModel.pricing,
                        isFree: togetherModel.isFree,
                    };
                }
            }
            return model;
        });
        const isExpanded = expandedProvider === provider;

        return (
            <div key={provider} className="mb-2">
                <button
                    onClick={() =>
                        setExpandedProvider(isExpanded ? null : provider)
                    }
                    className="w-full flex items-center justify-between p-2 sm:p-2 rounded hover:bg-sidebar-accent/50 transition-colors"
                >
                    <div className="flex items-center gap-2 sm:gap-2 min-w-0">
                        <span
                            className={cn(
                                "text-xs sm:text-xs font-semibold uppercase truncate",
                                getProviderColor(provider),
                            )}
                        >
                            {providerName}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[9px] sm:text-[9px] px-1.5 sm:px-1.5 py-0 flex-shrink-0",
                                getProviderBadgeColor(provider),
                            )}
                        >
                            {models.length}
                        </Badge>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-muted-foreground flex-shrink-0" />
                    ) : (
                        <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                </button>

                {isExpanded && (
                    <div className="mt-1 space-y-1.5 ml-2 sm:ml-2">
                        {enhancedModels.map((model: EnhancedModel) => (
                            <button
                                key={model.id}
                                onClick={() =>
                                    handleNewChat(provider, model.id)
                                }
                                className="w-full text-left p-2 sm:p-2 rounded-md hover:bg-sidebar-accent transition-colors group border border-transparent hover:border-sidebar-border"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-1">
                                            <div className="text-[11px] sm:text-[11px] font-medium text-sidebar-foreground truncate">
                                                {model.name}
                                            </div>
                                            {(model.features?.some(
                                                (f) =>
                                                    f.includes("Free") ||
                                                    f.includes("🆓"),
                                            ) ||
                                                model.id.includes(":free")) && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[8px] sm:text-[8px] px-1 py-0 bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0"
                                                >
                                                    FREE
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-[9px] sm:text-[9px] text-muted-foreground line-clamp-2 leading-relaxed">
                                            {model.description}
                                        </div>
                                        {/* Show pricing for Together models */}
                                        {provider === "together" &&
                                            model.pricing && (
                                                <div className="flex gap-1 mt-1">
                                                    {model.isFree ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[8px] px-1 py-0 bg-green-500/10 text-green-400 border-green-500/30"
                                                        >
                                                            💚 Free
                                                        </Badge>
                                                    ) : (
                                                        <>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[8px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30"
                                                            >
                                                                ⬆️{" "}
                                                                {formatPrice(
                                                                    model
                                                                        .pricing
                                                                        .input,
                                                                )}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[8px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30"
                                                            >
                                                                ⬇️{" "}
                                                                {formatPrice(
                                                                    model
                                                                        .pricing
                                                                        .output,
                                                                )}
                                                            </Badge>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                        <Badge
                                            variant={
                                                model.speed === "Fast"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className="text-[9px] px-1.5 py-0.5"
                                        >
                                            {model.speed}
                                        </Badge>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const groupedSessions = groupSessionsByDate();

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div
                className={cn(
                    "fixed lg:relative inset-y-0 left-0 z-50 w-[90vw] max-w-[360px] sm:w-[85vw] sm:max-w-[340px] lg:w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 overflow-hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="lg:hidden flex justify-end p-2 border-b border-sidebar-border">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-3 lg:p-4 border-b border-sidebar-border flex-shrink-0">
                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                        <h2 className="text-xs lg:text-sm font-medium text-sidebar-foreground flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            <span className="hidden sm:inline">
                                Chat Sessions
                            </span>
                            <span className="sm:hidden">Sessions</span>
                        </h2>
                        <div className="flex items-center gap-1">
                            <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0"
                            >
                                {sessions.length}
                            </Badge>
                            {sessions.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowDeleteAllDialog(true)}
                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title="Delete all sessions"
                                >
                                    <Trash className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <ScrollArea className="h-40 sm:h-44 lg:h-56">
                        <div className="space-y-3 pr-2">
                            {sessions.length === 0 ? (
                                <div className="text-xs text-muted-foreground text-center py-6 px-2">
                                    No sessions yet. Create a new chat below!
                                </div>
                            ) : (
                                groupedSessions.map((group) => (
                                    <div
                                        key={group.label}
                                        className="space-y-1"
                                    >
                                        <button
                                            onClick={() =>
                                                toggleGroup(group.label)
                                            }
                                            className="w-full flex items-center justify-between px-1 py-1 hover:bg-sidebar-accent/30 rounded transition-colors"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-muted-foreground" />
                                                <span className="text-[9px] lg:text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                    {group.label}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[7px] lg:text-[8px] px-1 py-0"
                                                >
                                                    {group.sessions.length}
                                                </Badge>
                                            </div>
                                            {expandedGroups.has(group.label) ? (
                                                <ChevronUp className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-muted-foreground" />
                                            )}
                                        </button>

                                        {expandedGroups.has(group.label) && (
                                            <div className="space-y-1 ml-1">
                                                {group.sessions.map(
                                                    (session) => (
                                                        <div
                                                            key={session.id}
                                                            className={cn(
                                                                "flex items-start justify-between p-2 rounded hover:bg-sidebar-accent/80 cursor-pointer group transition-all",
                                                                currentSessionId ===
                                                                    session.id
                                                                    ? "bg-sidebar-accent border-l-2 border-blue-500"
                                                                    : "bg-sidebar-accent/30",
                                                            )}
                                                            onClick={() =>
                                                                onSessionChange?.(
                                                                    session.id,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
                                                                <MessageSquare className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-sidebar-foreground flex-shrink-0 mt-0.5" />
                                                                <div className="flex flex-col flex-1 min-w-0 gap-1">
                                                                    <span className="text-[10px] lg:text-[11px] text-sidebar-foreground font-medium truncate block leading-tight">
                                                                        {
                                                                            session.title
                                                                        }
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn(
                                                                                "text-[7px] lg:text-[8px] px-1 py-0",
                                                                                getProviderBadgeColor(
                                                                                    session.provider as Provider,
                                                                                ),
                                                                            )}
                                                                        >
                                                                            {getProviderDisplayName(
                                                                                session.provider,
                                                                            )}
                                                                        </Badge>
                                                                        <span className="flex items-center gap-0.5 text-[8px] lg:text-[9px] text-muted-foreground">
                                                                            <Clock className="w-2 h-2 lg:w-2.5 lg:h-2.5" />
                                                                            {formatTimestamp(
                                                                                session.timestamp,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[8px] lg:text-[9px] text-muted-foreground truncate">
                                                                        {
                                                                            session.modelId
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5 lg:h-6 lg:w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    >
                                                                        <MoreVertical className="h-3 w-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSession(
                                                                                session.id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) =>
                            setActiveTab(v as "models" | "settings")
                        }
                        className="flex-1 flex flex-col min-h-0"
                    >
                        <div className="p-2 sm:p-3 lg:p-4 border-b border-sidebar-border flex-shrink-0 space-y-2">
                            {/* Tabs */}
                            <TabsList className="grid w-full grid-cols-2 mb-2">
                                <TabsTrigger
                                    value="models"
                                    className="text-[10px] sm:text-xs gap-1 h-7 sm:h-8"
                                >
                                    <MessageSquare className="w-3 h-3" />
                                    <span className="hidden xs:inline">
                                        Models
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    className="text-[10px] sm:text-xs gap-1 h-7 sm:h-8"
                                >
                                    <DollarSign className="w-3 h-3" />
                                    <span className="hidden xs:inline">
                                        Pricing
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            {activeTab === "models" && (
                                <>
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs sm:text-sm font-medium text-sidebar-foreground flex items-center gap-1.5">
                                            <span className="hidden sm:inline">
                                                All AI Models
                                            </span>
                                            <span className="sm:hidden">
                                                Models
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0"
                                            >
                                                {filteredModels.length}
                                            </Badge>
                                        </h2>
                                        <div className="flex gap-1 sm:gap-2">
                                            {onOpenAgentMode && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={onOpenAgentMode}
                                                    className="h-7 text-[10px] lg:text-xs gap-1"
                                                >
                                                    <Zap className="w-3 h-3" />
                                                    <span className="hidden sm:inline">
                                                        Agent
                                                    </span>
                                                </Button>
                                            )}
                                            {onOpenASSDebateMode && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={
                                                        onOpenASSDebateMode
                                                    }
                                                    className="h-7 text-[10px] lg:text-xs gap-1"
                                                >
                                                    <Users className="w-3 h-3" />
                                                    <span className="hidden sm:inline">
                                                        Debate
                                                    </span>
                                                </Button>
                                            )}
                                            {onOpenAgentCouncilMode && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={
                                                        onOpenAgentCouncilMode
                                                    }
                                                    className="h-7 text-[10px] lg:text-xs gap-1"
                                                >
                                                    <Trophy className="w-3 h-3" />
                                                    <span className="hidden sm:inline">
                                                        Council
                                                    </span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search models..."
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="h-9 sm:h-8 pl-8 sm:pl-8 text-xs sm:text-xs bg-sidebar-accent/50 border-sidebar-border"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() =>
                                                    setSearchQuery("")
                                                }
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Filter Buttons */}
                                    <div className="flex items-center gap-1.5">
                                        <Filter className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                                        <div className="flex gap-1.5 flex-1">
                                            <Button
                                                variant={
                                                    modelFilter === "all"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setModelFilter("all")
                                                }
                                                className="h-8 text-[10px] sm:text-[10px] px-3 sm:px-3 flex-1"
                                            >
                                                All
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-1 text-[9px] px-1 py-0"
                                                >
                                                    {allModels.length}
                                                </Badge>
                                            </Button>
                                            <Button
                                                variant={
                                                    modelFilter === "free"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setModelFilter("free")
                                                }
                                                className="h-8 text-[10px] sm:text-[10px] px-3 sm:px-3 flex-1"
                                            >
                                                🆓 Free
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-1 text-[9px] px-1 py-0"
                                                >
                                                    {freeModelsCount}
                                                </Badge>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Info Text */}
                                    <div className="text-[9px] sm:text-[9px] text-muted-foreground">
                                        {availableProviders.length} providers •{" "}
                                        {filteredModels.length} models
                                    </div>

                                    {/* Price Filter (for Together AI) */}
                                    {togetherModels.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-purple-400 flex-shrink-0" />
                                            <div className="flex gap-1.5 flex-1 overflow-x-auto">
                                                <Button
                                                    variant={
                                                        priceFilter === "all"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setPriceFilter("all")
                                                    }
                                                    className="h-8 text-[10px] sm:text-[10px] px-3 flex-shrink-0"
                                                >
                                                    All
                                                </Button>
                                                <Button
                                                    variant={
                                                        priceFilter === "free"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setPriceFilter("free")
                                                    }
                                                    className="h-8 text-[10px] sm:text-[10px] px-3 flex-shrink-0"
                                                >
                                                    🆓
                                                </Button>
                                                <Button
                                                    variant={
                                                        priceFilter ===
                                                        "cheapest"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setPriceFilter(
                                                            "cheapest",
                                                        )
                                                    }
                                                    className="h-8 text-[10px] sm:text-[10px] px-3 flex-shrink-0"
                                                >
                                                    <TrendingDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={
                                                        priceFilter ===
                                                        "expensive"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setPriceFilter(
                                                            "expensive",
                                                        )
                                                    }
                                                    className="h-8 text-[10px] sm:text-[10px] px-3 flex-shrink-0"
                                                >
                                                    <TrendingUp className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <TabsContent
                            value="models"
                            className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0 overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-3 lg:px-4 py-2 pb-4">
                                {filteredModels.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            No models found
                                        </p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                            Try a different search or filter
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {poeModels.length > 0 &&
                                            renderProviderSection(
                                                "poe",
                                                poeModels,
                                                "Poe AI",
                                            )}
                                        {togetherModels.length > 0 &&
                                            renderProviderSection(
                                                "together",
                                                togetherModels,
                                                "Together AI",
                                            )}
                                        {groqModels.length > 0 &&
                                            renderProviderSection(
                                                "groq",
                                                groqModels,
                                                "Groq",
                                            )}
                                        {openrouterModels.length > 0 &&
                                            renderProviderSection(
                                                "openrouter",
                                                openrouterModels,
                                                "OpenRouter (Free)",
                                            )}
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="settings"
                            className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0 overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-3 lg:px-4 py-2 pb-4">
                                <div className="space-y-4">
                                    <GeneralSettings />
                                    <GroqModelManager />
                                    <TogetherModelManager />
                                    <OpenRouterModelManager />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <AlertDialog
                open={showDeleteAllDialog}
                onOpenChange={setShowDeleteAllDialog}
            >
                <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete All Sessions?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all {sessions.length}{" "}
                            session(s) and their messages. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="m-0">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAllSessions}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 m-0"
                        >
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
