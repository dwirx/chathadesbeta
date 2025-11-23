import { useState } from "react";
import { useOpenRouterModels } from "@/hooks/useOpenRouterModels";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Download,
    Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function OpenRouterModelManager() {
    const { freeModels, isLoading, error, refreshModels, lastUpdated } =
        useOpenRouterModels();
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshModels();
            toast({
                title: "✅ Models Updated",
                description: `Found ${freeModels.length} free models`,
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

    const getModelSize = (id: string) => {
        if (id.includes("120b")) return "120B";
        if (id.includes("80b")) return "80B";
        if (id.includes("70b")) return "70B";
        if (id.includes("12b")) return "12B";
        if (id.includes("8b")) return "8B";
        if (id.includes("7b")) return "7B";
        if (id.includes("3b")) return "3B";
        if (id.includes("1b")) return "1B";
        return null;
    };

    return (
        <div className="w-full space-y-3">
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                        <Download className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-green-400 flex items-center gap-2">
                            Free Models
                            <Badge
                                variant="outline"
                                className="text-xs bg-green-500/20 text-green-300 border-green-500/30"
                            >
                                {freeModels.length}
                            </Badge>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Auto-updated every 24h
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="w-full sm:w-auto border-green-500/30 hover:bg-green-500/10 text-xs sm:text-sm"
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
                            : `${freeModels.length} models ready`}
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
                    {isLoading && freeModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin mb-3 text-green-400" />
                            <p className="text-sm">Loading free models...</p>
                        </div>
                    ) : freeModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Sparkles className="h-8 w-8 mb-3 opacity-50" />
                            <p className="text-sm">No free models found</p>
                            <p className="text-xs mt-1">
                                Click refresh to update
                            </p>
                        </div>
                    ) : (
                        freeModels.map((model) => {
                            const size = getModelSize(model.id);
                            return (
                                <div
                                    key={model.id}
                                    className="p-2.5 sm:p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-green-500/40 transition-all"
                                >
                                    {/* Model Header */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <h4 className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                                                    {model.name}
                                                </h4>
                                                {model.id.includes(":free") && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] sm:text-xs px-1 py-0 bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0"
                                                    >
                                                        FREE
                                                    </Badge>
                                                )}
                                            </div>
                                            {model.description && (
                                                <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                                    {model.description}
                                                </p>
                                            )}
                                        </div>
                                        {size && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0 bg-slate-800 text-slate-300 border-slate-600 flex-shrink-0"
                                            >
                                                {size}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Model Specs - Compact */}
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {model.context_length && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[9px] sm:text-xs px-1.5 py-0 bg-slate-800/80 text-slate-400 border-slate-600"
                                            >
                                                {model.context_length >= 1000000
                                                    ? `${(model.context_length / 1000000).toFixed(1)}M ctx`
                                                    : model.context_length >=
                                                        1000
                                                      ? `${(model.context_length / 1000).toFixed(0)}K ctx`
                                                      : `${model.context_length} ctx`}
                                            </Badge>
                                        )}
                                        {model.architecture.input_modalities &&
                                            model.architecture.input_modalities
                                                .length > 0 && (
                                                <>
                                                    {model.architecture.input_modalities
                                                        .slice(0, 2)
                                                        .map((modality) => (
                                                            <Badge
                                                                key={modality}
                                                                variant="secondary"
                                                                className="text-[9px] sm:text-xs px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30"
                                                            >
                                                                {modality}
                                                            </Badge>
                                                        ))}
                                                    {model.architecture
                                                        .input_modalities
                                                        .length > 2 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[9px] px-1.5 py-0 bg-slate-800 text-slate-500"
                                                        >
                                                            +
                                                            {model.architecture
                                                                .input_modalities
                                                                .length - 2}
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                    </div>

                                    {/* Model ID - Collapsible on mobile */}
                                    <div className="pt-2 border-t border-slate-700/50">
                                        <code className="text-[9px] sm:text-xs text-slate-500 break-all block">
                                            {model.id}
                                        </code>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Info Tip - Mobile Optimized */}
            <div className="p-2.5 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-[10px] sm:text-xs text-blue-300 leading-relaxed">
                    💡 <strong className="font-semibold">Tip:</strong> Models
                    auto-update every 24h.
                    <span className="hidden sm:inline">
                        {" "}
                        Use them in chat by selecting "OpenRouter (Free)" in the
                        sidebar.
                    </span>
                    <span className="sm:hidden"> Available in sidebar.</span>
                </p>
            </div>
        </div>
    );
}
