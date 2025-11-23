import { useMemo } from "react";
import {
    BarChart3,
    TrendingUp,
    Users,
    MessageSquare,
    Award,
    Target,
    Zap,
    GitBranch,
    PieChart,
    Activity,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebateSession, Debater, DebateRound } from "@/lib/assDebate";
import { cn } from "@/lib/utils";

interface DebateAnalyticsProps {
    session: DebateSession;
}

interface DebaterStats {
    debater: Debater;
    argumentCount: number;
    averageLength: number;
    votesReceived: number;
    rankingsSum: number;
    beliefChange: number;
    consistency: number;
    influence: number;
}

interface RoundAnalytics {
    round: number;
    type: string;
    totalArguments: number;
    averageLength: number;
    consensusProgress: number;
    emotionalTone: "positive" | "negative" | "neutral";
}

export const DebateAnalytics = ({ session }: DebateAnalyticsProps) => {
    // Calculate debater statistics
    const debaterStats = useMemo<DebaterStats[]>(() => {
        return session.debaters.map((debater) => {
            const debaterArguments = session.rounds.flatMap((r) =>
                r.arguments.filter((a) => a.debaterId === debater.id),
            );

            const argumentCount = debaterArguments.length;
            const averageLength =
                argumentCount > 0
                    ? debaterArguments.reduce(
                          (sum, arg) => sum + arg.content.length,
                          0,
                      ) / argumentCount
                    : 0;

            // Count votes received
            let votesReceived = 0;
            let rankingsSum = 0;
            session.rounds.forEach((round) => {
                round.votes?.forEach((vote) => {
                    const rank = vote.rankings.indexOf(debater.id);
                    if (rank !== -1) {
                        votesReceived++;
                        rankingsSum += session.debaters.length - rank;
                    }
                });
            });

            // Calculate belief change
            const beliefChanges = debaterArguments
                .map((a) => a.beliefUpdate)
                .filter((b) => b !== undefined) as number[];
            const beliefChange =
                beliefChanges.length > 0
                    ? Math.abs(
                          beliefChanges[beliefChanges.length - 1] -
                              beliefChanges[0],
                      )
                    : 0;

            // Calculate consistency (lower variance in argument length = higher consistency)
            const lengths = debaterArguments.map((a) => a.content.length);
            const variance =
                lengths.length > 1
                    ? lengths.reduce(
                          (sum, len) => sum + Math.pow(len - averageLength, 2),
                          0,
                      ) / lengths.length
                    : 0;
            const consistency = Math.max(0, 100 - Math.sqrt(variance) / 10);

            // Calculate influence (based on how much other debaters reference them)
            let influence = 0;
            const debaterName = debater.name.toLowerCase();
            session.rounds.forEach((round) => {
                round.arguments.forEach((arg) => {
                    if (
                        arg.debaterId !== debater.id &&
                        arg.content.toLowerCase().includes(debaterName)
                    ) {
                        influence++;
                    }
                });
            });

            return {
                debater,
                argumentCount,
                averageLength,
                votesReceived,
                rankingsSum,
                beliefChange,
                consistency,
                influence,
            };
        });
    }, [session]);

    // Sort debaters by performance
    const rankedDebaters = useMemo(() => {
        return [...debaterStats].sort((a, b) => {
            // Composite score: rankings + consistency + influence
            const scoreA = a.rankingsSum * 10 + a.consistency + a.influence * 5;
            const scoreB = b.rankingsSum * 10 + b.consistency + b.influence * 5;
            return scoreB - scoreA;
        });
    }, [debaterStats]);

    // Calculate round analytics
    const roundAnalytics = useMemo<RoundAnalytics[]>(() => {
        return session.rounds.map((round, index) => {
            const totalArguments = round.arguments.length;
            const averageLength =
                totalArguments > 0
                    ? round.arguments.reduce(
                          (sum, arg) => sum + arg.content.length,
                          0,
                      ) / totalArguments
                    : 0;

            // Estimate consensus progress based on vote agreement
            let consensusProgress = 0;
            if (round.votes && round.votes.length > 1) {
                const firstChoices = round.votes.map((v) => v.rankings[0]);
                const mostCommon = firstChoices.reduce(
                    (acc, choice) => {
                        acc[choice] = (acc[choice] || 0) + 1;
                        return acc;
                    },
                    {} as Record<string, number>,
                );
                const maxVotes = Math.max(...Object.values(mostCommon));
                consensusProgress = (maxVotes / round.votes.length) * 100;
            }

            // Simple emotional tone detection
            const allText = round.arguments
                .map((a) => a.content.toLowerCase())
                .join(" ");
            const positiveWords = [
                "agree",
                "excellent",
                "correct",
                "support",
                "beneficial",
                "good",
            ];
            const negativeWords = [
                "disagree",
                "wrong",
                "problematic",
                "concern",
                "risk",
                "bad",
            ];

            const positiveCount = positiveWords.reduce(
                (sum, word) =>
                    sum + (allText.match(new RegExp(word, "g"))?.length || 0),
                0,
            );
            const negativeCount = negativeWords.reduce(
                (sum, word) =>
                    sum + (allText.match(new RegExp(word, "g"))?.length || 0),
                0,
            );

            const emotionalTone =
                positiveCount > negativeCount
                    ? "positive"
                    : negativeCount > positiveCount
                      ? "negative"
                      : "neutral";

            return {
                round: index,
                type: round.type,
                totalArguments,
                averageLength,
                consensusProgress,
                emotionalTone,
            };
        });
    }, [session.rounds]);

    // Overall session statistics
    const overallStats = useMemo(() => {
        const totalArguments = session.rounds.reduce(
            (sum, r) => sum + r.arguments.length,
            0,
        );
        const totalWords = session.rounds.reduce(
            (sum, r) =>
                sum +
                r.arguments.reduce(
                    (s, a) => s + a.content.split(/\s+/).length,
                    0,
                ),
            0,
        );
        const averageWordsPerArgument =
            totalArguments > 0 ? Math.round(totalWords / totalArguments) : 0;

        const totalVotes = session.rounds.reduce(
            (sum, r) => sum + (r.votes?.length || 0),
            0,
        );

        const consensusReached = session.rounds.some((r) => r.consensusReached);

        const activePeriod =
            session.rounds.length > 0
                ? session.rounds[session.rounds.length - 1].arguments[0]
                      ?.timestamp - session.rounds[0].arguments[0]?.timestamp
                : 0;

        return {
            totalRounds: session.rounds.length,
            totalArguments,
            totalWords,
            averageWordsPerArgument,
            totalVotes,
            consensusReached,
            activePeriodMinutes: Math.round(activePeriod / 60000),
        };
    }, [session]);

    // Character color mapping
    const characterColors: Record<string, string> = {
        optimist: "#fbbf24",
        skeptic: "#3b82f6",
        visionary: "#a855f7",
        critic: "#ef4444",
        scientist: "#06b6d4",
        artist: "#ec4899",
        philosopher: "#8b5cf6",
        pragmatist: "#10b981",
    };

    // Tree visualization data
    interface DebateTreeNode {
        id: string;
        type: string;
        arguments: Array<{
            debater: string;
            emoji: string;
            preview: string;
            beliefUpdate?: number;
        }>;
        votes: number;
        consensus: boolean;
    }

    const debateTree = useMemo<DebateTreeNode[]>(() => {
        const tree: DebateTreeNode[] = [];
        session.rounds.forEach((round, roundIdx) => {
            const node: DebateTreeNode = {
                id: `round-${roundIdx}`,
                type: round.type,
                arguments: round.arguments.map((arg) => {
                    const debater = session.debaters.find(
                        (d) => d.id === arg.debaterId,
                    );
                    return {
                        debater: debater?.name || "Unknown",
                        emoji: debater?.emoji || "🤖",
                        preview: arg.content.substring(0, 100) + "...",
                        beliefUpdate: arg.beliefUpdate,
                    };
                }),
                votes: round.votes?.length || 0,
                consensus: round.consensusReached || false,
            };
            tree.push(node);
        });
        return tree;
    }, [session]);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                    <TabsTrigger
                        value="overview"
                        className="text-xs sm:text-sm py-2"
                    >
                        <span className="hidden sm:inline">Overview</span>
                        <span className="sm:hidden">Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="debaters"
                        className="text-xs sm:text-sm py-2"
                    >
                        <span className="hidden sm:inline">Debaters</span>
                        <span className="sm:hidden">Rank</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="rounds"
                        className="text-xs sm:text-sm py-2"
                    >
                        Rounds
                    </TabsTrigger>
                    <TabsTrigger
                        value="tree"
                        className="text-xs sm:text-sm py-2"
                    >
                        Tree
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent
                    value="overview"
                    className="space-y-3 sm:space-y-4 mt-3 sm:mt-4"
                >
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Ronde
                                </CardTitle>
                                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6 pt-0">
                                <div className="text-xl sm:text-2xl font-bold">
                                    {overallStats.totalRounds}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Argumen
                                </CardTitle>
                                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6 pt-0">
                                <div className="text-xl sm:text-2xl font-bold">
                                    {overallStats.totalArguments}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Avg Kata
                                </CardTitle>
                                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6 pt-0">
                                <div className="text-xl sm:text-2xl font-bold">
                                    {overallStats.averageWordsPerArgument}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Voting
                                </CardTitle>
                                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6 pt-0">
                                <div className="text-xl sm:text-2xl font-bold">
                                    {overallStats.totalVotes}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Consensus Status */}
                    <Card>
                        <CardHeader className="p-3 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                                Status Konsensus
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Progress
                                    </span>
                                    <Badge
                                        variant={
                                            overallStats.consensusReached
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {overallStats.consensusReached
                                            ? "Tercapai"
                                            : "Belum Tercapai"}
                                    </Badge>
                                </div>
                                <Progress
                                    value={
                                        overallStats.consensusReached
                                            ? 100
                                            : (session.rounds.length /
                                                  session.maxIterations) *
                                              100
                                    }
                                    className="h-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {overallStats.consensusReached
                                        ? `Konsensus tercapai pada ronde ${session.rounds.findIndex((r) => r.consensusReached) + 1}`
                                        : `${session.rounds.length} / ${session.maxIterations} ronde selesai`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session Info */}
                    <Card>
                        <CardHeader className="p-3 sm:p-6">
                            <CardTitle className="text-sm sm:text-base">
                                Informasi Sesi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Mode Debat
                                </span>
                                <span className="text-sm font-medium capitalize">
                                    {session.mode}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Sistem Voting
                                </span>
                                <span className="text-sm font-medium capitalize">
                                    {session.votingSystem}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Threshold Konsensus
                                </span>
                                <span className="text-sm font-medium">
                                    {Math.round(
                                        session.consensusThreshold * 100,
                                    )}
                                    %
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Jumlah Debater
                                </span>
                                <span className="text-sm font-medium">
                                    {session.debaters.length}
                                </span>
                            </div>
                            {overallStats.activePeriodMinutes > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Durasi Aktif
                                    </span>
                                    <span className="text-sm font-medium">
                                        {overallStats.activePeriodMinutes} menit
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Debaters Tab */}
                <TabsContent
                    value="debaters"
                    className="space-y-3 sm:space-y-4 mt-3 sm:mt-4"
                >
                    <Card>
                        <CardHeader className="p-3 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                                Peringkat Debater
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Berdasarkan voting, konsistensi, dan pengaruh
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            <ScrollArea className="h-[400px] sm:h-[500px]">
                                <div className="space-y-2 sm:space-y-4">
                                    {rankedDebaters.map((stats, index) => (
                                        <Card
                                            key={stats.debater.id}
                                            className={cn(
                                                "transition-all",
                                                index === 0 &&
                                                    "ring-2 ring-yellow-500 bg-yellow-500/5",
                                            )}
                                        >
                                            <CardContent className="p-3 sm:p-6">
                                                <div className="space-y-3 sm:space-y-4">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                                            <div className="text-2xl sm:text-3xl flex-shrink-0">
                                                                {index === 0
                                                                    ? "🏆"
                                                                    : index ===
                                                                        1
                                                                      ? "🥈"
                                                                      : index ===
                                                                          2
                                                                        ? "🥉"
                                                                        : `#${index + 1}`}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                                    <span className="text-base sm:text-lg flex-shrink-0">
                                                                        {
                                                                            stats
                                                                                .debater
                                                                                .emoji
                                                                        }
                                                                    </span>
                                                                    <span className="font-semibold text-sm sm:text-base truncate">
                                                                        {
                                                                            stats
                                                                                .debater
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                                                                    {
                                                                        stats
                                                                            .debater
                                                                            .personalityType
                                                                    }{" "}
                                                                    •{" "}
                                                                    {
                                                                        stats
                                                                            .debater
                                                                            .provider
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground text-[10px] sm:text-xs">
                                                                Argumen
                                                            </div>
                                                            <div className="font-medium text-xs sm:text-sm">
                                                                {
                                                                    stats.argumentCount
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground text-[10px] sm:text-xs">
                                                                Vote
                                                            </div>
                                                            <div className="font-medium text-xs sm:text-sm">
                                                                {
                                                                    stats.votesReceived
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground text-[10px] sm:text-xs">
                                                                Pengaruh
                                                            </div>
                                                            <div className="font-medium text-xs sm:text-sm">
                                                                {
                                                                    stats.influence
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground text-[10px] sm:text-xs">
                                                                Ranking
                                                            </div>
                                                            <div className="font-medium text-xs sm:text-sm">
                                                                {
                                                                    stats.rankingsSum
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 sm:space-y-2">
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-muted-foreground">
                                                                    Konsistensi
                                                                </span>
                                                                <span className="font-medium">
                                                                    {Math.round(
                                                                        stats.consistency,
                                                                    )}
                                                                    %
                                                                </span>
                                                            </div>
                                                            <Progress
                                                                value={
                                                                    stats.consistency
                                                                }
                                                                className="h-2"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-muted-foreground">
                                                                    Perubahan
                                                                    Keyakinan
                                                                </span>
                                                                <span className="font-medium">
                                                                    {Math.round(
                                                                        stats.beliefChange *
                                                                            100,
                                                                    )}
                                                                    %
                                                                </span>
                                                            </div>
                                                            <Progress
                                                                value={
                                                                    stats.beliefChange *
                                                                    100
                                                                }
                                                                className="h-2"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Rounds Tab */}
                <TabsContent
                    value="rounds"
                    className="space-y-3 sm:space-y-4 mt-3 sm:mt-4"
                >
                    <Card>
                        <CardHeader className="p-3 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                                Analisis Per Ronde
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            <ScrollArea className="h-[400px] sm:h-[500px]">
                                <div className="space-y-2 sm:space-y-4 pr-2 sm:pr-4">
                                    {roundAnalytics.map((analytics) => (
                                        <Card
                                            key={analytics.round}
                                            className="border-l-4"
                                            style={{
                                                borderLeftColor:
                                                    analytics.emotionalTone ===
                                                    "positive"
                                                        ? "#10b981"
                                                        : analytics.emotionalTone ===
                                                            "negative"
                                                          ? "#ef4444"
                                                          : "#6b7280",
                                            }}
                                        >
                                            <CardHeader className="p-3 sm:p-6">
                                                <div className="flex items-center justify-between gap-2">
                                                    <CardTitle className="text-sm sm:text-base">
                                                        Ronde{" "}
                                                        {analytics.round + 1}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className="capitalize text-[10px] sm:text-xs flex-shrink-0"
                                                    >
                                                        {analytics.type}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                                                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                                                    <div>
                                                        <div className="text-muted-foreground text-[10px] sm:text-xs">
                                                            Argumen
                                                        </div>
                                                        <div className="font-medium text-xs sm:text-sm">
                                                            {
                                                                analytics.totalArguments
                                                            }
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted-foreground text-[10px] sm:text-xs">
                                                            Avg
                                                        </div>
                                                        <div className="font-medium text-xs sm:text-sm">
                                                            {Math.round(
                                                                analytics.averageLength,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted-foreground text-[10px] sm:text-xs">
                                                            Tone
                                                        </div>
                                                        <div className="font-medium capitalize text-xs sm:text-sm">
                                                            {analytics.emotionalTone ===
                                                            "positive"
                                                                ? "➕"
                                                                : analytics.emotionalTone ===
                                                                    "negative"
                                                                  ? "➖"
                                                                  : "⚪"}
                                                        </div>
                                                    </div>
                                                </div>

                                                {analytics.consensusProgress >
                                                    0 && (
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-muted-foreground">
                                                                Progress
                                                                Konsensus
                                                            </span>
                                                            <span className="font-medium">
                                                                {Math.round(
                                                                    analytics.consensusProgress,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                analytics.consensusProgress
                                                            }
                                                            className="h-2"
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tree Tab */}
                <TabsContent
                    value="tree"
                    className="space-y-3 sm:space-y-4 mt-3 sm:mt-4"
                >
                    <Card>
                        <CardHeader className="p-3 sm:p-6">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <GitBranch className="h-4 w-4 sm:h-5 sm:w-5" />
                                Pohon Debat
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Visualisasi alur debat dari awal hingga akhir
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            <ScrollArea className="h-[500px] sm:h-[600px]">
                                <div className="relative pl-6 sm:pl-8">
                                    {/* Vertical Line */}
                                    <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-border" />

                                    <div className="space-y-6 sm:space-y-8">
                                        {debateTree.map((node, index) => (
                                            <div
                                                key={node.id}
                                                className="relative"
                                            >
                                                {/* Node Circle */}
                                                <div
                                                    className={cn(
                                                        "absolute -left-[18px] sm:-left-[26px] w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 sm:border-4 border-background z-10",
                                                        node.consensus
                                                            ? "bg-green-500"
                                                            : "bg-primary",
                                                    )}
                                                />

                                                {/* Node Content */}
                                                <Card>
                                                    <CardHeader className="p-3 sm:p-6">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <CardTitle className="text-xs sm:text-sm">
                                                                Ronde{" "}
                                                                {index + 1}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="capitalize text-[10px] sm:text-xs"
                                                                >
                                                                    {node.type}
                                                                </Badge>
                                                                {node.consensus && (
                                                                    <Badge className="bg-green-500 text-[10px] sm:text-xs">
                                                                        Konsensus
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                                                        {/* Arguments in this round */}
                                                        {node.arguments.map(
                                                            (
                                                                arg,
                                                                argIdx: number,
                                                            ) => (
                                                                <div
                                                                    key={argIdx}
                                                                    className="p-2 sm:p-3 rounded-lg bg-muted/50 border space-y-1.5 sm:space-y-2"
                                                                >
                                                                    <div className="flex items-start gap-1.5 sm:gap-2">
                                                                        <span className="text-base sm:text-lg flex-shrink-0">
                                                                            {
                                                                                arg.emoji
                                                                            }
                                                                        </span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-medium text-xs sm:text-sm">
                                                                                {
                                                                                    arg.debater
                                                                                }
                                                                            </div>
                                                                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                                {
                                                                                    arg.preview
                                                                                }
                                                                            </p>
                                                                            {arg.beliefUpdate !==
                                                                                undefined && (
                                                                                <div className="mt-1.5 sm:mt-2">
                                                                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                                                                                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                                                        <span className="text-muted-foreground">
                                                                                            Keyakinan:
                                                                                        </span>
                                                                                        <span className="font-medium">
                                                                                            {Math.round(
                                                                                                arg.beliefUpdate *
                                                                                                    100,
                                                                                            )}

                                                                                            %
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}

                                                        {/* Vote count */}
                                                        {node.votes > 0 && (
                                                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground pt-2 border-t">
                                                                <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                                {node.votes}{" "}
                                                                vote dilakukan
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ))}

                                        {/* End Node */}
                                        {session.winner && (
                                            <div className="relative">
                                                <div className="absolute -left-[18px] sm:-left-[26px] w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 sm:border-4 border-background bg-yellow-500 z-10" />
                                                <Card className="bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20">
                                                    <CardContent className="p-3 sm:p-6">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-sm sm:text-base">
                                                                    Pemenang
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                                                    {
                                                                        session.debaters.find(
                                                                            (
                                                                                d,
                                                                            ) =>
                                                                                d.id ===
                                                                                session.winner,
                                                                        )?.name
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
