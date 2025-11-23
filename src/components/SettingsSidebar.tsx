import { useState, useEffect } from "react";
import {
    Settings,
    X,
    FileText,
    ChevronRight,
    Zap,
    MessagesSquare,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface SettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAgentMode?: () => void;
    onOpenASSDebateMode?: () => void;
    onOpenAgentCouncilMode?: () => void;
}

export const SettingsSidebar = ({
    isOpen,
    onClose,
    onOpenAgentMode,
    onOpenASSDebateMode,
    onOpenAgentCouncilMode,
}: SettingsSidebarProps) => {
    const [ragEnabled, setRagEnabled] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem("chatbotx-settings");
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                setRagEnabled(settings.ragEnabled ?? false);
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        }
    }, []);

    // Save settings to localStorage
    const saveSettings = () => {
        const settings = {
            ragEnabled,
        };
        localStorage.setItem("chatbotx-settings", JSON.stringify(settings));
    };

    useEffect(() => {
        saveSettings();
    }, [ragEnabled]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Settings</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Special Features */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Special Features
                                </h3>

                                {/* Agent Mode Button */}
                                <Button
                                    onClick={() => {
                                        onOpenAgentMode?.();
                                        onClose();
                                    }}
                                    className="w-full justify-start gap-3 h-auto py-4 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md hover:shadow-lg transition-all"
                                    size="lg"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                                        <Zap className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold">
                                            Agent Mode
                                        </div>
                                        <div className="text-xs opacity-90">
                                            Multi-model comparison
                                        </div>
                                    </div>
                                </Button>

                                {/* ASS Debate Mode Button */}
                                <Button
                                    onClick={() => {
                                        onOpenASSDebateMode?.();
                                        onClose();
                                    }}
                                    className="w-full justify-start gap-3 h-auto py-4 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                                    size="lg"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                                        <MessagesSquare className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold">
                                            ASS Debate Mode
                                        </div>
                                        <div className="text-xs opacity-90">
                                            Multi-perspective debates
                                        </div>
                                    </div>
                                </Button>

                                {/* Agent Council Mode Button */}
                                <Button
                                    onClick={() => {
                                        onOpenAgentCouncilMode?.();
                                        onClose();
                                    }}
                                    className="w-full justify-start gap-3 h-auto py-4 bg-gradient-to-br from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 shadow-md hover:shadow-lg transition-all"
                                    size="lg"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold">
                                            Agent Council Mode
                                        </div>
                                        <div className="text-xs opacity-90">
                                            3-stage LLM collaboration
                                        </div>
                                    </div>
                                </Button>
                            </div>

                            <Separator />

                            {/* RAG Settings */}
                            <Accordion
                                type="single"
                                collapsible
                                defaultValue="rag"
                            >
                                <AccordionItem
                                    value="rag"
                                    className="border rounded-lg px-4"
                                >
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="font-medium">
                                                Document RAG
                                                (Retrieval-Augmented Generation)
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 pb-2">
                                        <div className="space-y-4">
                                            {/* Enable RAG */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="rag-enabled">
                                                        Enable Document RAG
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Allow AI to use uploaded
                                                        documents as context
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="rag-enabled"
                                                    checked={ragEnabled}
                                                    onCheckedChange={
                                                        setRagEnabled
                                                    }
                                                />
                                            </div>

                                            <Separator />

                                            {/* RAG Info */}
                                            <div className="space-y-2 text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">
                                                    How it works:
                                                </p>
                                                <ul className="space-y-1 list-disc list-inside text-xs">
                                                    <li>
                                                        Upload documents (TXT,
                                                        MD, JSON, HTML, CSV)
                                                    </li>
                                                    <li>
                                                        AI uses document content
                                                        to answer questions
                                                    </li>
                                                    <li>
                                                        Get accurate answers
                                                        based on your files
                                                    </li>
                                                    <li>
                                                        Per-chat RAG can be
                                                        toggled in chat menu
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* Supported Formats */}
                                            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                                <p className="text-xs font-medium">
                                                    Supported Formats:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-xs px-2 py-1 bg-background rounded border">
                                                        TXT
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-background rounded border">
                                                        MD
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-background rounded border">
                                                        JSON
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-background rounded border">
                                                        HTML
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-background rounded border">
                                                        CSV
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    PDF & DOCX support coming
                                                    soon
                                                </p>
                                            </div>

                                            {/* Usage Tips */}
                                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                                                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                    💡 Tips:
                                                </p>
                                                <ul className="space-y-1 text-xs text-muted-foreground">
                                                    <li>
                                                        • Upload relevant
                                                        documents before asking
                                                        questions
                                                    </li>
                                                    <li>
                                                        • Use clear,
                                                        well-formatted documents
                                                        for best results
                                                    </li>
                                                    <li>
                                                        • Max file size: 5MB per
                                                        file
                                                    </li>
                                                    <li>
                                                        • Documents are stored
                                                        per-chat session
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {/* About */}
                            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <ChevronRight className="h-4 w-4" />
                                    <span>About RAG</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    RAG (Retrieval-Augmented Generation)
                                    enhances AI responses by providing relevant
                                    document context. Upload your documents and
                                    the AI will use them to give more accurate,
                                    contextual answers specific to your content.
                                </p>
                            </div>

                            {/* Keyboard Shortcuts */}
                            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                                <p className="text-sm font-medium">
                                    Keyboard Shortcuts
                                </p>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Open Settings</span>
                                        <kbd className="px-2 py-0.5 bg-background border rounded">
                                            Ctrl + K
                                        </kbd>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Upload Document</span>
                                        <kbd className="px-2 py-0.5 bg-background border rounded">
                                            Click 📎
                                        </kbd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <Button onClick={onClose} className="w-full">
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
