// OpenRouter API service for chat completions

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
const SITE_NAME = import.meta.env.VITE_SITE_NAME || "ChatbotX";

export interface OpenRouterModelData {
    id: string;
    name: string;
    description?: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    context_length?: number | null;
    architecture?: {
        modality?: string | null;
        input_modalities?: string[];
        output_modalities?: string[];
    };
}

export interface OpenRouterMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface OpenRouterRequestOptions {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
}

export interface OpenRouterResponse {
    id: string;
    model: string;
    created: number;
    object: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Free models available on OpenRouter
export const OPENROUTER_MODELS = {
    "nvidia/nemotron-nano-12b-v2-vl:free": "Nvidia Nemotron Nano 12B (Free)",
    "minimax/minimax-m2:free": "MiniMax M2 (Free)",
    "google/gemini-flash-1.5-8b-exp-0827:free": "Gemini Flash 1.5 8B (Free)",
    "google/gemini-flash-1.5-exp:free": "Gemini Flash 1.5 (Free)",
    "meta-llama/llama-3.2-3b-instruct:free": "Llama 3.2 3B (Free)",
    "meta-llama/llama-3.2-1b-instruct:free": "Llama 3.2 1B (Free)",
    "meta-llama/llama-3.1-8b-instruct:free": "Llama 3.1 8B (Free)",
    "mistralai/mistral-7b-instruct:free": "Mistral 7B (Free)",
    "huggingfaceh4/zephyr-7b-beta:free": "Zephyr 7B (Free)",
    "openchat/openchat-7b:free": "OpenChat 7B (Free)",
    "nousresearch/nous-capybara-7b:free": "Nous Capybara 7B (Free)",
    "gryphe/mythomist-7b:free": "MythoMist 7B (Free)",
    "undi95/toppy-m-7b:free": "Toppy M 7B (Free)",
} as const;

export type OpenRouterModelType = keyof typeof OPENROUTER_MODELS;

class OpenRouterApiService {
    private apiKey: string;
    private apiUrl: string;
    private siteUrl: string;
    private siteName: string;

    constructor() {
        this.apiKey = OPENROUTER_API_KEY || "";
        this.apiUrl = OPENROUTER_API_URL;
        this.siteUrl = SITE_URL;
        this.siteName = SITE_NAME;
    }

    async sendMessage(
        options: OpenRouterRequestOptions,
    ): Promise<OpenRouterResponse> {
        if (!this.apiKey) {
            throw new Error(
                "OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in .env file",
            );
        }

        try {
            const requestBody = {
                model: options.model,
                messages: options.messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 4096,
                top_p: options.top_p ?? 1,
                frequency_penalty: options.frequency_penalty ?? 0,
                presence_penalty: options.presence_penalty ?? 0,
                stream: options.stream ?? false,
            };

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                    "HTTP-Referer": this.siteUrl,
                    "X-Title": this.siteName,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `OpenRouter API error: ${response.status} ${response.statusText}. ${
                        errorData.error?.message || ""
                    }`,
                );
            }

            const data: OpenRouterResponse = await response.json();
            return data;
        } catch (error) {
            console.error("Error calling OpenRouter API:", error);
            throw error;
        }
    }

    async sendMessageStream(
        options: OpenRouterRequestOptions,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (error: Error) => void,
    ): Promise<void> {
        if (!this.apiKey) {
            throw new Error(
                "OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in .env file",
            );
        }

        try {
            const requestBody = {
                model: options.model,
                messages: options.messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 4096,
                top_p: options.top_p ?? 1,
                frequency_penalty: options.frequency_penalty ?? 0,
                presence_penalty: options.presence_penalty ?? 0,
                stream: true,
            };

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                    "HTTP-Referer": this.siteUrl,
                    "X-Title": this.siteName,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(
                    `OpenRouter API error: ${response.status} ${response.statusText}. ${
                        errorData.error?.message || ""
                    }`,
                );
                onError(error);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Response body is not readable");
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    onComplete();
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === "data: [DONE]") {
                        continue;
                    }

                    if (trimmedLine.startsWith("data: ")) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);

                            if (data.choices?.[0]?.delta?.content) {
                                onChunk(data.choices[0].delta.content);
                            }
                        } catch (error) {
                            console.error("Error parsing SSE data:", error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error in OpenRouter stream:", error);
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getAvailableModels(): Promise<OpenRouterModelData[]> {
        if (!this.apiKey) {
            throw new Error(
                "OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in .env file",
            );
        }

        try {
            const response = await fetch(
                "https://openrouter.ai/api/v1/models",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch models: ${response.statusText}`,
                );
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Error fetching OpenRouter models:", error);
            throw error;
        }
    }

    async getFreeModels(): Promise<OpenRouterModelData[]> {
        const allModels = await this.getAvailableModels();
        // Filter models that have :free suffix or zero pricing
        return allModels.filter((model) => {
            const isFreeModel = model.id.includes(":free");
            const hasZeroPricing =
                parseFloat(model.pricing?.prompt || "1") === 0 &&
                parseFloat(model.pricing?.completion || "1") === 0;
            return isFreeModel || hasZeroPricing;
        });
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

export const openrouterApi = new OpenRouterApiService();
