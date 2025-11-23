import { useState, useEffect, useCallback } from "react";
import { openrouterApi } from "@/lib/openrouterApi";

export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    context_length: number | null;
    architecture: {
        modality: string | null;
        input_modalities: string[];
        output_modalities: string[];
    };
}

export interface UseOpenRouterModelsReturn {
    models: OpenRouterModel[];
    freeModels: OpenRouterModel[];
    isLoading: boolean;
    error: string | null;
    refreshModels: () => Promise<void>;
    lastUpdated: Date | null;
}

const CACHE_KEY = "openrouter_free_models_cache";
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CachedData {
    models: OpenRouterModel[];
    timestamp: number;
}

export function useOpenRouterModels(): UseOpenRouterModelsReturn {
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [freeModels, setFreeModels] = useState<OpenRouterModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Load from cache
    const loadFromCache = useCallback((): boolean => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return false;

            const data: CachedData = JSON.parse(cached);
            const age = Date.now() - data.timestamp;

            if (age < CACHE_DURATION) {
                setFreeModels(data.models);
                setLastUpdated(new Date(data.timestamp));
                return true;
            }
        } catch (err) {
            console.error("Error loading from cache:", err);
        }
        return false;
    }, []);

    // Save to cache
    const saveToCache = useCallback((models: OpenRouterModel[]) => {
        try {
            const data: CachedData = {
                models,
                timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (err) {
            console.error("Error saving to cache:", err);
        }
    }, []);

    // Filter free models - ONLY free models with :free tag or zero pricing
    const filterFreeModels = useCallback(
        (allModels: OpenRouterModel[]): OpenRouterModel[] => {
            const filtered = allModels.filter((model) => {
                // Primary check: :free tag
                const isFreeTag = model.id.includes(":free");

                // Secondary check: zero pricing for both prompt and completion
                const hasZeroPricing =
                    parseFloat(model.pricing?.prompt || "1") === 0 &&
                    parseFloat(model.pricing?.completion || "1") === 0;

                // Must be either tagged as free OR have zero pricing
                return isFreeTag || hasZeroPricing;
            });

            // Log filtered results for debugging
            console.log(
                `✅ Filtered ${filtered.length} FREE models from ${allModels.length} total models`,
            );

            return filtered;
        },
        [],
    );

    // Fetch models from API
    const refreshModels = useCallback(async () => {
        if (!openrouterApi.isConfigured()) {
            setError("OpenRouter API key not configured");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("🔄 Fetching OpenRouter models...");
            const allModels = await openrouterApi.getAvailableModels();
            console.log(`📊 Total models from API: ${allModels.length}`);

            setModels(allModels);

            // Filter to get ONLY free models
            const free = filterFreeModels(allModels);
            setFreeModels(free);
            setLastUpdated(new Date());

            // Save ONLY free models to cache
            saveToCache(free);

            console.log(`✅ Found and cached ${free.length} FREE models`);
            console.log(
                `📝 Free models:`,
                free.map((m) => m.id).slice(0, 5),
                "...",
            );
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to fetch models";
            setError(errorMessage);
            console.error("❌ Error fetching models:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filterFreeModels, saveToCache]);

    // Auto-load on mount - fetch FREE models only
    useEffect(() => {
        if (!openrouterApi.isConfigured()) {
            console.log("⚠️ OpenRouter not configured, skipping model fetch");
            return;
        }

        console.log("🚀 Initializing OpenRouter free models...");

        // Try to load from cache first
        const loaded = loadFromCache();

        if (loaded) {
            console.log("💾 Using cached free models");
        } else {
            console.log(
                "🔄 Cache empty/expired, fetching fresh free models...",
            );
            refreshModels();
        }
    }, [loadFromCache, refreshModels]);

    return {
        models,
        freeModels,
        isLoading,
        error,
        refreshModels,
        lastUpdated,
    };
}
