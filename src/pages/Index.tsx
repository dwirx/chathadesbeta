import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";
import { AgentMode } from "@/components/AgentMode";
import { ASSDebateMode } from "@/components/ASSDebateMode";
import { AgentCouncilMode } from "@/components/AgentCouncilMode";
import { SettingsSidebar } from "@/components/SettingsSidebar";

import { chatDB, Session } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ModelSelector } from "@/components/ModelSelector";
import { Provider, aiApi } from "@/lib/aiApi";
import { Button } from "@/components/ui/button";

const Index = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<
        string | undefined
    >();
    const [currentModelName, setCurrentModelName] = useState<
        string | undefined
    >();
    const [currentProvider, setCurrentProvider] = useState<
        Provider | undefined
    >();
    const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
    const [showAgentMode, setShowAgentMode] = useState(false);
    const [showASSDebateMode, setShowASSDebateMode] = useState(false);
    const [showAgentCouncilMode, setShowAgentCouncilMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(false);

    const { toast } = useToast();

    // Keyboard shortcut for settings (Ctrl/Cmd + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setSettingsSidebarOpen((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Initialize database
    useEffect(() => {
        initializeDB();
        // Debug providers
        console.log("🔍 Available Providers:", aiApi.getAvailableProviders());
        console.log("📊 Total Models:", aiApi.getAllModels().length);
        console.log(
            "🔑 Groq Key:",
            import.meta.env.VITE_GROQ_API_KEY ? "✅ Set" : "❌ Missing",
        );
    }, []);

    // Check if we need to show welcome dialog
    useEffect(() => {
        if (isInitialized && !currentSessionId) {
            checkFirstTime();
        }
    }, [isInitialized, currentSessionId]);

    const checkFirstTime = async () => {
        try {
            const sessions = await chatDB.getAllSessions();
            if (sessions.length === 0) {
                // First time user, show welcome dialog
                setShowWelcomeDialog(true);
            }
        } catch (error) {
            console.error("Error checking first time:", error);
        }
    };

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const initializeDB = async () => {
        try {
            await chatDB.init();
            console.log("Database initialized successfully");
            setIsInitialized(true);
        } catch (error) {
            console.error("Error initializing database:", error);
            toast({
                title: "Database Error",
                description: "Failed to initialize local database",
                variant: "destructive",
            });
        }
    };

    const handleNewSession = async (provider: Provider, modelId: string) => {
        try {
            const timestamp = Date.now();
            const formattedTime = new Date(timestamp).toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                },
            );

            const newSession: Session = {
                id: `session-${timestamp}`,
                title: `Chat: ${modelId} ${formattedTime}`,
                timestamp,
                modelName: `${provider}:${modelId}`,
                provider: provider,
                modelId: modelId,
            };

            await chatDB.createSession(newSession);
            setCurrentSessionId(newSession.id);
            setCurrentModelName(modelId);
            setCurrentProvider(provider);

            toast({
                title: "New Session",
                description: `Created new chat with ${modelId}`,
            });

            // Close sidebar on mobile after creating session
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }
        } catch (error) {
            console.error("Error creating session:", error);
            toast({
                title: "Error",
                description: "Failed to create new session",
                variant: "destructive",
            });
        }
    };

    const handleSessionChange = async (sessionId: string) => {
        try {
            const session = await chatDB.getSession(sessionId);
            if (session) {
                setCurrentSessionId(session.id);
                // Parse provider:model format
                const [provider, modelId] = session.modelName.split(":");
                setCurrentProvider(provider as Provider);
                setCurrentModelName(modelId || session.modelName);

                // Close sidebar on mobile after selecting session
                if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                }
            }
        } catch (error) {
            console.error("Error switching session:", error);
            toast({
                title: "Error",
                description: "Failed to switch session",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <ChatSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentSessionId={currentSessionId}
                onSessionChange={handleSessionChange}
                onNewSession={handleNewSession}
                onOpenAgentMode={() => setShowAgentMode(true)}
                onOpenASSDebateMode={() => setShowASSDebateMode(true)}
                onOpenAgentCouncilMode={() => setShowAgentCouncilMode(true)}
            />
            <div className="flex-1 flex flex-col relative">
                <ChatArea
                    onMenuClick={() => setSidebarOpen(true)}
                    sessionId={currentSessionId}
                    modelName={currentModelName}
                    provider={currentProvider}
                    onOpenSettings={() => setSettingsSidebarOpen(true)}
                />
            </div>

            {/* Settings Sidebar */}
            <SettingsSidebar
                isOpen={settingsSidebarOpen}
                onClose={() => setSettingsSidebarOpen(false)}
                onOpenAgentMode={() => setShowAgentMode(true)}
                onOpenASSDebateMode={() => setShowASSDebateMode(true)}
                onOpenAgentCouncilMode={() => setShowAgentCouncilMode(true)}
            />

            {/* Agent Mode Dialog */}
            <AgentMode
                isOpen={showAgentMode}
                onClose={() => setShowAgentMode(false)}
            />

            <ASSDebateMode
                isOpen={showASSDebateMode}
                onClose={() => setShowASSDebateMode(false)}
            />

            {/* Agent Council Mode Dialog */}
            <AgentCouncilMode
                isOpen={showAgentCouncilMode}
                onClose={() => setShowAgentCouncilMode(false)}
            />

            {/* Welcome Dialog for first time users */}
            <Dialog
                open={showWelcomeDialog}
                onOpenChange={setShowWelcomeDialog}
            >
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center">
                            Welcome to ChatBotX! 🎉
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Choose your AI model to start your first
                            conversation
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <ModelSelector
                            inline={true}
                            onSelectModel={(provider, modelId) => {
                                handleNewSession(provider, modelId);
                                setShowWelcomeDialog(false);
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Index;
