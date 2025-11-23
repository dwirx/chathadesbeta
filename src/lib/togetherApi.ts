// Together AI API service for chat completions

const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";
const TOGETHER_API_KEY = import.meta.env.VITE_TOGETHER_API_KEY;

export interface TogetherMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface TogetherRequestOptions {
    model: string;
    messages: TogetherMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface TogetherResponse {
    id: string;
    object: string;
    created: number;
    model: string;
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

export const TOGETHER_MODELS = {
    "openai/gpt-oss-20b": "GPT-OSS-20B",
    "Qwen/Qwen3-Next-80B-A3B-Instruct": "Qwen3-Next-80B",
    "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": "Llama-4-Maverick-17B",
    "zai-org/GLM-4.5-Air-FP8": "GLM-4.5-Air",
} as const;

export type TogetherModelType = keyof typeof TOGETHER_MODELS;

class TogetherApiService {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = TOGETHER_API_KEY || "";
        this.apiUrl = TOGETHER_API_URL;
    }

    async sendMessage(
        options: TogetherRequestOptions,
    ): Promise<TogetherResponse> {
        if (!this.apiKey) {
            throw new Error(
                "Together API key is not configured. Please set VITE_TOGETHER_API_KEY in .env file",
            );
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: options.messages,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.max_tokens || 256,
                    stream: options.stream || false,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Together API error: ${response.status} ${response.statusText}. ${
                        errorData.error?.message || ""
                    }`,
                );
            }

            const data: TogetherResponse = await response.json();
            return data;
        } catch (error) {
            console.error("Error calling Together API:", error);
            throw error;
        }
    }

    async sendMessageStream(
        options: TogetherRequestOptions,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (error: Error) => void,
    ): Promise<void> {
        if (!this.apiKey) {
            throw new Error(
                "Together API key is not configured. Please set VITE_TOGETHER_API_KEY in .env file",
            );
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: options.messages,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.max_tokens || 256,
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Together API error: ${response.status} ${response.statusText}. ${
                        errorData.error?.message || ""
                    }`,
                );
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
                    if (line.trim() === "" || line.trim() === "data: [DONE]") {
                        continue;
                    }

                    if (line.startsWith("data: ")) {
                        try {
                            const jsonStr = line.slice(6);
                            const data = JSON.parse(jsonStr);

                            if (
                                data.choices &&
                                data.choices[0]?.delta?.content
                            ) {
                                onChunk(data.choices[0].delta.content);
                            }
                        } catch (e) {
                            console.error("Error parsing SSE data:", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error in stream:", error);
            onError(error as Error);
        }
    }

    getAvailableModels(): TogetherModelType[] {
        return Object.keys(TOGETHER_MODELS) as TogetherModelType[];
    }

    getModelDisplayName(model: string): string {
        return TOGETHER_MODELS[model as TogetherModelType] || model;
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

// Export singleton instance
export const togetherApi = new TogetherApiService();
