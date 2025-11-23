// Unified AI API service - supports multiple providers (Poe, Together, Groq, OpenRouter)

import { poeApi, PoeMessage } from "./poeApi";
import { togetherApi, TogetherMessage } from "./togetherApi";
import { groqApi, GroqMessage } from "./groqApi";
import { openrouterApi, OpenRouterMessage } from "./openrouterApi";

export type Provider = "poe" | "together" | "groq" | "openrouter";

const OPENROUTER_CACHE_KEY = "openrouter_free_models_cache";
const TOGETHER_CACHE_KEY = "together_chat_models_cache";
const GROQ_CACHE_KEY = "groq_chat_models_cache";

export interface UnifiedMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface UnifiedRequestOptions {
    provider: Provider;
    model: string;
    messages: UnifiedMessage[];
    temperature?: number;
    max_tokens?: number;
}

export interface ModelInfo {
    id: string;
    name: string;
    provider: Provider;
    description: string;
    speed: "Fast" | "Balanced" | "Slow";
    quality: "High" | "Medium" | "Low";
    features: string[];
    icon: string;
    color: string;
}

// All available models across providers
export const ALL_MODELS: Record<string, ModelInfo> = {
    // Poe Models
    "poe:GPT-5-mini": {
        id: "GPT-5-mini",
        name: "GPT-5-mini",
        provider: "poe",
        description:
            "Balanced performance with high-quality responses. Perfect for most tasks.",
        speed: "Balanced",
        quality: "High",
        features: [
            "Advanced reasoning",
            "Long context",
            "Code generation",
            "Multi-language",
            "Complex tasks",
        ],
        icon: "Bot",
        color: "from-blue-500 to-purple-500",
    },
    "poe:GPT-5-nano": {
        id: "GPT-5-nano",
        name: "GPT-5-nano",
        provider: "poe",
        description:
            "Ultra-fast responses for quick queries. Optimized for speed.",
        speed: "Fast",
        quality: "Medium",
        features: [
            "Lightning fast",
            "Low latency",
            "Quick answers",
            "Simple tasks",
            "Chat optimized",
        ],
        icon: "Zap",
        color: "from-green-500 to-teal-500",
    },
    // Together AI Models
    "together:openai/gpt-oss-20b": {
        id: "openai/gpt-oss-20b",
        name: "GPT-OSS-20B",
        provider: "together",
        description:
            "Open source GPT model with 20B parameters. Great for general tasks.",
        speed: "Balanced",
        quality: "High",
        features: [
            "Open source",
            "20B parameters",
            "General purpose",
            "Code capable",
            "Fast inference",
        ],
        icon: "Brain",
        color: "from-orange-500 to-red-500",
    },
    "together:Qwen/Qwen3-Next-80B-A3B-Instruct": {
        id: "Qwen/Qwen3-Next-80B-A3B-Instruct",
        name: "Qwen3-Next-80B",
        provider: "together",
        description:
            "Powerful 80B model from Alibaba. Excellent for complex reasoning.",
        speed: "Slow",
        quality: "High",
        features: [
            "80B parameters",
            "Advanced reasoning",
            "Multi-lingual",
            "Long context",
            "High quality",
        ],
        icon: "Sparkles",
        color: "from-purple-500 to-pink-500",
    },
    "together:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": {
        id: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        name: "Llama-4-Maverick-17B",
        provider: "together",
        description:
            "Meta's Llama 4 variant. Optimized for instruction following.",
        speed: "Fast",
        quality: "High",
        features: [
            "Meta Llama 4",
            "17B parameters",
            "FP8 optimized",
            "Fast inference",
            "Instruction tuned",
        ],
        icon: "Flame",
        color: "from-yellow-500 to-orange-500",
    },
    "together:zai-org/GLM-4.5-Air-FP8": {
        id: "zai-org/GLM-4.5-Air-FP8",
        name: "GLM-4.5-Air",
        provider: "together",
        description:
            "Lightweight GLM model. Fast and efficient for most tasks.",
        speed: "Fast",
        quality: "Medium",
        features: [
            "Lightweight",
            "FP8 optimized",
            "Fast responses",
            "Efficient",
            "General purpose",
        ],
        icon: "Wind",
        color: "from-cyan-500 to-blue-500",
    },
    // Groq Models (Updated with correct models)
    "groq:openai/gpt-oss-20b": {
        id: "openai/gpt-oss-20b",
        name: "GPT-OSS-20B",
        provider: "groq",
        description: "Open source GPT 20B on Groq. Ultra-fast inference.",
        speed: "Fast",
        quality: "High",
        features: [
            "20B parameters",
            "Groq LPU",
            "Fast inference",
            "Open source",
            "General purpose",
        ],
        icon: "Rocket",
        color: "from-blue-500 to-indigo-500",
    },
    "groq:groq/compound": {
        id: "groq/compound",
        name: "Groq-Compound",
        provider: "groq",
        description: "Groq's compound model. Optimized for performance.",
        speed: "Fast",
        quality: "High",
        features: [
            "Groq optimized",
            "Compound architecture",
            "High throughput",
            "Low latency",
            "Versatile",
        ],
        icon: "Zap",
        color: "from-yellow-500 to-orange-600",
    },
    "groq:llama-3.1-8b-instant": {
        id: "llama-3.1-8b-instant",
        name: "Llama-3.1-8B-Instant",
        provider: "groq",
        description:
            "Meta's Llama 3.1 8B. Lightning-fast instant responses on Groq LPU.",
        speed: "Fast",
        quality: "High",
        features: [
            "Instant responses",
            "8B parameters",
            "Groq LPU",
            "Low latency",
            "High quality",
        ],
        icon: "Zap",
        color: "from-green-500 to-teal-500",
    },
    "groq:openai/gpt-oss-120b": {
        id: "openai/gpt-oss-120b",
        name: "GPT-OSS-120B",
        provider: "groq",
        description: "Large 120B model on Groq. Best for complex reasoning.",
        speed: "Balanced",
        quality: "High",
        features: [
            "120B parameters",
            "Complex reasoning",
            "Groq LPU",
            "High accuracy",
            "Advanced tasks",
        ],
        icon: "Brain",
        color: "from-purple-500 to-pink-600",
    },
    "groq:moonshotai/kimi-k2-instruct-0905": {
        id: "moonshotai/kimi-k2-instruct-0905",
        name: "Kimi-K2-Instruct",
        provider: "groq",
        description:
            "Moonshot AI's Kimi K2 on Groq. Instruction-tuned for precision.",
        speed: "Balanced",
        quality: "High",
        features: [
            "Instruction tuned",
            "High precision",
            "Groq LPU",
            "Multi-lingual",
            "Reliable",
        ],
        icon: "Sparkles",
        color: "from-teal-500 to-cyan-500",
    },
    // OpenRouter Models (Free)
    "openrouter:nvidia/nemotron-nano-12b-v2-vl:free": {
        id: "nvidia/nemotron-nano-12b-v2-vl:free",
        name: "Nvidia Nemotron Nano 12B (Free)",
        provider: "openrouter",
        description:
            "Nvidia's Nemotron Nano 12B model. Free tier with vision capabilities.",
        speed: "Fast",
        quality: "High",
        features: [
            "Free tier",
            "Vision capable",
            "12B parameters",
            "Fast inference",
            "Multi-modal",
        ],
        icon: "Eye",
        color: "from-green-500 to-emerald-500",
    },
    "openrouter:minimax/minimax-m2:free": {
        id: "minimax/minimax-m2:free",
        name: "MiniMax M2 (Free)",
        provider: "openrouter",
        description: "MiniMax M2 model. Free tier with great performance.",
        speed: "Balanced",
        quality: "High",
        features: [
            "Free tier",
            "Balanced speed",
            "High quality",
            "General purpose",
            "Multi-lingual",
        ],
        icon: "Sparkles",
        color: "from-indigo-500 to-purple-500",
    },
    "openrouter:meta-llama/llama-3.2-3b-instruct:free": {
        id: "meta-llama/llama-3.2-3b-instruct:free",
        name: "Llama 3.2 3B (Free)",
        provider: "openrouter",
        description: "Meta's Llama 3.2 3B. Free tier, instruction-tuned.",
        speed: "Fast",
        quality: "Medium",
        features: [
            "Free tier",
            "3B parameters",
            "Instruction tuned",
            "Fast responses",
            "Efficient",
        ],
        icon: "Zap",
        color: "from-blue-500 to-cyan-500",
    },
    "openrouter:meta-llama/llama-3.1-8b-instruct:free": {
        id: "meta-llama/llama-3.1-8b-instruct:free",
        name: "Llama 3.1 8B (Free)",
        provider: "openrouter",
        description: "Meta's Llama 3.1 8B. Free tier with solid performance.",
        speed: "Balanced",
        quality: "High",
        features: [
            "Free tier",
            "8B parameters",
            "Instruction tuned",
            "Reliable",
            "Versatile",
        ],
        icon: "Flame",
        color: "from-orange-500 to-red-500",
    },
    "openrouter:mistralai/mistral-7b-instruct:free": {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B (Free)",
        provider: "openrouter",
        description: "Mistral 7B Instruct. Free tier with excellent quality.",
        speed: "Fast",
        quality: "High",
        features: [
            "Free tier",
            "7B parameters",
            "High quality",
            "Fast inference",
            "General purpose",
        ],
        icon: "Wind",
        color: "from-violet-500 to-purple-500",
    },
};

