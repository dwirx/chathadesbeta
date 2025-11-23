// IndexedDB service for session management

const DB_NAME = "ChatBotDB";
const DB_VERSION = 2;
const SESSIONS_STORE = "sessions";
const MESSAGES_STORE = "messages";
const AGENT_SESSIONS_STORE = "agentSessions";
const AGENT_RESPONSES_STORE = "agentResponses";

export interface Session {
    id: string;
    title: string;
    timestamp: number;
    modelName: string;
    provider: string;
    modelId: string;
    lastMessage?: string;
    isAgentMode?: boolean;
}

export interface AgentSession {
    id: string;
    title: string;
    timestamp: number;
    models: Array<{
        provider: string;
        modelId: string;
        modelName: string;
    }>;
    lastMessage?: string;
}

export interface AgentResponse {
    id: string;
    sessionId: string;
    userMessage: string;
    timestamp: number;
    responses: Array<{
        provider: string;
        modelId: string;
        modelName: string;
        content: string;
        metadata?: {
            duration?: string;
            tokens?: string;
            speed?: string;
        };
        error?: string;
    }>;
}

export interface Message {
    id: string;
    sessionId: string;
    role: "user" | "ai";
    content: string;
    timestamp: number;
    modelName?: string;
    metadata?: {
        duration?: string;
        ttft?: string;
        tokens?: string;
        speed?: string;
    };
}

class ChatDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create sessions store
                if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
                    const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
                        keyPath: "id",
                    });
                    sessionsStore.createIndex("timestamp", "timestamp", {
                        unique: false,
                    });
                }

                // Create messages store
                if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
                    const messagesStore = db.createObjectStore(MESSAGES_STORE, {
                        keyPath: "id",
                    });
                    messagesStore.createIndex("sessionId", "sessionId", {
                        unique: false,
                    });
                    messagesStore.createIndex("timestamp", "timestamp", {
                        unique: false,
                    });
                }

                // Create agent sessions store
                if (!db.objectStoreNames.contains(AGENT_SESSIONS_STORE)) {
                    const agentSessionsStore = db.createObjectStore(
                        AGENT_SESSIONS_STORE,
                        {
                            keyPath: "id",
                        },
                    );
                    agentSessionsStore.createIndex("timestamp", "timestamp", {
                        unique: false,
                    });
                }

                // Create agent responses store
                if (!db.objectStoreNames.contains(AGENT_RESPONSES_STORE)) {
                    const agentResponsesStore = db.createObjectStore(
                        AGENT_RESPONSES_STORE,
                        {
                            keyPath: "id",
                        },
                    );
                    agentResponsesStore.createIndex("sessionId", "sessionId", {
                        unique: false,
                    });
                    agentResponsesStore.createIndex("timestamp", "timestamp", {
                        unique: false,
                    });
                }
            };
        });
    }

    // Session operations
    async createSession(session: Session): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [SESSIONS_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(SESSIONS_STORE);
            const request = store.add(session);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllSessions(): Promise<Session[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [SESSIONS_STORE],
                "readonly",
            );
            const store = transaction.objectStore(SESSIONS_STORE);
            const index = store.index("timestamp");
            const request = index.openCursor(null, "prev"); // Descending order

            const sessions: Session[] = [];
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    sessions.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(sessions);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getSession(id: string): Promise<Session | undefined> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [SESSIONS_STORE],
                "readonly",
            );
            const store = transaction.objectStore(SESSIONS_STORE);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateSession(session: Session): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [SESSIONS_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(SESSIONS_STORE);
            const request = store.put(session);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSession(id: string): Promise<void> {
        if (!this.db) await this.init();

        // Delete all messages for this session first
        await this.deleteMessagesBySession(id);

        // Then delete the session
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [SESSIONS_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(SESSIONS_STORE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Message operations
    async addMessage(message: Message): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [MESSAGES_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(MESSAGES_STORE);
            const request = store.add(message);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getMessagesBySession(sessionId: string): Promise<Message[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [MESSAGES_STORE],
                "readonly",
            );
            const store = transaction.objectStore(MESSAGES_STORE);
            const index = store.index("sessionId");
            const request = index.getAll(sessionId);

            request.onsuccess = () => {
                const messages = request.result;
                // Sort by timestamp
                messages.sort((a, b) => a.timestamp - b.timestamp);
                resolve(messages);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMessagesBySession(sessionId: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [MESSAGES_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(MESSAGES_STORE);
            const index = store.index("sessionId");
            const request = index.openCursor(IDBKeyRange.only(sessionId));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllData(): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [
                    SESSIONS_STORE,
                    MESSAGES_STORE,
                    AGENT_SESSIONS_STORE,
                    AGENT_RESPONSES_STORE,
                ],
                "readwrite",
            );

            const sessionsStore = transaction.objectStore(SESSIONS_STORE);
            const messagesStore = transaction.objectStore(MESSAGES_STORE);
            const agentSessionsStore =
                transaction.objectStore(AGENT_SESSIONS_STORE);
            const agentResponsesStore = transaction.objectStore(
                AGENT_RESPONSES_STORE,
            );

            sessionsStore.clear();
            messagesStore.clear();
            agentSessionsStore.clear();
            agentResponsesStore.clear();

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Agent Session operations
    async createAgentSession(session: AgentSession): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_SESSIONS_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(AGENT_SESSIONS_STORE);
            const request = store.add(session);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllAgentSessions(): Promise<AgentSession[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_SESSIONS_STORE],
                "readonly",
            );
            const store = transaction.objectStore(AGENT_SESSIONS_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                const sessions = request.result as AgentSession[];
                resolve(sessions.sort((a, b) => b.timestamp - a.timestamp));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAgentSession(id: string): Promise<AgentSession | null> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_SESSIONS_STORE],
                "readonly",
            );
            const store = transaction.objectStore(AGENT_SESSIONS_STORE);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async updateAgentSession(session: AgentSession): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_SESSIONS_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(AGENT_SESSIONS_STORE);
            const request = store.put(session);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteAgentSession(id: string): Promise<void> {
        if (!this.db) await this.init();

        // Delete all responses for this session first
        await this.deleteAgentResponsesBySession(id);

        // Then delete the session
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_SESSIONS_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(AGENT_SESSIONS_STORE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Agent Response operations
    async addAgentResponse(response: AgentResponse): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_RESPONSES_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(AGENT_RESPONSES_STORE);
            const request = store.add(response);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAgentResponsesBySession(
        sessionId: string,
    ): Promise<AgentResponse[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_RESPONSES_STORE],
                "readonly",
            );
            const store = transaction.objectStore(AGENT_RESPONSES_STORE);
            const index = store.index("sessionId");
            const request = index.getAll(IDBKeyRange.only(sessionId));

            request.onsuccess = () => {
                const responses = request.result as AgentResponse[];
                resolve(responses.sort((a, b) => a.timestamp - b.timestamp));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteAgentResponsesBySession(sessionId: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                [AGENT_RESPONSES_STORE],
                "readwrite",
            );
            const store = transaction.objectStore(AGENT_RESPONSES_STORE);
            const index = store.index("sessionId");
            const request = index.openCursor(IDBKeyRange.only(sessionId));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}

export const chatDB = new ChatDB();
