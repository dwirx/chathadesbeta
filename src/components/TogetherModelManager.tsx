import { useState } from "react";
import { useTogetherModels, formatPrice } from "@/hooks/useTogetherModels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    DollarSign,
    Sparkles,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PriceFilter = "all" | "free" | "cheapest" | "expensive";

export function TogetherModelManager() {
    const {
        models,
        freeModels,
        paidModels,
        cheapestModel,
        mostExpensiveModel,
        isLoading,
        error,
        lastUpdated,
        refreshModels,
        totalCount,
        freeCount,
        paidCount,
    } = useTogetherModels();

    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshModels();
            toast({
                title: "✅ Models Updated",
                description: `Found ${totalCount} chat models (${freeCount} free, ${paidCount} paid)`,
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

    // Filter models based on price filter
    const filteredModels = (() => {
        switch (priceFilter) {
            case "free":
                return freeModels;
            case "cheapest":
                return paidModels.slice(0, 10); // Top 10 cheapest
            case "expensive":
                return paidModels.slice(-10).reverse(); // Top 10 most expensive
            default:
                return models;
        }
    })();

    const getContextLengthBadge = (length: number) => {
        if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
        if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
        return length.toString();
    };

    const getCostColor = (model: (typeof models)[0]) => {
        if (model.isFree) return "text-green-400";
        const totalCost = model.pricing.input + model.pricing.output;
        if (totalCost < 0.5) return "text-blue-400";
        if (totalCost < 2) return "text-yellow-400";
        return "text-orange-400";
    };

    return (
        <div className="w-full space-y-3">
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-purple-400 flex items-center gap-2">
                            Together AI Models
                            <Badge
                                variant="outline"
                                className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30"
                            >
                                {totalCount}
                            </Badge>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Serverless chat models • Auto-updated every 24h
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="w-full sm:w-auto border-purple-500/30 hover:bg-purple-500/10 text-xs sm:text-sm"
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
                            : `${totalCount} serverless models (${freeCount} free)`}
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

            {/* Price Filter Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                    variant={priceFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceFilter("all")}
                    className={cn(
                        "text-[10px] sm:text-xs h-8 sm:h-9",
                        priceFilter === "all"
                            ? "bg-purple-500 hover:bg-purple-600"
                            : "border-slate-600 hover:bg-slate-800",
                    )}
                >
                    <Sparkles className="mr-1 h-3 w-3" />
                    All
                    <Badge
                        variant="secondary"
                        className="ml-1 text-[9px] px-1 py-0"
                    >
                        {totalCount}
                    </Badge>
                </Button>
                <Button
                    variant={priceFilter === "free" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceFilter("free")}
                    className={cn(
                        "text-[10px] sm:text-xs h-8 sm:h-9",
                        priceFilter === "free"
                            ? "bg-green-500 hover:bg-green-600"
                            : "border-slate-600 hover:bg-slate-800",
                    )}
                >
                    🆓 Free
                    <Badge
                        variant="secondary"
                        className="ml-1 text-[9px] px-1 py-0"
                    >
                        {freeCount}
                    </Badge>
                </Button>
                <Button
                    variant={priceFilter === "cheapest" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceFilter("cheapest")}
                    className={cn(
                        "text-[10px] sm:text-xs h-8 sm:h-9",
                        priceFilter === "cheapest"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "border-slate-600 hover:bg-slate-800",
                    )}
                >
                    <TrendingDown className="mr-1 h-3 w-3" />
                    Cheapest
                    <Badge
                        variant="secondary"
                        className="ml-1 text-[9px] px-1 py-0"
                    >
                        10
                    </Badge>
                </Button>
                <Button
                    variant={
                        priceFilter === "expensive" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setPriceFilter("expensive")}
                    className={cn(
                        "text-[10px] sm:text-xs h-8 sm:h-9",
                        priceFilter === "expensive"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "border-slate-600 hover:bg-slate-800",
                    )}
                >
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Premium
                    <Badge
                        variant="secondary"
                        className="ml-1 text-[9px] px-1 py-0"
                    >
                        10
                    </Badge>
                </Button>
            </div>

            {/* Models Grid - Mobile Optimized */}
            <div className="h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] rounded-lg border border-slate-700 bg-slate-800/20 overflow-auto custom-scrollbar">
                <div className="p-2 sm:p-3 space-y-2">
                    {isLoading && models.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin mb-3 text-purple-400" />
                            <p className="text-sm">Loading models...</p>
                        </div>
                    ) : filteredModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Sparkles className="h-8 w-8 mb-3 opacity-50" />
                            <p className="text-sm">No models found</p>
                            <p className="text-xs mt-1">
                                Click refresh to update
                            </p>
                        </div>
                    ) : (
                        filteredModels.map((model) => (
                            <div
                                key={model.id}
                                className="p-2.5 sm:p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-purple-500/40 transition-all"
                            >
                                {/* Model Header */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <h4 className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                                                {model.display_name}
                                            </h4>
                                            {model.isFree && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[9px] sm:text-xs px-1 py-0 bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0"
                                                >
                                                    FREE
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                                            {model.organization}
                                        </p>
                                    </div>
                                    {model.context_length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0 bg-slate-800 text-slate-300 border-slate-600 flex-shrink-0"
                                        >
                                            {getContextLengthBadge(
                                                model.context_length,
                                            )}
                                        </Badge>
                                    )}
                                </div>

                                {/* Pricing Info */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {model.isFree ? (
                                        <Badge
                                            variant="outline"
                                            className="text-[9px] sm:text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border-green-500/30"
                                        >
                                            💚 Completely Free
                                        </Badge>
                                    ) : (
                                        <>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] sm:text-xs px-2 py-0.5",
                                                    getCostColor(model),
                                                )}
                                            >
                                                ⬆️{" "}
                                                {formatPrice(
                                                    model.pricing.input,
                                                )}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] sm:text-xs px-2 py-0.5",
                                                    getCostColor(model),
                                                )}
                                            >
                                                ⬇️{" "}
                                                {formatPrice(
                                                    model.pricing.output,
                                                )}
                                            </Badge>
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
                        ))
                    )}
                </div>
            </div>

            {/* Info Tips - Mobile Optimized */}
            <div className="space-y-2">
                <div className="p-2.5 sm:p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-[10px] sm:text-xs text-yellow-300 leading-relaxed">
                        🚀{" "}
                        <strong className="font-semibold">
                            Serverless Only:
                        </strong>{" "}
                        Only serverless models are shown.
                        <span className="hidden sm:inline">
                            {" "}
                            Models requiring dedicated endpoints (like
                            "-Reference" models) are filtered out to prevent
                            errors.
                        </span>
                    </p>
                </div>

                <div className="p-2.5 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-[10px] sm:text-xs text-blue-300 leading-relaxed">
                        💡 <strong className="font-semibold">Tip:</strong>{" "}
                        Prices shown are per 1M tokens.
                        <span className="hidden sm:inline">
                            {" "}
                            Input = prompt tokens, Output = completion tokens.
                        </span>
                    </p>
                </div>

                {cheapestModel && (
                    <div className="p-2.5 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-[10px] sm:text-xs text-green-300 leading-relaxed">
                            🏆{" "}
                            <strong className="font-semibold">Cheapest:</strong>{" "}
                            {cheapestModel.display_name} (
                            {formatPrice(cheapestModel.pricing.input)} input,{" "}
                            {formatPrice(cheapestModel.pricing.output)} output)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
