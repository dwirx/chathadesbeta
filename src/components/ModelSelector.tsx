import { useState } from "react";
import { Bot, Zap, Gauge, Brain, Sparkles, Flame, Wind } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiApi, ModelInfo, Provider } from "@/lib/aiApi";

interface ModelSelectorProps {
    onSelectModel: (provider: Provider, modelId: string) => void;
    trigger?: React.ReactNode;
    inline?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
    Bot: <Bot className="w-5 h-5" />,
    Zap: <Zap className="w-5 h-5" />,
    Brain: <Brain className="w-5 h-5" />,
    Sparkles: <Sparkles className="w-5 h-5" />,
    Flame: <Flame className="w-5 h-5" />,
    Wind: <Wind className="w-5 h-5" />,
};

export const ModelSelector = ({
    onSelectModel,
    trigger,
    inline = false,
}: ModelSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
        null,
    );

    const allModels = aiApi.getAllModels();
    const availableProviders = aiApi.getAvailableProviders();
    const poeModels = aiApi.getModelsByProvider("poe");
    const togetherModels = aiApi.getModelsByProvider("together");

    const handleSelectModel = (provider: Provider, modelId: string) => {
        setSelectedModel(`${provider}:${modelId}`);
        setSelectedProvider(provider);
    };

    const handleConfirm = () => {
        if (selectedModel && selectedProvider) {
            const modelId = selectedModel.split(":")[1];
            onSelectModel(selectedProvider, modelId);
            setOpen(false);
            setSelectedModel(null);
            setSelectedProvider(null);
        }
    };

    const renderModelCard = (info: ModelInfo) => {
        const key = `${info.provider}:${info.id}`;
        const isSelected = selectedModel === key;

        return (
            <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:ring-1 hover:ring-muted-foreground/20"
                }`}
                onClick={() => handleSelectModel(info.provider, info.id)}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div
                            className={`p-2 rounded-lg bg-gradient-to-br ${info.color} text-white`}
                        >
                            {iconMap[info.icon] || <Bot className="w-5 h-5" />}
                        </div>
                        {isSelected && (
                            <Badge variant="default" className="ml-2">
                                Selected
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-lg mt-3">{info.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                        {info.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* Performance indicators */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    Speed:
                                </span>
                            </div>
                            <Badge
                                variant={
                                    info.speed === "Fast"
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {info.speed}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    Quality:
                                </span>
                            </div>
                            <Badge
                                variant={
                                    info.quality === "High"
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {info.quality}
                            </Badge>
                        </div>

                        {/* Features */}
                        <div className="pt-2 border-t">
                            <p className="text-xs font-medium mb-2 text-muted-foreground">
                                Features:
                            </p>
                            <ul className="space-y-1">
                                {info.features.map((feature, idx) => (
                                    <li
                                        key={idx}
                                        className="text-xs flex items-center gap-2"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Provider badge */}
                        <div className="pt-2">
                            <Badge variant="outline" className="text-xs">
                                {info.provider === "poe"
                                    ? "Poe"
                                    : "Together AI"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const modelCards = (
        <Tabs defaultValue={availableProviders[0] || "poe"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                {availableProviders.includes("poe") && (
                    <TabsTrigger value="poe">
                        Poe ({poeModels.length})
                    </TabsTrigger>
                )}
                {availableProviders.includes("together") && (
                    <TabsTrigger value="together">
                        Together AI ({togetherModels.length})
                    </TabsTrigger>
                )}
            </TabsList>

            {availableProviders.includes("poe") && (
                <TabsContent value="poe">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {poeModels.map(renderModelCard)}
                    </div>
                </TabsContent>
            )}

            {availableProviders.includes("together") && (
                <TabsContent value="together">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {togetherModels.map(renderModelCard)}
                    </div>
                </TabsContent>
            )}
        </Tabs>
    );

    if (inline) {
        return (
            <div>
                {modelCards}
                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedModel}
                        className="min-w-24"
                    >
                        Start Chat
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="default" className="w-full">
                        New Chat
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Select AI Model
                    </DialogTitle>
                    <DialogDescription>
                        Choose the model that best fits your needs.{" "}
                        {availableProviders.length === 2
                            ? "All providers configured!"
                            : ""}
                    </DialogDescription>
                </DialogHeader>

                {modelCards}

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setOpen(false);
                            setSelectedModel(null);
                            setSelectedProvider(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedModel}
                        className="min-w-24"
                    >
                        Start Chat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
