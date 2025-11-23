import { useState } from "react";
import { useGroqModels, formatCreatedDate } from "@/hooks/useGroqModels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Zap,
    Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GroqModelManager() {
    const { models, isLoading, error, lastUpdated, refreshModels, totalCount } =
        useGroqModels();

    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshModels();
            toast({
                title: "✅ Models Updated",
                description: `Found ${totalCount} chat models (all free!)`,
            });
        } catch (err) {
            toast({
                title: "❌ Update Failed",
                description:
                    err instanceof Error
                        ? err.message
                        : "Failed to update models",
                variant: "destructive",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatLastUpdated = (date: Date | null) => {
        if (!date) return "Never";
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) return `${hours}h ${minutes}m ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return "Just now";
    };

    return (
        <div className="w-full space-y-3">
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2">
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-yellow-400 flex items-center gap-2">
                            Groq Models
                            <Badge
                                variant="outline"
                                className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            >
                                {totalCount}
                            </Badge>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            All chat models • Lightning fast • Auto-updated
                            every 24h
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="w-full sm:w-auto border-yellow-500/30 hover:bg-yellow-500/10 text-xs sm:text-sm"
                >
                    {isLoading || isRefreshing ? (
                        <>
                            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            <span className="hidden sm:inline">
                                Updating...
                            </span>
                            <span className="sm:hidden">...</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Refresh
                        </>
                    )}
                </Button>
            </div>

            {/* Status Bar - Compact */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2">
                    {error ? (
                        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 flex-shrink-0" />
                    ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm text-slate-300">
                        {error
                            ? "Error loading"
                            : `${totalCount} chat models available`}
                    </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500">
                    {formatLastUpdated(lastUpdated)}
                </span>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-xs sm:text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Models Grid - Mobile Optimized */}
            <div className="h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] rounded-lg border border-slate-700 bg-slate-800/20 overflow-auto custom-scrollbar">
                <div className="p-2 sm:p-3 space-y-2">
                    {isLoading && models.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin mb-3 text-yellow-400" />
                            <p className="text-sm">Loading models...</p>
                        </div>
                    ) : models.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Sparkles className="h-8 w-8 mb-3 opacity-50" />
                            <p className="text-sm">No models found</p>
                            <p className="text-xs mt-1">
                                Click refresh to update
                            </p>
                        </div>
                    ) : (
                        models.map((model) => (
                            <div
                                key={model.id}
                                className="p-2.5 sm:p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-yellow-500/40 transition-all"
                            >
                                {/* Model Header */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <h4 className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                                                {model.id}
                                            </h4>
                                            <Badge
                                                variant="outline"
                                                className="text-[9px] sm:text-xs px-1 py-0 bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0"
                                            >
                                                FREE
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-500">
                                            {model.owned_by}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex-shrink-0"
                                    >
                                        ⚡ Fast
                                    </Badge>
                                </div>

                                {/* Model Info */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] sm:text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border-green-500/30"
                                    >
                                        💚 Groq Free Tier
                                    </Badge>
                                    {model.created > 0 && (
                                        <Badge
                                            variant="outline"
                                            className="text-[9px] sm:text-xs px-2 py-0.5 bg-slate-800 text-slate-400 border-slate-600"
                                        >
                                            📅{" "}
                                            {formatCreatedDate(model.created)}
                                        </Badge>
                                    )}
                                </div>

                                {/* Model Features */}
                                <div className="pt-2 border-t border-slate-700/50">
                                    <div className="flex flex-wrap gap-1.5 text-[9px] sm:text-xs text-slate-400">
                                        <span>✨ Lightning fast inference</span>
                                        <span>•</span>
                                        <span>🚀 Low latency</span>
                                        <span>•</span>
                                        <span>🆓 Free tier</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Info Tips - Mobile Optimized */}
            <div className="space-y-2">
                <div className="p-2.5 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-[10px] sm:text-xs text-blue-300 leading-relaxed">
                        💡{" "}
                        <strong className="font-semibold">All Models:</strong>{" "}
                        Showing ALL chat models from Groq API (includes Llama,
                        Mixtral, Gemma, Qwen, DeepSeek, and more).
                        <span className="hidden sm:inline">
                            {" "}
                            Non-chat models (embedding, audio, vision) are
                            automatically filtered out.
                        </span>
                    </p>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-[10px] sm:text-xs text-yellow-300 leading-relaxed">
                        ⚡ <strong className="font-semibold">Fast:</strong>{" "}
                        Groq's LPU™ inference engine delivers{" "}
                        <span className="hidden sm:inline">incredibly </span>
                        low latency responses.
                        <span className="hidden sm:inline">
                            {" "}
                            Up to 10x faster than traditional GPU inference!
                        </span>
                    </p>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-[10px] sm:text-xs text-green-300 leading-relaxed">
                        🎉{" "}
                        <strong className="font-semibold">
                            Complete List:
                        </strong>{" "}
                        Displaying all {totalCount} chat-capable models from
                        Groq.
                        <span className="hidden sm:inline">
                            {" "}
                            List auto-updates to include new models as they
                            become available!
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
