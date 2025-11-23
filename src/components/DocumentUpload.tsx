import { useState, useRef, useCallback } from "react";
import {
    Upload,
    X,
    File,
    FileText,
    CheckCircle2,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    extractTextFromFile,
    validateFile,
    formatFileSize,
    ProcessedDocument,
} from "@/lib/documentProcessor";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
    onDocumentsProcessed?: (docs: ProcessedDocument[]) => void;
    isOpen?: boolean;
    onClose?: () => void;
    onDocumentsChange?: (docs: ProcessedDocument[]) => void;
    documents?: ProcessedDocument[];
}

export const DocumentUpload = ({
    onDocumentsProcessed,
    isOpen,
    onClose,
    onDocumentsChange,
    documents = [],
}: DocumentUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            await processFiles(files);
        },
        [documents],
    );

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            await processFiles(files);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [documents, onDocumentsProcessed],
    );

    const processFiles = async (files: File[]) => {
        if (files.length === 0) return;

        setIsProcessing(true);
        const newDocs: ProcessedDocument[] = [];

        for (const file of files) {
            try {
                // Validate file
                const validation = validateFile(file);
                if (!validation.valid) {
                    toast({
                        title: "Invalid File",
                        description: `${file.name}: ${validation.error}`,
                        variant: "destructive",
                    });
                    continue;
                }

                // Extract text
                const processedDoc = await extractTextFromFile(file);
                newDocs.push(processedDoc);

                toast({
                    title: "Document Uploaded",
                    description: `${file.name} processed successfully`,
                });
            } catch (error) {
                console.error("Error processing file:", error);
                toast({
                    title: "Processing Error",
                    description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
                    variant: "destructive",
                });
            }
        }

        // Add new documents
        if (onDocumentsChange) {
            onDocumentsChange([...documents, ...newDocs]);
        }
        if (onDocumentsProcessed) {
            onDocumentsProcessed(newDocs);
        }
        setIsProcessing(false);
    };

    const handleRemoveDocument = (docId: string) => {
        const updatedDocs = documents.filter((doc) => doc.id !== docId);
        if (onDocumentsChange) {
            onDocumentsChange(updatedDocs);
        }

        toast({
            title: "Document Removed",
            description: "Document removed from context",
        });
    };

    const handleClearAll = () => {
        if (onDocumentsChange) {
            onDocumentsChange([]);
        }
        toast({
            title: "All Documents Removed",
            description: "Document context cleared",
        });
    };

    // Simple inline version for onDocumentsProcessed prop
    if (onDocumentsProcessed && !isOpen) {
        return (
            <div className="w-full">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer hover:border-primary/50 hover:bg-accent/50 ${
                        isDragging
                            ? "border-primary bg-primary/10"
                            : "border-border"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.md,.json,.html,.csv,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <Upload
                        className={`w-12 h-12 mx-auto mb-3 ${
                            isDragging
                                ? "text-primary"
                                : "text-muted-foreground"
                        }`}
                    />

                    {isProcessing ? (
                        <div className="space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                            <p className="text-sm font-medium">
                                Processing files...
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium mb-1">
                                {isDragging
                                    ? "Drop files here"
                                    : "Click or drag files to upload"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supports: PDF, DOC, DOCX, TXT, MD, JSON, HTML,
                                CSV (Max 10MB)
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Upload Documents
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {documents.length} document
                                    {documents.length !== 1 ? "s" : ""} loaded
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full hover:bg-accent"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {/* Upload Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer hover:border-primary/50 hover:bg-accent/50 ${
                                    isDragging
                                        ? "border-primary bg-primary/10"
                                        : "border-border"
                                }`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".txt,.md,.json,.html,.csv,.pdf,.doc,.docx"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                <Upload
                                    className={`w-12 h-12 mx-auto mb-3 ${
                                        isDragging
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    }`}
                                />

                                {isProcessing ? (
                                    <div className="space-y-2">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                        <p className="text-sm font-medium">
                                            Processing files...
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium mb-1">
                                            {isDragging
                                                ? "Drop files here"
                                                : "Click or drag files to upload"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Supports: PDF, DOC, DOCX, TXT, MD,
                                            JSON, HTML, CSV (Max 10MB)
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Info */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                        <p className="font-medium mb-1">
                                            How Document RAG Works:
                                        </p>
                                        <ul className="space-y-0.5 list-disc list-inside">
                                            <li>Upload your documents</li>
                                            <li>
                                                AI uses them to answer questions
                                            </li>
                                            <li>
                                                Documents are processed locally
                                                in your browser
                                            </li>
                                            <li>
                                                Get accurate answers based on
                                                your content
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Documents List */}
                            {documents.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">
                                            Uploaded Documents
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearAll}
                                            className="text-xs h-7"
                                        >
                                            Clear All
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="group p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded bg-primary/10 flex-shrink-0">
                                                        <FileText className="w-4 h-4 text-primary" />
                                                    </div>

                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">
                                                                    {doc.filename ||
                                                                        doc.id}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        {doc.type
                                                                            .split(
                                                                                "/",
                                                                            )[1]
                                                                            ?.toUpperCase() ||
                                                                            "TXT"}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {formatFileSize(
                                                                            doc.size,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleRemoveDocument(
                                                                        doc.id,
                                                                    )
                                                                }
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>

                                                        {doc.chunks && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                                <span>
                                                                    {
                                                                        doc
                                                                            .chunks
                                                                            .length
                                                                    }{" "}
                                                                    chunks
                                                                    processed
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Preview */}
                                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                            {doc.content.substring(
                                                                0,
                                                                100,
                                                            )}
                                                            ...
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {documents.length === 0 && !isProcessing && (
                                <div className="text-center py-8">
                                    <File className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                    <p className="text-sm text-muted-foreground">
                                        No documents uploaded yet
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Upload documents to enhance AI responses
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground text-center">
                            Documents are processed locally and included in your
                            chat context
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