// Function to load dynamic OpenRouter models from cache (FREE MODELS ONLY)
function loadDynamicOpenRouterModels(): Record<string, ModelInfo> {
    try {
        const cached = localStorage.getItem(OPENROUTER_CACHE_KEY);
        if (!cached) {
            console.log("📦 No OpenRouter cache found");
            return {};
        }

        interface CachedModel {
            id: string;
            name: string;
            description?: string;
            context_length?: number | null;
            pricing?: {
                prompt: string;
                completion: string;
            };
            architecture?: {
                input_modalities?: string[];
            };
        }

        interface CachedData {
            models: CachedModel[];
            timestamp: number;
        }

        const data = JSON.parse(cached) as CachedData;
        const models = data.models || [];

        console.log(`📦 Loading ${models.length} FREE models from cache`);

        const dynamicModels: Record<string, ModelInfo> = {};
        let freeCount = 0;

        models.forEach((model: CachedModel) => {
            // ONLY load FREE models - double check
            const isFree =
                model.id.includes(":free") ||
                (parseFloat(model.pricing?.prompt || "1") === 0 &&
                    parseFloat(model.pricing?.completion || "1") === 0);

            if (!isFree) {
                console.log(`⏭️ Skipping non-free model: ${model.id}`);
                return;
            }

            freeCount++;
            const modelKey = `openrouter:${model.id}`;

            // Determine speed based on context length
            const speed =
                !model.context_length || model.context_length < 32000
                    ? ("Fast" as const)
                    : model.context_length > 100000
                      ? ("Slow" as const)
                      : ("Balanced" as const);

            // Determine quality based on model size
            const quality =
                model.id.includes("120b") ||
                model.id.includes("80b") ||
                model.id.includes("70b")
                    ? ("High" as const)
                    : model.id.includes("3b") || model.id.includes("1b")
                      ? ("Medium" as const)
                      : ("High" as const);

            dynamicModels[modelKey] = {
                id: model.id,
                name:
                    model.name ||
                    model.id.split("/").pop()?.replace(":free", "") ||
                    model.id,
                provider: "openrouter",
                description:
                    model.description || `Free AI model: ${model.name}`,
                speed,
                quality,
                features: [
                    "🆓 Free tier",
                    ...(model.architecture?.input_modalities || []),
                    model.context_length
                        ? model.context_length >= 1000000
                            ? `${(model.context_length / 1000000).toFixed(1)}M ctx`
                            : `${(model.context_length / 1000).toFixed(0)}K ctx`
                        : "",
                ].filter(Boolean),
                icon: model.architecture?.input_modalities?.includes("image")
                    ? "Eye"
                    : "Sparkles",
                color: "from-green-500 to-emerald-500",
            };
        });

        console.log(
            `✅ Loaded ${freeCount} FREE models from OpenRouter cache (${Object.keys(dynamicModels).length} added)`,
        );
        return dynamicModels;
    } catch (error) {
        console.error("❌ Error loading OpenRouter dynamic models:", error);
        return {};
    }
}

