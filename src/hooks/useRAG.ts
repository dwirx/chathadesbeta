import { useState, useCallback } from "react";

export interface RAGDocument {
    id: string;
    name: string;
    content: string;
    type: string;
    size: number;
    uploadedAt: number;
}

export const useRAG = (chatId?: string) => {
    const [documents, setDocuments] = useState<RAGDocument[]>([]);

    /**
     * Add document to RAG context
     */
    const addDocument = useCallback((doc: RAGDocument) => {
        setDocuments((prev) => [...prev, doc]);
    }, []);

    /**
     * Remove document from RAG context
     */
    const removeDocument = useCallback((docId: string) => {
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    }, []);

    /**
     * Clear all documents
     */
    const clearDocuments = useCallback(() => {
        setDocuments([]);
    }, []);

    /**
     * Get RAG context from uploaded documents
     */
    const getRAGContext = useCallback((): string => {
        if (documents.length === 0) {
            return "";
        }

        let context =
            "\n[Document Context - Use this information to answer the user's question]\n\n";

        documents.forEach((doc, index) => {
            context += `Document ${index + 1}: ${doc.name}\n`;
            context += `${doc.content}\n\n`;
            context += "---\n\n";
        });

        context +=
            "Please use the above document content to provide accurate information in your response.\n\n";

        return context;
    }, [documents]);

    /**
     * Check if RAG is enabled for this chat
     */
    const isRAGEnabled = useCallback((): boolean => {
        if (chatId) {
            const chatSettings = localStorage.getItem(`chat-${chatId}-rag`);
            if (chatSettings) {
                return JSON.parse(chatSettings).enabled ?? true;
            }
        }

        // Check global settings
        const settings = localStorage.getItem("chatbotx-settings");
        if (settings) {
            const parsed = JSON.parse(settings);
            return parsed.ragEnabled ?? true;
        }

        return true;
    }, [chatId]);

    /**
     * Toggle RAG for this chat
     */
    const toggleRAG = useCallback(
        (enabled: boolean) => {
            if (chatId) {
                localStorage.setItem(
                    `chat-${chatId}-rag`,
                    JSON.stringify({ enabled }),
                );
            }
        },
        [chatId],
    );

    return {
        documents,
        addDocument,
        removeDocument,
        clearDocuments,
        getRAGContext,
        isRAGEnabled,
        toggleRAG,
    };
};
