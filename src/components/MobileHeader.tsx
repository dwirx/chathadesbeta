import { Menu, FileText, Settings, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileHeaderProps {
    onMenuClick: () => void;
    sessionTitle: string;
    ragEnabled?: boolean;
    uploadedDocumentCount?: number;
    onOpenDocuments?: () => void;
    onOpenSettings?: () => void;
    onCopyMarkdown?: () => void;
}

export const MobileHeader = ({
    onMenuClick,
    sessionTitle,
    ragEnabled = true,
    uploadedDocumentCount = 0,
    onOpenDocuments,
    onOpenSettings,
    onCopyMarkdown,
}: MobileHeaderProps) => {
    return (
        <div className="border-b border-border bg-card">
            {/* Compact single row header */}
            <div className="px-3 py-2 flex items-center justify-between gap-2">
                {/* Left: Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="h-8 w-8 flex-shrink-0"
                >
                    <Menu className="h-4 w-4" />
                </Button>

                {/* Center: Session Title with RAG indicator */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="text-xs font-medium text-foreground truncate">
                        {sessionTitle}
                    </p>
                    {/* Compact RAG Status */}
                    {ragEnabled && uploadedDocumentCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px] flex-shrink-0 bg-primary/10 text-primary border-primary/20"
                        >
                            RAG
                        </Badge>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Copy Markdown Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCopyMarkdown}
                        className="h-8 w-8"
                        title="Copy as Markdown"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>

                    {/* Documents Button with counter badge */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenDocuments}
                        className="h-8 w-8 relative"
                        title="Documents"
                    >
                        <FileText className="h-4 w-4" />
                        {uploadedDocumentCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 flex items-center justify-center text-[9px] bg-primary text-primary-foreground rounded-full font-semibold">
                                {uploadedDocumentCount > 9
                                    ? "9+"
                                    : uploadedDocumentCount}
                            </span>
                        )}
                    </Button>

                    {/* Settings Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenSettings}
                        className="h-8 w-8"
                        title="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Optional: Minimal status bar only when RAG active with documents */}
            {ragEnabled && uploadedDocumentCount > 0 && (
                <div className="px-3 pb-2 pt-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span>
                            {uploadedDocumentCount} document
                            {uploadedDocumentCount !== 1 ? "s" : ""} loaded
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
