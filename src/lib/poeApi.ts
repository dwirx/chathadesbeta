// Poe API service for chat completions

const POE_API_URL = "https://api.poe.com/v1/chat/completions";
const POE_API_KEY = import.meta.env.VITE_POE_API_KEY;

export interface PoeMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface PoeRequestOptions {
    model: string;
    messages: PoeMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface PoeResponse {
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

export const POE_MODELS = {
    "GPT-5-mini": "GPT-5-mini",
    "GPT-5-nano": "GPT-5-nano",
} as const;

export type PoeModelType = keyof typeof POE_MODELS;

class PoeApiService {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = POE_API_KEY || "";
        this.apiUrl = POE_API_URL;
    }

    async sendMessage(options: PoeRequestOptions): Promise<PoeResponse> {
        if (!this.apiKey) {
            throw new Error(
                "POE API key is not configured. Please set VITE_POE_API_KEY in .env file",
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
                    max_tokens: options.max_tokens || 2000,
                    stream: options.stream || false,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Poe API error: ${response.status} ${response.statusText}. ${
                        errorData.error?.message || ""
                    }`,
                );
            }

            const data: PoeResponse = await response.json();
            return data;
        } catch (error) {
            console.error("Error calling Poe API:", error);
            throw error;
        }
    }

    async sendMessageStream(
        options: PoeRequestOptions,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (error: Error) => void,
    ): Promise<void> {
        if (!this.apiKey) {
            throw new Error(
                "POE API key is not configured. Please set VITE_POE_API_KEY in .env file",
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
                    max_tokens: options.max_tokens || 2000,
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Poe API error: ${response.status} ${response.statusText}. ${
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

    getAvailableModels(): PoeModelType[] {
        return Object.keys(POE_MODELS) as PoeModelType[];
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

// Export singleton instance
export const poeApi = new PoeApiService();