// Function to load dynamic Groq models from cache (ALL CHAT MODELS - FREE TIER)
function loadDynamicGroqModels(): Record<string, ModelInfo> {
    try {
        const cached = localStorage.getItem(GROQ_CACHE_KEY);
        if (!cached) {
            console.log("📦 No Groq cache found");
            return {};
        }

        interface GroqCachedModel {
            id: string;
            object: string;
            created: number;
            owned_by: string;
            isFree: boolean;
        }

        interface CachedData {
            models: GroqCachedModel[];
            timestamp: number;
        }

        const data = JSON.parse(cached) as CachedData;
        const models = data.models || [];

        console.log(`📦 Loading ${models.length} Groq chat models from cache`);

        const dynamicModels: Record<string, ModelInfo> = {};

        models.forEach((model: GroqCachedModel) => {
            const modelKey = `groq:${model.id}`;

            // Determine speed - Groq is always fast!
            const speed = "Fast" as const;

            // Determine quality based on model name
            const quality =
                model.id.includes("405b") ||
                model.id.includes("70b") ||
                model.id.includes("mixtral")
                    ? ("High" as const)
                    : ("High" as const);

            // Build features array
            const features: string[] = [
                "🆓 Free",
                "⚡ Lightning fast",
                "🚀 Low latency",
                "Groq LPU™",
            ];

            // Extract model name
            const displayName =
                model.id
                    .split("/")
                    .pop()
                    ?.replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || model.id;

            dynamicModels[modelKey] = {
                id: model.id,
                name: displayName,
                provider: "groq",
                description: `${model.owned_by} model - Ultra-fast inference with Groq's LPU™ engine. Free tier available.`,
                speed,
                quality,
                features,
                icon: "Zap",
                color: "from-yellow-500 to-orange-500",
            };
        });

        console.log(
            `✅ Loaded ${models.length} Groq models from cache (all free)`,
        );
        return dynamicModels;
    } catch (error) {
        console.error("❌ Error loading Groq dynamic models:", error);
        return {};
    }
}

