import { useState, useMemo } from "react";
import {
    Save,
    FolderOpen,
    Trash2,
    Download,
    Upload,
    Search,
    Filter,
    Play,
    Clock,
    CheckCircle,
    XCircle,
    Pause,
    Tag,
    Calendar,
    MessageSquare,
    Users,
    FileText,
    Edit2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DebateSession } from "@/lib/assDebate";
import { cn } from "@/lib/utils";

interface DebateSessionManagerProps {
    sessions: DebateSession[];
    currentSession: DebateSession | null;
    onLoadSession: (session: DebateSession) => void;
    onSaveSession: (session: DebateSession, metadata: SessionMetadata) => void;
    onDeleteSession: (sessionId: string) => void;
    onContinueSession: (session: DebateSession) => void;
    onExportSessions: (sessionIds: string[]) => void;
    onImportSessions: (sessions: DebateSession[]) => void;
}

interface SessionMetadata {
    theme?: string;
    tags?: string[];
    notes?: string;
}

export const DebateSessionManager = ({
    sessions,
    currentSession,
    onLoadSession,
    onSaveSession,
    onDeleteSession,
    onContinueSession,
    onExportSessions,
    onImportSessions,
}: DebateSessionManagerProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterMode, setFilterMode] = useState<string>("all");
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
        new Set(),
    );
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [selectedSessionForDetails, setSelectedSessionForDetails] =
        useState<DebateSession | null>(null);

    // Save dialog state
    const [saveTheme, setSaveTheme] = useState("");
    const [saveTags, setSaveTags] = useState("");
    const [saveNotes, setSaveNotes] = useState("");

    const { toast } = useToast();

    // Filter and search sessions
    const filteredSessions = useMemo(() => {
        return sessions.filter((session) => {
            // Search filter
            const matchesSearch =
                searchQuery === "" ||
                session.question
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                session.theme
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                session.tags?.some((tag) =>
                    tag.toLowerCase().includes(searchQuery.toLowerCase()),
                );

            // Status filter
            const matchesStatus =
                filterStatus === "all" || session.status === filterStatus;

            // Mode filter
            const matchesMode =
                filterMode === "all" || session.mode === filterMode;

            return matchesSearch && matchesStatus && matchesMode;
        });
    }, [sessions, searchQuery, filterStatus, filterMode]);

    // Sort sessions by updated date (newest first)
    const sortedSessions = useMemo(() => {
        return [...filteredSessions].sort((a, b) => b.updatedAt - a.updatedAt);
    }, [filteredSessions]);

    const handleSaveCurrentSession = () => {
        if (!currentSession) return;

        const metadata: SessionMetadata = {
            theme: saveTheme.trim() || undefined,
            tags: saveTags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0),
            notes: saveNotes.trim() || undefined,
        };

        onSaveSession(currentSession, metadata);
        setShowSaveDialog(false);
        setSaveTheme("");
        setSaveTags("");
        setSaveNotes("");

        toast({
            title: "Sesi Tersimpan",
            description: "Sesi debat berhasil disimpan",
        });
    };

    const handleDeleteSession = (sessionId: string) => {
        setSessionToDelete(sessionId);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (sessionToDelete) {
            onDeleteSession(sessionToDelete);
            setSelectedSessions((prev) => {
                const newSet = new Set(prev);
                newSet.delete(sessionToDelete);
                return newSet;
            });
            toast({
                title: "Sesi Dihapus",
                description: "Sesi debat berhasil dihapus",
            });
        }
        setShowDeleteDialog(false);
        setSessionToDelete(null);
    };

    const handleExportSelected = () => {
        if (selectedSessions.size === 0) {
            toast({
                title: "Tidak Ada Sesi",
                description: "Pilih sesi yang ingin diekspor",
                variant: "destructive",
            });
            return;
        }
        onExportSessions(Array.from(selectedSessions));
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const imported = JSON.parse(text);
                const sessions = Array.isArray(imported)
                    ? imported
                    : [imported];
                onImportSessions(sessions);
                toast({
                    title: "Sesi Diimpor",
                    description: `${sessions.length} sesi berhasil diimpor`,
                });
            } catch (error) {
                toast({
                    title: "Error Import",
                    description: "File tidak valid",
                    variant: "destructive",
                });
            }
        };
        input.click();
    };

    const toggleSelectSession = (sessionId: string) => {
        setSelectedSessions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sessionId)) {
                newSet.delete(sessionId);
            } else {
                newSet.add(sessionId);
            }
            return newSet;
        });
    };

    const selectAllFiltered = () => {
        setSelectedSessions(new Set(sortedSessions.map((s) => s.id)));
    };

    const deselectAll = () => {
        setSelectedSessions(new Set());
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "in-progress":
                return <Clock className="h-4 w-4 text-blue-500" />;
            case "paused":
                return <Pause className="h-4 w-4 text-yellow-500" />;
            case "stopped":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-500/10 text-green-500 border-green-500/20";
            case "in-progress":
                return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "paused":
                return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "stopped":
                return "bg-red-500/10 text-red-500 border-red-500/20";
            default:
                return "";
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return "Baru saja";
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const showSessionDetails = (session: DebateSession) => {
        setSelectedSessionForDetails(session);
        setShowDetailsDialog(true);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:gap-4">
                {/* Search and Filters */}
                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari sesi debat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={filterStatus}
                            onValueChange={setFilterStatus}
                        >
                            <SelectTrigger className="flex-1 h-10 text-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="completed">
                                    Selesai
                                </SelectItem>
                                <SelectItem value="in-progress">
                                    Berjalan
                                </SelectItem>
                                <SelectItem value="paused">Dijeda</SelectItem>
                                <SelectItem value="stopped">
                                    Dihentikan
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filterMode}
                            onValueChange={setFilterMode}
                        >
                            <SelectTrigger className="flex-1 h-10 text-sm">
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="voting">Voting</SelectItem>
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                                <SelectItem value="tournament">
                                    Tournament
                                </SelectItem>
                                <SelectItem value="panel">Panel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        onClick={() => setShowSaveDialog(true)}
                        disabled={!currentSession}
                        size="sm"
                        className="w-full sm:w-auto h-10"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Simpan Sesi</span>
                        <span className="sm:hidden">Simpan</span>
                    </Button>
                    <Button
                        onClick={handleExportSelected}
                        disabled={selectedSessions.size === 0}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto h-10"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Ekspor{" "}
                        {selectedSessions.size > 0 &&
                            `(${selectedSessions.size})`}
                    </Button>
                    <Button
                        onClick={handleImport}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto h-10"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Impor
                    </Button>
                    {selectedSessions.size > 0 ? (
                        <Button
                            onClick={deselectAll}
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto h-10"
                        >
                            Batal Pilih
                        </Button>
                    ) : (
                        <Button
                            onClick={selectAllFiltered}
                            variant="ghost"
                            size="sm"
                            disabled={sortedSessions.length === 0}
                            className="w-full sm:w-auto h-10"
                        >
                            Pilih Semua
                        </Button>
                    )}
                </div>
            </div>

            {/* Sessions List */}
            <ScrollArea className="h-[500px] sm:h-[600px]">
                {sortedSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                        <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">
                            Tidak Ada Sesi
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {searchQuery ||
                            filterStatus !== "all" ||
                            filterMode !== "all"
                                ? "Tidak ada sesi yang cocok dengan filter"
                                : "Mulai debat baru untuk membuat sesi"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
                        {sortedSessions.map((session) => (
                            <Card
                                key={session.id}
                                className={cn(
                                    "transition-all hover:shadow-md cursor-pointer",
                                    selectedSessions.has(session.id) &&
                                        "ring-2 ring-primary",
                                    currentSession?.id === session.id &&
                                        "border-primary",
                                )}
                            >
                                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSessions.has(
                                                        session.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleSelectSession(
                                                            session.id,
                                                        )
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                                                />
                                                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                                    {getStatusIcon(
                                                        session.status,
                                                    )}
                                                    <CardTitle className="text-sm sm:text-base line-clamp-2 flex-1">
                                                        {session.question}
                                                    </CardTitle>
                                                </div>
                                            </div>
                                            {session.theme && (
                                                <CardDescription className="flex items-center gap-1 text-xs ml-6">
                                                    <Tag className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {session.theme}
                                                    </span>
                                                </CardDescription>
                                            )}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize text-[10px] sm:text-xs flex-shrink-0",
                                                getStatusColor(session.status),
                                            )}
                                        >
                                            {session.status === "in-progress"
                                                ? "Aktif"
                                                : session.status === "completed"
                                                  ? "Selesai"
                                                  : session.status === "paused"
                                                    ? "Jeda"
                                                    : "Stop"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                                    {/* Session Info */}
                                    <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">
                                                {formatDate(session.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 flex-shrink-0" />
                                            {session.debaters.length}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                            {session.rounds.length}
                                        </div>
                                        <div className="flex items-center gap-1 capitalize">
                                            <Filter className="h-3 w-3 flex-shrink-0" />
                                            {session.mode}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {session.tags &&
                                        session.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {session.tags
                                                    .slice(0, 3)
                                                    .map((tag, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="secondary"
                                                            className="text-[10px] sm:text-xs px-1.5 py-0"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                {session.tags.length > 3 && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] sm:text-xs px-1.5 py-0"
                                                    >
                                                        +
                                                        {session.tags.length -
                                                            3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                    {/* Winner Badge */}
                                    {session.winner && (
                                        <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-md bg-green-500/10 border border-green-500/20">
                                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                                            <span className="text-[10px] sm:text-xs font-medium text-green-500 truncate">
                                                {
                                                    session.debaters.find(
                                                        (d) =>
                                                            d.id ===
                                                            session.winner,
                                                    )?.name
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                                        <Button
                                            onClick={() =>
                                                onLoadSession(session)
                                            }
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                        >
                                            <FolderOpen className="h-3 w-3 sm:mr-1" />
                                            <span className="hidden sm:inline">
                                                Muat
                                            </span>
                                        </Button>
                                        {session.canContinue && (
                                            <Button
                                                onClick={() =>
                                                    onContinueSession(session)
                                                }
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-500 border-blue-500/20 hover:bg-blue-500/10 h-8 text-xs"
                                            >
                                                <Play className="h-3 w-3 sm:mr-1" />
                                                <span className="hidden sm:inline">
                                                    Lanjut
                                                </span>
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() =>
                                                showSessionDetails(session)
                                            }
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs"
                                        >
                                            <FileText className="h-3 w-3 sm:mr-1" />
                                            <span className="hidden sm:inline">
                                                Detail
                                            </span>
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                handleDeleteSession(session.id)
                                            }
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:bg-red-500/10 h-8 text-xs"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Save Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Simpan Sesi Debat</DialogTitle>
                        <DialogDescription>
                            Tambahkan metadata untuk sesi debat ini
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="theme">Tema (Opsional)</Label>
                            <Input
                                id="theme"
                                placeholder="contoh: Teknologi, Etika, Politik"
                                value={saveTheme}
                                onChange={(e) => setSaveTheme(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="tags">
                                Tag (Pisahkan dengan koma)
                            </Label>
                            <Input
                                id="tags"
                                placeholder="contoh: AI, Filosofi, Sains"
                                value={saveTags}
                                onChange={(e) => setSaveTags(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="notes">Catatan (Opsional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Tambahkan catatan tentang debat ini..."
                                value={saveNotes}
                                onChange={(e) => setSaveNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setShowSaveDialog(false)}
                            variant="outline"
                        >
                            Batal
                        </Button>
                        <Button onClick={handleSaveCurrentSession}>
                            <Save className="h-4 w-4 mr-2" />
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">
                            Hapus Sesi?
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Tindakan ini tidak dapat dibatalkan. Sesi akan
                            dihapus permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => setShowDeleteDialog(false)}
                            variant="outline"
                        >
                            Batal
                        </Button>
                        <Button onClick={confirmDelete} variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Session Details Dialog */}
            <Dialog
                open={showDetailsDialog}
                onOpenChange={setShowDetailsDialog}
            >
                <DialogContent className="max-w-2xl max-h-[80vh] w-[95vw] sm:w-full overflow-auto">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-base sm:text-lg">
                            Detail Sesi
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSessionForDetails && (
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <Label className="text-xs sm:text-sm text-muted-foreground">
                                    Pertanyaan
                                </Label>
                                <p className="text-sm sm:text-base font-medium mt-1">
                                    {selectedSessionForDetails.question}
                                </p>
                            </div>

                            {selectedSessionForDetails.theme && (
                                <div>
                                    <Label className="text-muted-foreground">
                                        Tema
                                    </Label>
                                    <p>{selectedSessionForDetails.theme}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">
                                        Dibuat
                                    </Label>
                                    <p>
                                        {new Date(
                                            selectedSessionForDetails.createdAt,
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">
                                        Terakhir Diperbarui
                                    </Label>
                                    <p>
                                        {new Date(
                                            selectedSessionForDetails.updatedAt,
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">
                                        Mode
                                    </Label>
                                    <p className="capitalize">
                                        {selectedSessionForDetails.mode}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">
                                        Status
                                    </Label>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "capitalize",
                                            getStatusColor(
                                                selectedSessionForDetails.status,
                                            ),
                                        )}
                                    >
                                        {selectedSessionForDetails.status}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">
                                        Ronde
                                    </Label>
                                    <p>
                                        {
                                            selectedSessionForDetails.rounds
                                                .length
                                        }
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">
                                    Debaters
                                </Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedSessionForDetails.debaters.map(
                                        (debater) => (
                                            <Badge
                                                key={debater.id}
                                                variant="secondary"
                                            >
                                                {debater.emoji} {debater.name}
                                            </Badge>
                                        ),
                                    )}
                                </div>
                            </div>

                            {selectedSessionForDetails.tags &&
                                selectedSessionForDetails.tags.length > 0 && (
                                    <div>
                                        <Label className="text-muted-foreground">
                                            Tags
                                        </Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedSessionForDetails.tags.map(
                                                (tag, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="outline"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {selectedSessionForDetails.notes && (
                                <div>
                                    <Label className="text-muted-foreground">
                                        Catatan
                                    </Label>
                                    <p className="text-sm whitespace-pre-wrap">
                                        {selectedSessionForDetails.notes}
                                    </p>
                                </div>
                            )}

                            {selectedSessionForDetails.winner && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <Label className="text-muted-foreground">
                                        Pemenang
                                    </Label>
                                    <p className="font-medium text-green-500">
                                        {
                                            selectedSessionForDetails.debaters.find(
                                                (d) =>
                                                    d.id ===
                                                    selectedSessionForDetails.winner,
                                            )?.name
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={() => setShowDetailsDialog(false)}
                            variant="outline"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
