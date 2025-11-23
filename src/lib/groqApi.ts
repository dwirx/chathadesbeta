// Groq API service for chat completions

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export interface GroqMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface GroqRequestOptions {
    model: string;
    messages: GroqMessage[];
    temperature?: number;
    max_completion_tokens?: number;
    stream?: boolean;
}

export interface GroqResponse {
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

export const GROQ_MODELS = {
    "llama-3.1-8b-instant": "Llama-3.1-8B",
    "mixtral-8x7b-32768": "Mixtral-8x7B",
    "gemma2-9b-it": "Gemma2-9B",
    "openai/gpt-oss-20b": "GPT-OSS-20B",
    "groq/compound": "Groq Compound",
    "openai/gpt-oss-120b": "GPT-OSS-120B",
    "moonshotai/kimi-k2-instruct-0905": "Kimi K2 Instruct",
} as const;

export type GroqModelType = keyof typeof GROQ_MODELS;

// Models that don't support reasoning_effort parameter
// This list is auto-updated when we detect unsupported models
const NO_REASONING_MODELS: Set<string> = new Set([
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.2-1b-preview",
    "llama-3.2-3b-preview",
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "llama-guard-3-8b",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma-7b-it",
    "gemma2-9b-it",
    "groq/compound",
    "moonshotai/kimi-k2-instruct-0905",
]);

// Helper function to check if model supports reasoning_effort
const supportsReasoningEffort = (modelId: string): boolean => {
    // Check if in blacklist
    if (NO_REASONING_MODELS.has(modelId)) {
        return false;
    }

    // Auto-detect: Most Groq models don't support reasoning_effort
    // Only specific reasoning models support it (like DeepSeek R1)
    const reasoningPatterns = ["deepseek", "r1", "reasoning", "think"];

    const lowerModelId = modelId.toLowerCase();
    return reasoningPatterns.some((pattern) => lowerModelId.includes(pattern));
};

class GroqApiService {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = GROQ_API_KEY || "";
        this.apiUrl = GROQ_API_URL;
    }

    async sendMessage(options: GroqRequestOptions): Promise<GroqResponse> {
        if (!this.apiKey) {
            throw new Error(
                "Groq API key is not configured. Please set VITE_GROQ_API_KEY in .env file",
            );
        }

        try {
            const requestBody: Record<string, unknown> = {
                model: options.model,
                messages: options.messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_completion_tokens || 8192,
                stream: options.stream || false,
            };

            // Only add reasoning_effort if model supports it
            if (supportsReasoningEffort(options.model)) {
                requestBody.reasoning_effort = "medium";
                console.log(
                    `✅ Model ${options.model} supports reasoning_effort`,
                );
            } else {
                console.log(
                    `⏭️ Model ${options.model} does not support reasoning_effort - skipping parameter`,
                );
            }

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Auto-detect if error is due to reasoning_effort
                if (errorData.error?.message?.includes("reasoning_effort")) {
                    console.warn(
                        `⚠️ Model ${options.model} doesn't support reasoning_effort - adding to blacklist and retrying`,
                    );
                    NO_REASONING_MODELS.add(options.model);

                    // Retry without reasoning_effort
                    delete requestBody.reasoning_effort;
                    const retryResponse = await fetch(this.apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${this.apiKey}`,
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!retryResponse.ok) {
                        const retryError = await retryResponse
                            .json()
                            .catch(() => ({}));
                        throw new Error(
                            retryError.error?.message ||
                                `Groq API error: ${retryResponse.status} ${retryResponse.statusText}`,
                        );
                    }

                    return await retryResponse.json();
                }
                throw new Error(
                    `Groq API error: ${response.status} ${response.statusText}. ${
                        errorData.error?.message || ""
                    }`,
                );
            }

            const data: GroqResponse = await response.json();
            return data;
        } catch (error) {
            console.error("Error calling Groq API:", error);
            throw error;
        }
    }

    async sendMessageStream(
        options: GroqRequestOptions,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (error: Error) => void,
    ): Promise<void> {
        if (!this.apiKey) {
            throw new Error(
                "Groq API key is not configured. Please set VITE_GROQ_API_KEY in .env file",
            );
        }

        try {
            const requestBody: Record<string, unknown> = {
                model: options.model,
                messages: options.messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_completion_tokens || 8192,
                stream: true,
            };

            // Only add reasoning_effort if model supports it
            if (supportsReasoningEffort(options.model)) {
                requestBody.reasoning_effort = "medium";
                console.log(
                    `✅ Model ${options.model} supports reasoning_effort (streaming)`,
                );
            } else {
                console.log(
                    `⏭️ Model ${options.model} does not support reasoning_effort - skipping parameter (streaming)`,
                );
            }

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Auto-detect if error is due to reasoning_effort
                if (errorData.error?.message?.includes("reasoning_effort")) {
                    console.warn(
                        `⚠️ Model ${options.model} doesn't support reasoning_effort - adding to blacklist and retrying (streaming)`,
                    );
                    NO_REASONING_MODELS.add(options.model);

                    // Retry without reasoning_effort
                    delete requestBody.reasoning_effort;
                    const retryResponse = await fetch(this.apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${this.apiKey}`,
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!retryResponse.ok) {
                        const retryError = await retryResponse
                            .json()
                            .catch(() => ({}));
                        const error = new Error(
                            retryError.error?.message ||
                                `Groq API error: ${retryResponse.status} ${retryResponse.statusText}`,
                        );
                        onError(error);
                        return;
                    }

                    // Continue with retry response
                    const retryReader = retryResponse.body?.getReader();
                    if (!retryReader) {
                        throw new Error("Retry response body is not readable");
                    }

                    const decoder = new TextDecoder();
                    let buffer = "";

                    while (true) {
                        const { done, value } = await retryReader.read();

                        if (done) {
                            onComplete();
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (
                                !trimmedLine ||
                                trimmedLine === "data: [DONE]"
                            ) {
                                continue;
                            }

                            if (trimmedLine.startsWith("data: ")) {
                                try {
                                    const jsonData = JSON.parse(
                                        trimmedLine.slice(6),
                                    );
                                    const content =
                                        jsonData.choices?.[0]?.delta?.content ||
                                        "";
                                    if (content) {
                                        onChunk(content);
                                    }
                                } catch (e) {
                                    console.error(
                                        "Error parsing streaming JSON:",
                                        e,
                                    );
                                }
                            }
                        }
                    }
                    return;
                }

                const error = new Error(
                    `Groq API error: ${response.status} ${response.statusText}. ${
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
            console.error("Error in Groq stream:", error);
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

export const groqApi = new GroqApiService();