// Function to load dynamic Together AI models from cache (ALL CHAT MODELS)
function loadDynamicTogetherModels(): Record<string, ModelInfo> {
    try {
        const cached = localStorage.getItem(TOGETHER_CACHE_KEY);
        if (!cached) {
            console.log("📦 No Together AI cache found");
            return {};
        }

        interface TogetherCachedModel {
            id: string;
            display_name: string;
            organization: string;
            context_length: number;
            type: string;
            pricing: {
                input: number;
                output: number;
                hourly: number;
            };
            isFree: boolean;
        }

        interface CachedData {
            models: TogetherCachedModel[];
            timestamp: number;
        }

        const data = JSON.parse(cached) as CachedData;
        const models = data.models || [];

        console.log(
            `📦 Loading ${models.length} Together AI chat models from cache`,
        );

        const dynamicModels: Record<string, ModelInfo> = {};
        let freeCount = 0;
        let paidCount = 0;

        models.forEach((model: TogetherCachedModel) => {
            if (model.isFree) {
                freeCount++;
            } else {
                paidCount++;
            }

            const modelKey = `together:${model.id}`;

            // Determine speed based on context length and pricing
            const speed = model.isFree
                ? ("Fast" as const)
                : model.context_length > 100000
                  ? ("Slow" as const)
                  : model.pricing.input + model.pricing.output < 1
                    ? ("Fast" as const)
                    : ("Balanced" as const);

            // Determine quality based on organization and pricing
            const quality =
                model.organization === "Meta" ||
                model.organization === "Google" ||
                model.pricing.input + model.pricing.output > 2
                    ? ("High" as const)
                    : model.pricing.input + model.pricing.output < 0.5
                      ? ("Medium" as const)
                      : ("High" as const);

            // Build features array
            const features: string[] = [];

            if (model.isFree) {
                features.push("🆓 Free");
            } else {
                const totalCost = model.pricing.input + model.pricing.output;
                if (totalCost < 1) {
                    features.push("💰 Budget-friendly");
                } else if (totalCost >= 2) {
                    features.push("💎 Premium");
                }
            }

            if (model.context_length >= 1000000) {
                features.push(
                    `${(model.context_length / 1000000).toFixed(1)}M ctx`,
                );
            } else if (model.context_length >= 1000) {
                features.push(
                    `${(model.context_length / 1000).toFixed(0)}K ctx`,
                );
            }

            features.push("Chat model");
            features.push(model.organization);

            dynamicModels[modelKey] = {
                id: model.id,
                name: model.display_name,
                provider: "together",
                description: `${model.organization} chat model${!model.isFree ? ` - Input: $${model.pricing.input}/1M, Output: $${model.pricing.output}/1M` : " - Completely Free"}`,
                speed,
                quality,
                features,
                icon: "MessageSquare",
                color: "from-purple-500 to-pink-500",
            };
        });

        console.log(
            `✅ Loaded ${models.length} Together AI models from cache (${freeCount} free, ${paidCount} paid)`,
        );
        return dynamicModels;
    } catch (error) {
        console.error("❌ Error loading Together AI dynamic models:", error);
        return {};
    }
}

