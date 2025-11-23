import { useState, useEffect, useCallback } from "react";

const GROQ_CACHE_KEY = "groq_chat_models_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface GroqModel {
    id: string;
    object: string;
    created: number;
    owned_by: string;
    isFree: boolean;
}

interface CachedData {
    models: GroqModel[];
    timestamp: number;
}

const isChatModel = (modelId: string): boolean => {
    const lowerModelId = modelId.toLowerCase();

    // Exclude non-chat models (embedding, audio, vision, etc)
    const excludeKeywords = [
        "embedding",
        "embed",
        "audio",
        "image",
        "vision",
        "whisper",
        "tts",
        "speech",
        "moderation",
        "file",
        "distil-whisper",
    ];

    // Exclude if contains non-chat keywords
    if (excludeKeywords.some((keyword) => lowerModelId.includes(keyword))) {
        return false;
    }

    // Include ALL other models (assume they are chat models)
    // Groq API returns models with object: "model" which are typically chat models
    return true;
};

const fetchGroqModels = async (): Promise<GroqModel[]> => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        console.warn("⚠️ VITE_GROQ_API_KEY not found in environment");
        return [];
    }

    try {
        console.log("🔄 Fetching Groq chat models...");

        const response = await fetch("https://api.groq.com/openai/v1/models", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(
                `Groq API error: ${response.status} ${response.statusText}`,
            );
        }

        const data = await response.json();

        // Handle error response
        if (data.error) {
            throw new Error(
                `Groq API error: ${data.error.message} (${data.error.type})`,
            );
        }

        const allModels = data.data || [];

        // Filter only chat models
        const chatModels = allModels.filter(
            (model: any) => model.object === "model" && isChatModel(model.id),
        );

        // Map to our format
        const formattedModels: GroqModel[] = chatModels.map((model: any) => ({
            id: model.id,
            object: model.object,
            created: model.created || 0,
            owned_by: model.owned_by || "Groq",
            isFree: true, // Groq free tier (all models free in free tier)
        }));

        console.log(
            `✅ Fetched ${formattedModels.length} Groq chat models (ALL available models)`,
        );
        console.log(
            `   📋 Includes: Llama, Mixtral, Gemma, Qwen, DeepSeek, and more`,
        );
        console.log(
            `   🚫 Filtered out: embedding, audio, vision, whisper models`,
        );

        return formattedModels;
    } catch (error) {
        console.error("❌ Error fetching Groq models:", error);
        return [];
    }
};

const loadFromCache = (): GroqModel[] | null => {
    try {
        const cached = localStorage.getItem(GROQ_CACHE_KEY);
        if (!cached) return null;

        const data: CachedData = JSON.parse(cached);
        const now = Date.now();
        const age = now - data.timestamp;

        if (age > CACHE_DURATION) {
            console.log(
                `⏰ Groq cache expired (${Math.round(age / 1000 / 60 / 60)}h old)`,
            );
            return null;
        }

        console.log(
            `✅ Loaded ${data.models.length} Groq models from cache (${Math.round(age / 1000 / 60)}min old)`,
        );
        return data.models;
    } catch (error) {
        console.error("❌ Error loading Groq cache:", error);
        return null;
    }
};

const saveToCache = (models: GroqModel[]): void => {
    try {
        const data: CachedData = {
            models,
            timestamp: Date.now(),
        };
        localStorage.setItem(GROQ_CACHE_KEY, JSON.stringify(data));
        console.log(`💾 Cached ${models.length} Groq models`);
    } catch (error) {
        console.error("❌ Error saving Groq cache:", error);
    }
};

export const useGroqModels = () => {
    const [models, setModels] = useState<GroqModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const loadModels = useCallback(async (forceRefresh = false) => {
        setIsLoading(true);
        setError(null);

        try {
            // Try cache first
            if (!forceRefresh) {
                const cached = loadFromCache();
                if (cached && cached.length > 0) {
                    setModels(cached);
                    const cacheData = localStorage.getItem(GROQ_CACHE_KEY);
                    if (cacheData) {
                        const data: CachedData = JSON.parse(cacheData);
                        setLastUpdated(new Date(data.timestamp));
                    }
                    setIsLoading(false);
                    return;
                }
            }

            // Fetch fresh data
            const freshModels = await fetchGroqModels();
            if (freshModels.length > 0) {
                setModels(freshModels);
                saveToCache(freshModels);
                setLastUpdated(new Date());
            } else {
                setError("No models found");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load models";
            setError(errorMessage);
            console.error("Error in loadModels:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshModels = useCallback(async () => {
        await loadModels(true);
    }, [loadModels]);

    // Load on mount
    useEffect(() => {
        loadModels(false);
    }, [loadModels]);

    // All Groq models are free in free tier
    const freeModels = models;
    const paidModels: GroqModel[] = [];

    return {
        models,
        freeModels,
        paidModels,
        isLoading,
        error,
        lastUpdated,
        refreshModels,
        totalCount: models.length,
        freeCount: freeModels.length,
        paidCount: paidModels.length,
    };
};

// Utility function to format created date
export const formatCreatedDate = (timestamp: number): string => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString();
};

// Utility function to get model display name
export const getModelDisplayName = (modelId: string): string => {
    // Clean up model ID for display
    return (
        modelId
            .split("/")
            .pop()
            ?.replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()) || modelId
    );
};
