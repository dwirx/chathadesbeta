import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RAGIndicatorProps {
    isEnabled: boolean;
    documentCount?: number;
}

export const RAGIndicator = ({
    isEnabled,
    documentCount = 0,
}: RAGIndicatorProps) => {
    if (!isEnabled || documentCount === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Badge
                variant="secondary"
                className="flex items-center gap-1.5 text-xs"
            >
                <FileText className="h-3 w-3" />
                <span>
                    {documentCount}{" "}
                    {documentCount === 1 ? "document" : "documents"}
                </span>
            </Badge>
        </div>
    );
};
