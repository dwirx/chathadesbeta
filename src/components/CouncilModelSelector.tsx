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
import { cn } from "@/lib/utils";

interface ModelOption {
    id: string;
    name?: string;
    display_name?: string;
}

interface CouncilModelSelectorProps {
    provider: "groq" | "together" | "openrouter";
    modelId: string;
    modelOptions: Record<string, ModelOption[]>;
    onProviderChange: (provider: "groq" | "together" | "openrouter") => void;
    onModelChange: (modelId: string) => void;
    className?: string;
    availableProviders: {
        groq: boolean;
        together: boolean;
        openrouter: boolean;
    };
}

export function CouncilModelSelector({
    provider,
    modelId,
    modelOptions,
    onProviderChange,
    onModelChange,
    className,
    availableProviders,
}: CouncilModelSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Get current provider models
    const currentModels = modelOptions[provider] || [];

    // Filter models based on search
    const filteredModels = useMemo(() => {
        if (!searchQuery.trim()) return currentModels;

        const query = searchQuery.toLowerCase();
        return currentModels.filter((model) => {
            const name = model.display_name || model.name || model.id;
            return (
                model.id.toLowerCase().includes(query) ||
                name.toLowerCase().includes(query)
            );
        });
    }, [currentModels, searchQuery]);

    const handleProviderChange = (
        newProvider: "groq" | "together" | "openrouter",
    ) => {
        setSearchQuery("");
        onProviderChange(newProvider);
    };

    const handleModelSelect = (newModelId: string) => {
        onModelChange(newModelId);
        setSearchQuery("");
    };

    const getProviderColor = (prov: string) => {
        const colors = {
            groq: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
            together: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
            openrouter: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        };
        return colors[prov as keyof typeof colors] || colors.groq;
    };

    const getProviderLabel = (prov: string) => {
        const labels = {
            groq: "GROQ",
            together: "TOGETHER",
            openrouter: "OPENROUTER",
        };
        return labels[prov as keyof typeof labels] || prov.toUpperCase();
    };

    const getProviderDescription = (prov: string) => {
        const descriptions = {
            groq: "Fast & Free",
            together: "Powerful",
            openrouter: "Free Models",
        };
        return descriptions[prov as keyof typeof descriptions] || "";
    };

    const getModelDisplayName = (model: ModelOption) => {
        return model.display_name || model.name || model.id;
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Provider Selection */}
            <div className="space-y-2">
                <Label className="text-xs font-medium">Provider</Label>
                <Select value={provider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {availableProviders.groq && (
                            <SelectItem value="groq">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] px-1.5 py-0",
                                            getProviderColor("groq"),
                                        )}
                                    >
                                        GROQ
                                    </Badge>
                                    <span className="text-xs">
                                        Fast & Free
                                    </span>
                                </div>
                            </SelectItem>
                        )}
                        {availableProviders.together && (
                            <SelectItem value="together">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] px-1.5 py-0",
                                            getProviderColor("together"),
                                        )}
                                    >
                                        TOGETHER
                                    </Badge>
                                    <span className="text-xs">
                                        Powerful Models
                                    </span>
                                </div>
                            </SelectItem>
                        )}
                        {availableProviders.openrouter && (
                            <SelectItem value="openrouter">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] px-1.5 py-0",
                                            getProviderColor("openrouter"),
                                        )}
                                    >
                                        OPENROUTER
                                    </Badge>
                                    <span className="text-xs">Free Models</span>
                                </div>
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Model Search & Selection */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Model</Label>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {filteredModels.length} available
                    </Badge>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-8 h-8 text-xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>

                {/* Model List */}
                <ScrollArea className="h-[180px] rounded-md border bg-muted/30">
                    {filteredModels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <Search className="h-6 w-6 text-muted-foreground mb-2 opacity-50" />
                            <p className="text-xs text-muted-foreground">
                                No models found
                            </p>
                            {searchQuery && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Try a different search
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="p-1.5 space-y-0.5">
                            {filteredModels.map((model) => {
                                const isSelected = model.id === modelId;
                                const displayName = getModelDisplayName(model);
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() =>
                                            handleModelSelect(model.id)
                                        }
                                        className={cn(
                                            "w-full text-left p-2 rounded transition-colors",
                                            "hover:bg-accent border",
                                            isSelected
                                                ? "bg-primary/10 border-primary/30"
                                                : "border-transparent hover:border-muted",
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-xs truncate">
                                                    {displayName}
                                                </div>
                                                {displayName !== model.id && (
                                                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                        {model.id}
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex-shrink-0">
                                                    ✓
                                                </div>
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
                <div className="p-2.5 rounded-md bg-muted/50 border">
                    <div className="flex items-start gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[8px] px-1.5 py-0.5 flex-shrink-0",
                                getProviderColor(provider),
                            )}
                        >
                            {getProviderLabel(provider)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                                {getModelDisplayName(
                                    currentModels.find((m) => m.id === modelId) ||
                                        { id: modelId },
                                )}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                                {modelId}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