class UnifiedAiService {
    async sendMessage(
        options: UnifiedRequestOptions,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (error: Error) => void,
    ): Promise<void> {
        const { provider, model, messages, temperature, max_tokens } = options;

        if (provider === "poe") {
            const poeMessages: PoeMessage[] = messages.map((m) => ({
                role: m.role === "assistant" ? "assistant" : m.role,
                content: m.content,
            }));

            await poeApi.sendMessageStream(
                { model, messages: poeMessages, temperature, max_tokens },
                onChunk,
                onComplete,
                onError,
            );
        } else if (provider === "together") {
            const togetherMessages: TogetherMessage[] = messages.map((m) => ({
                role: m.role === "assistant" ? "assistant" : m.role,
                content: m.content,
            }));

            await togetherApi.sendMessageStream(
                { model, messages: togetherMessages, temperature, max_tokens },
                onChunk,
                onComplete,
                onError,
            );
        } else if (provider === "groq") {
            const groqMessages: GroqMessage[] = messages.map((m) => ({
                role: m.role === "assistant" ? "assistant" : m.role,
                content: m.content,
            }));

            await groqApi.sendMessageStream(
                {
                    model,
                    messages: groqMessages,
                    temperature,
                    max_completion_tokens: max_tokens,
                },
                onChunk,
                onComplete,
                onError,
            );
        } else if (provider === "openrouter") {
            const openrouterMessages: OpenRouterMessage[] = messages.map(
                (m) => ({
                    role: m.role === "assistant" ? "assistant" : m.role,
                    content: m.content,
                }),
            );

            await openrouterApi.sendMessageStream(
                {
                    model,
                    messages: openrouterMessages,
                    temperature,
                    max_tokens,
                },
                onChunk,
                onComplete,
                onError,
            );
        } else {
            onError(new Error(`Unsupported provider: ${provider}`));
        }
    }

    async sendMessageSync(
        provider: Provider,
        modelId: string,
        messages: Array<{ role: string; content: string }>,
        maxTokens?: number,
    ): Promise<{ content: string; metadata?: Record<string, unknown> }> {
        return new Promise((resolve, reject) => {
            let fullContent = "";

            this.sendMessage(
                {
                    provider,
                    model: modelId,
                    messages,
                    temperature: 0.7,
                    max_tokens: maxTokens || 2000,
                },
                (chunk) => {
                    fullContent += chunk;
                },
                () => {
                    resolve({ content: fullContent });
                },
                (error) => {
                    reject(error);
                },
            );
        });
    }

    getAllModels(): ModelInfo[] {
        // Merge static models with dynamic OpenRouter, Together, and Groq models
        const dynamicOpenRouter = loadDynamicOpenRouterModels();
        const dynamicTogether = loadDynamicTogetherModels();
        const dynamicGroq = loadDynamicGroqModels();
        const allModels = {
            ...ALL_MODELS,
            ...dynamicOpenRouter,
            ...dynamicTogether,
            ...dynamicGroq,
        };
        return Object.values(allModels);
    }

