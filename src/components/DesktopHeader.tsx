import { FileText, Settings, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DesktopHeaderProps {
    sessionTitle: string;
    ragEnabled?: boolean;
    uploadedDocumentCount?: number;
    onOpenDocuments?: () => void;
    onOpenSettings?: () => void;
    onCopyMarkdown?: () => void;
}

export const DesktopHeader = ({
    sessionTitle,
    ragEnabled = true,
    uploadedDocumentCount = 0,
    onOpenDocuments,
    onOpenSettings,
    onCopyMarkdown,
}: DesktopHeaderProps) => {
    return (
        <div className="border-b border-border px-6 py-2.5 bg-card">
            <div className="flex items-center justify-between">
                {/* Left side - Session info with RAG status */}
                <div className="flex items-center gap-3">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Session: </span>
                        <span className="text-foreground font-medium">
                            {sessionTitle}
                        </span>
                    </div>

                    {/* Compact RAG Status Indicator */}
                    {ragEnabled && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-muted-foreground">
                                RAG Active
                            </span>
                            {uploadedDocumentCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="h-4 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20"
                                >
                                    {uploadedDocumentCount} doc
                                    {uploadedDocumentCount !== 1 ? "s" : ""}
                                </Badge>
                            )}
                        </div>
                    )}

                    {!ragEnabled && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/30 border border-border/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-xs text-muted-foreground">
                                RAG Disabled
                            </span>
                        </div>
                    )}
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2">
                    {/* Copy Markdown Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCopyMarkdown}
                        className="gap-2 h-8 text-xs"
                        title="Copy chat as Markdown"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                    </Button>

                    {/* Documents Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenDocuments}
                        className="gap-2 h-8 text-xs"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Documents
                        {uploadedDocumentCount > 0 && (
                            <Badge className="h-4 px-1.5 text-[10px]">
                                {uploadedDocumentCount}
                            </Badge>
                        )}
                    </Button>

                    {/* Settings Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenSettings}
                        title="Settings (Ctrl+K)"
                        className="h-8 w-8"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
