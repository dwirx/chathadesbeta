import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Provider } from "@/lib/aiApi";
import { cn } from "@/lib/utils";

interface ModelOption {
    id: string;
    name: string;
}

interface DebateModelSelectorProps {
    provider: Provider;
    modelId: string;
    modelOptions: Record<Provider, ModelOption[]>;
    onProviderChange: (provider: Provider) => void;
    onModelChange: (modelId: string) => void;
    className?: string;
    compact?: boolean;
}

export function DebateModelSelector({
    provider,
    modelId,
    modelOptions,
    onProviderChange,
    onModelChange,
    className,
    compact = false,
}: DebateModelSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Get current provider models
    const currentModels = modelOptions[provider] || [];

    // Filter models based on search
    const filteredModels = useMemo(() => {
        if (!searchQuery.trim()) return currentModels;

        const query = searchQuery.toLowerCase();
        return currentModels.filter(
            (model) =>
                model.id.toLowerCase().includes(query) ||
                model.name.toLowerCase().includes(query),
        );
    }, [currentModels, searchQuery]);

    const handleProviderChange = (newProvider: Provider) => {
        setSearchQuery("");
        setIsSearchOpen(false);
        onProviderChange(newProvider);
    };

    const handleModelSelect = (newModelId: string) => {
        onModelChange(newModelId);
        setSearchQuery("");
        setIsSearchOpen(false);
    };

    const getProviderColor = (prov: Provider) => {
        const colors = {
            poe: "bg-blue-500/20 text-blue-300 border-blue-500/30",
            groq: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
            together: "bg-purple-500/20 text-purple-300 border-purple-500/30",
            openrouter: "bg-green-500/20 text-green-300 border-green-500/30",
        };
        return colors[prov];
    };

    const getProviderLabel = (prov: Provider) => {
        const labels = {
            poe: "POE (Multi-Model)",
            groq: "GROQ (Fast)",
            together: "Together AI (Powerful)",
            openrouter: "OpenRouter (Free)",
        };
        return labels[prov];
    };

    if (compact) {
        return (
            <div className={cn("space-y-2", className)}>
                {/* Provider Selection */}
                <div className="space-y-1">
                    <Label className="text-[10px] sm:text-xs">Provider</Label>
                    <Select
                        value={provider}
                        onValueChange={handleProviderChange}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="poe">
                                POE (Multi-Model)
                            </SelectItem>
                            <SelectItem value="groq">GROQ (Fast)</SelectItem>
                            <SelectItem value="together">
                                Together AI (Powerful)
                            </SelectItem>
                            <SelectItem value="openrouter">
                                OpenRouter (Free)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Model Selection with Search */}
                <div className="space-y-1">
                    <Label className="text-[10px] sm:text-xs">Model</Label>
                    <Select value={modelId} onValueChange={handleModelSelect}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <div className="p-2 border-b">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input
                                        placeholder="Search models..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="h-7 pl-7 pr-7 text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSearchQuery("");
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-1.5">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] px-1.5 py-0",
                                            getProviderColor(provider),
                                        )}
                                    >
                                        {provider.toUpperCase()}
                                    </Badge>
                                    <span className="text-[9px] text-muted-foreground">
                                        {filteredModels.length} models
                                    </span>
                                </div>
                            </div>
                            <ScrollArea className="h-[200px]">
                                {filteredModels.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                        No models found
                                    </div>
                                ) : (
                                    filteredModels.map((model) => (
                                        <SelectItem
                                            key={model.id}
                                            value={model.id}
                                            className="text-xs"
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">
                                                    {model.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                                                    {model.id}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                </div>

                {/* Model Info */}
                <div className="text-[9px] text-muted-foreground flex items-center gap-1 flex-wrap">
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[8px] px-1 py-0",
                            getProviderColor(provider),
                        )}
                    >
                        {provider.toUpperCase()}
                    </Badge>
                    <span className="truncate">
                        {modelId.split("/").pop() || modelId}
                    </span>
                </div>
            </div>
        );
    }

    // Full mode (non-compact)
    return (
        <div className={cn("space-y-3", className)}>
            {/* Provider Selection */}
            <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">
                    Provider
                </Label>
                <Select value={provider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="poe">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="text-[9px] bg-blue-500/20 text-blue-300 border-blue-500/30"
                                >
                                    POE
                                </Badge>
                                <span>Multi-Model</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="groq">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="text-[9px] bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                >
                                    GROQ
                                </Badge>
                                <span>Fast & Free</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="together">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="text-[9px] bg-purple-500/20 text-purple-300 border-purple-500/30"
                                >
                                    TOGETHER
                                </Badge>
                                <span>Powerful Models</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="openrouter">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="text-[9px] bg-green-500/20 text-green-300 border-green-500/30"
                                >
                                    OPENROUTER
                                </Badge>
                                <span>Free Models</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Model Search & Selection */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm font-medium">
                        Model
                    </Label>
                    <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0.5"
                    >
                        {filteredModels.length} available
                    </Badge>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search models by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9 h-10 sm:h-11"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>

                {/* Model List */}
                <ScrollArea className="h-[250px] sm:h-[300px] rounded-lg border bg-card">
                    {filteredModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <Search className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                                No models found
                            </p>
                            {searchQuery && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Try a different search term
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filteredModels.map((model) => {
                                const isSelected = model.id === modelId;
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() =>
                                            handleModelSelect(model.id)
                                        }
                                        className={cn(
                                            "w-full text-left p-2.5 sm:p-3 rounded-md transition-colors",
                                            "hover:bg-accent border",
                                            isSelected
                                                ? "bg-accent border-primary"
                                                : "border-transparent",
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-xs sm:text-sm truncate">
                                                    {model.name}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                                    {model.id}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Badge
                                                    variant="default"
                                                    className="text-[9px] px-1.5 py-0 flex-shrink-0"
                                                >
                                                    Selected
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Selected Model Info */}
            {modelId && (
                <div className="p-3 rounded-lg bg-accent/50 border">
                    <div className="flex items-start gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[9px] px-1.5 py-0.5 flex-shrink-0",
                                getProviderColor(provider),
                            )}
                        >
                            {provider.toUpperCase()}
                        </Badge>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium truncate">
                                {
                                    currentModels.find((m) => m.id === modelId)
                                        ?.name
                                }
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                {modelId}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