    getModelsByProvider(provider: Provider): ModelInfo[] {
        if (provider === "openrouter") {
            // For OpenRouter, prioritize dynamic FREE models from cache
            const dynamicModels = loadDynamicOpenRouterModels();
            const dynamicList = Object.values(dynamicModels);

            // Get static free models
            const staticModels = Object.values(ALL_MODELS).filter(
                (m) => m.provider === provider,
            );

            // If we have dynamic models, use them (they are already filtered as FREE)
            if (dynamicList.length > 0) {
                console.log(
                    `🎯 Using ${dynamicList.length} dynamic FREE models for OpenRouter`,
                );
                return dynamicList;
            }

            // Otherwise fall back to static FREE models
            console.log(
                `🎯 Using ${staticModels.length} static FREE models for OpenRouter`,
            );
            return staticModels;
        }

        if (provider === "together") {
            // For Together, prioritize dynamic models from cache
            const dynamicModels = loadDynamicTogetherModels();
            const dynamicList = Object.values(dynamicModels);

            // Get static models
            const staticModels = Object.values(ALL_MODELS).filter(
                (m) => m.provider === provider,
            );

            // If we have dynamic models, use them
            if (dynamicList.length > 0) {
                console.log(
                    `🎯 Using ${dynamicList.length} dynamic chat models for Together AI`,
                );
                return dynamicList;
            }

            // Otherwise fall back to static models
            console.log(
                `🎯 Using ${staticModels.length} static models for Together AI`,
            );
            return staticModels;
        }

        if (provider === "groq") {
            // For Groq, prioritize dynamic models from cache
            const dynamicModels = loadDynamicGroqModels();
            const dynamicList = Object.values(dynamicModels);

            // Get static models
            const staticModels = Object.values(ALL_MODELS).filter(
                (m) => m.provider === provider,
            );

            // If we have dynamic models, use them
            if (dynamicList.length > 0) {
                console.log(
                    `🎯 Using ${dynamicList.length} dynamic chat models for Groq`,
                );
                return dynamicList;
            }

            // Otherwise fall back to static models
            console.log(
                `🎯 Using ${staticModels.length} static models for Groq`,
            );
            return staticModels;
        }

        return Object.values(ALL_MODELS).filter((m) => m.provider === provider);
    }

    getModelInfo(provider: Provider, modelId: string): ModelInfo | undefined {
        // Check dynamic models first for OpenRouter
        if (provider === "openrouter") {
            const dynamicModels = loadDynamicOpenRouterModels();
            const dynamicModel = dynamicModels[`${provider}:${modelId}`];
            if (dynamicModel) return dynamicModel;
        }

        // Check dynamic models first for Together
        if (provider === "together") {
            const dynamicModels = loadDynamicTogetherModels();
            const dynamicModel = dynamicModels[`${provider}:${modelId}`];
            if (dynamicModel) return dynamicModel;
        }

        // Check dynamic models first for Groq
        if (provider === "groq") {
            const dynamicModels = loadDynamicGroqModels();
            const dynamicModel = dynamicModels[`${provider}:${modelId}`];
            if (dynamicModel) return dynamicModel;
        }

        return ALL_MODELS[`${provider}:${modelId}`];
    }

    isProviderConfigured(provider: Provider): boolean {
        if (provider === "poe") {
            return poeApi.isConfigured();
        } else if (provider === "together") {
            return togetherApi.isConfigured();
        } else if (provider === "groq") {
            const configured = groqApi.isConfigured();
            console.log("🔍 Groq provider check:", configured);
            return configured;
        } else if (provider === "openrouter") {
            const configured = openrouterApi.isConfigured();
            console.log("🔍 OpenRouter provider check:", configured);
            return configured;
        }
        return false;
    }

    getAvailableProviders(): Provider[] {
        const providers: Provider[] = [];
        if (poeApi.isConfigured()) providers.push("poe");
        if (togetherApi.isConfigured()) providers.push("together");
        if (groqApi.isConfigured()) {
            console.log("✅ Adding Groq to available providers");
            providers.push("groq");
        }
        if (openrouterApi.isConfigured()) {
            console.log("✅ Adding OpenRouter to available providers");
            providers.push("openrouter");
        }
        console.log("📋 Final available providers:", providers);
        return providers;
    }
}

// Export singleton instance
export const aiApi = new UnifiedAiService();
