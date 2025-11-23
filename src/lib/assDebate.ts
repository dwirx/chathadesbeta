// ASS (Argumentative System Service) - AI Debate System
import { Provider } from "./aiApi";

export type PersonalityType =
    | "optimist"
    | "skeptic"
    | "visionary"
    | "critic"
    | "scientist"
    | "artist"
    | "philosopher"
    | "pragmatist";
export type DebateFormat =
    | "voting"
    | "classic"
    | "tournament"
    | "team"
    | "panel";
export type VotingSystem = "ranked" | "approval" | "condorcet" | "borda";

export interface Debater {
    id: string;
    name: string;
    emoji: string;
    provider: Provider;
    modelId: string;
    personalityType: PersonalityType;
    traits: {
        perspective: string;
        personality: string;
        beliefPersistence: number; // 0-1, how resistant to changing mind
        reasoningDepth: number; // 0-1, how deep they analyze
        truthSeeking: number; // 0-1, how much they prioritize truth over argument
    };
    internalBelief?: number; // 0-1, private belief about truth
    teamId?: string; // For team debates
    expertise?: string[]; // Areas of expertise
}

export interface DebateVote {
    voterId: string;
    rankings: string[]; // Ordered list of debater IDs
}

export interface DebateRound {
    round: number;
    type: "opening" | "argument" | "rebuttal" | "voting" | "judge";
    arguments: DebateArgument[];
    votes?: DebateVote[];
    consensusReached?: boolean;
}

export interface DebateArgument {
    debaterId: string;
    content: string;
    timestamp: number;
    beliefUpdate?: number; // New belief after this argument
}

export interface DebateSession {
    id: string;
    question: string;
    theme?: string; // Optional theme/category for the debate
    mode: DebateFormat;
    votingSystem: VotingSystem;
    debaters: Debater[];
    rounds: DebateRound[];
    consensusThreshold: number; // 0-1, percentage agreement needed
    maxIterations: number;
    finalDecision?: string;
    winner?: string;
    teams?: DebateTeam[]; // For team debates
    bracket?: TournamentBracket; // For tournament mode
    analytics?: DebateAnalytics;
    // Session metadata
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
    status: "in-progress" | "completed" | "paused" | "stopped";
    tags?: string[]; // User-defined tags
    notes?: string; // User notes about the debate
    canContinue?: boolean; // Whether the debate can be resumed
}

export interface DebateTeam {
    id: string;
    name: string;
    color: string;
    memberIds: string[];
}

export interface TournamentBracket {
    rounds: TournamentRound[];
    currentRound: number;
}

export interface TournamentRound {
    roundNumber: number;
    matches: TournamentMatch[];
}

export interface TournamentMatch {
    id: string;
    debater1Id: string;
    debater2Id: string;
    winnerId?: string;
    debate?: DebateSession;
}

export interface DebateAnalytics {
    participationRate: Record<string, number>; // debaterId -> message count
    argumentQuality: Record<string, number>; // debaterId -> quality score 0-1
    beliefChangeRate: Record<string, number>; // debaterId -> how much belief changed
    consensusPattern: ConsensusPattern[];
    keyArguments: ExtractedArgument[];
    debateTree: DebateNode;
}

export interface ConsensusPattern {
    round: number;
    agreementLevel: number;
    leadingPosition: string;
    polarization: number; // 0-1, how divided opinions are
}

export interface ExtractedArgument {
    debaterId: string;
    content: string;
    type: "claim" | "evidence" | "rebuttal" | "concession";
    strength: number; // 0-1
    references: string[]; // IDs of arguments this responds to
}

export interface DebateNode {
    id: string;
    debaterId: string;
    content: string;
    children: DebateNode[];
    agreementScore: number;
    impact: number; // How much this influenced the debate
}

// Predefined Debater Personalities
export const PRESET_DEBATERS: Record<PersonalityType, Omit<Debater, "id">> = {
    optimist: {
        name: "Optimist",
        emoji: "🌟",
        provider: "poe",
        modelId: "GPT-5-mini",
        personalityType: "optimist",
        traits: {
            perspective: "Sees possibilities everywhere",
            personality: "Creative, big-picture, opportunity-focused",
            beliefPersistence: 0.4,
            reasoningDepth: 0.7,
            truthSeeking: 0.6,
        },
        expertise: ["innovation", "opportunity-analysis", "creative-solutions"],
    },
    skeptic: {
        name: "Skeptic",
        emoji: "🔍",
        provider: "groq",
        modelId: "openai/gpt-oss-20b",
        personalityType: "skeptic",
        traits: {
            perspective: "Points out flaws and limitations",
            personality: "Analytical, detail-oriented, risk-aware",
            beliefPersistence: 0.7,
            reasoningDepth: 0.9,
            truthSeeking: 0.8,
        },
        expertise: ["risk-analysis", "critical-thinking", "fact-checking"],
    },
    visionary: {
        name: "Visionary",
        emoji: "🚀",
        provider: "together",
        modelId: "Qwen/Qwen3-Next-80B-A3B-Instruct",
        personalityType: "visionary",
        traits: {
            perspective: "Champions breakthrough ideas",
            personality: "Forward-thinking, innovative, solution-oriented",
            beliefPersistence: 0.3,
            reasoningDepth: 0.8,
            truthSeeking: 0.5,
        },
        expertise: [
            "future-trends",
            "disruptive-innovation",
            "paradigm-shifts",
        ],
    },
    critic: {
        name: "Critic",
        emoji: "⚖️",
        provider: "together",
        modelId: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        personalityType: "critic",
        traits: {
            perspective: "Highlights potential issues",
            personality: "Methodical, cautious, problem-focused",
            beliefPersistence: 0.6,
            reasoningDepth: 0.85,
            truthSeeking: 0.7,
        },
        expertise: [
            "problem-identification",
            "logical-reasoning",
            "quality-control",
        ],
    },
    scientist: {
        name: "Scientist",
        emoji: "🔬",
        provider: "groq",
        modelId: "openai/gpt-oss-120b",
        personalityType: "scientist",
        traits: {
            perspective: "Evidence-based, empirical approach",
            personality: "Methodical, data-driven, hypothesis-testing",
            beliefPersistence: 0.5,
            reasoningDepth: 0.95,
            truthSeeking: 0.95,
        },
        expertise: [
            "research-methodology",
            "data-analysis",
            "empirical-evidence",
        ],
    },
    artist: {
        name: "Artist",
        emoji: "🎨",
        provider: "poe",
        modelId: "Grok-4-Fast-Reasoning",
        personalityType: "artist",
        traits: {
            perspective: "Creative, aesthetic, human-centered",
            personality: "Intuitive, expressive, values-driven",
            beliefPersistence: 0.4,
            reasoningDepth: 0.6,
            truthSeeking: 0.5,
        },
        expertise: ["creative-thinking", "human-experience", "aesthetics"],
    },
    philosopher: {
        name: "Philosopher",
        emoji: "🤔",
        provider: "groq",
        modelId: "groq/compound",
        personalityType: "philosopher",
        traits: {
            perspective: "Deep, existential, questioning fundamentals",
            personality: "Reflective, conceptual, principle-focused",
            beliefPersistence: 0.6,
            reasoningDepth: 0.9,
            truthSeeking: 0.85,
        },
        expertise: ["ethics", "logic", "epistemology", "metaphysics"],
    },
    pragmatist: {
        name: "Pragmatist",
        emoji: "🛠️",
        provider: "poe",
        modelId: "Gemini-2.5-Flash-Lite",
        personalityType: "pragmatist",
        traits: {
            perspective: "Practical, results-oriented, implementable",
            personality: "Efficient, solution-focused, realistic",
            beliefPersistence: 0.5,
            reasoningDepth: 0.7,
            truthSeeking: 0.7,
        },
        expertise: [
            "implementation",
            "practical-solutions",
            "cost-benefit-analysis",
        ],
    },
};

// System prompts for debate roles
export const getDebaterSystemPrompt = (
    debater: Debater,
    round: number,
    mode: "voting" | "classic",
) => {
    const basePrompt = `You are ${debater.emoji} ${debater.name}, an AI debater with these traits:
- Perspective: ${debater.traits.perspective}
- Personality: ${debater.traits.personality}
- Belief Persistence: ${Math.round(debater.traits.beliefPersistence * 100)}% (how resistant to changing mind)
- Reasoning Depth: ${Math.round(debater.traits.reasoningDepth * 100)}%
- Truth-Seeking: ${Math.round(debater.traits.truthSeeking * 100)}%

Your internal belief about the topic's truth: ${debater.internalBelief ? Math.round(debater.internalBelief * 100) + "%" : "not yet formed"}`;

    if (mode === "voting") {
        if (round === 0) {
            return `${basePrompt}

This is your INITIAL POSITION (Round 0). Present your stance without arguing against others yet.

Instructions:
1. State your position clearly
2. Provide 2-3 key reasons
3. Be concise (150-200 words)
4. Don't reference other debaters yet

Format your response naturally without labels.`;
        } else {
            return `${basePrompt}

This is ARGUMENTATION Round ${round}. Directly engage with other debaters' points.

Instructions:
1. Reference specific points from other debaters
2. Provide counter-arguments with evidence
3. Acknowledge strong opposing points (if truth-seeking is high)
4. Present new perspectives
5. Be direct and engaging (200-300 words)

Format your response naturally, engaging directly with others' arguments.`;
        }
    } else {
        // Classic mode
        const roundType =
            round === 1
                ? "opening argument"
                : round === 2
                  ? "rebuttal"
                  : "final position";
        return `${basePrompt}

This is Round ${round}: ${roundType.toUpperCase()}.

Instructions for ${roundType}:
${
    round === 1
        ? "1. Present your main argument\n2. Provide evidence and reasoning\n3. Be persuasive and clear"
        : round === 2
          ? "1. Address opponents' points\n2. Defend your position\n3. Point out flaws in other arguments"
          : "1. Summarize your strongest points\n2. Final rebuttal\n3. Conclude decisively"
}

Length: 200-300 words
Format naturally without labels.`;
    }
};

export const getVotingPrompt = (
    debater: Debater,
    allDebaters: Debater[],
    previousArguments: DebateArgument[],
) => {
    return `You are ${debater.emoji} ${debater.name}. Based on all arguments presented, rank ALL debaters (including yourself) from strongest to weakest argument.

Previous Arguments:
${previousArguments
    .map((arg) => {
        const d = allDebaters.find((x) => x.id === arg.debaterId);
        return `${d?.emoji} ${d?.name}: ${arg.content.substring(0, 200)}...`;
    })
    .join("\n\n")}

Rank debaters by argument quality (strongest first). Consider:
- Logic and evidence
- Addressing others' points
- Persuasiveness
- Truth-seeking vs rhetoric

Return ONLY a JSON array of debater IDs in ranked order:
["debater-id-1", "debater-id-2", "debater-id-3", "debater-id-4"]

No explanation, just the JSON array.`;
};

export const getJudgePrompt = (
    question: string,
    allArguments: DebateArgument[],
    debaters: Debater[],
) => {
    return `You are an impartial JUDGE reviewing a debate on: "${question}"

All Arguments:
${allArguments
    .map((arg) => {
        const d = debaters.find((x) => x.id === arg.debaterId);
        return `\n${d?.emoji} ${d?.name}:\n${arg.content}`;
    })
    .join("\n---\n")}

Your task:
1. Synthesize all perspectives fairly
2. Identify the strongest arguments from each side
3. Make a reasoned final decision
4. Explain your reasoning clearly

Consider:
- Logical strength of arguments
- Evidence quality
- Potential biases
- Practical implications
- Nuanced middle grounds

Provide a balanced, well-reasoned final judgment (300-400 words).`;
};

// Calculate consensus from votes based on voting system
export const calculateConsensus = (
    votes: DebateVote[],
    threshold: number,
    votingSystem: VotingSystem = "ranked",
): {
    reached: boolean;
    leader: string | null;
    agreement: number;
    scores?: Record<string, number>;
} => {
    if (votes.length === 0)
        return { reached: false, leader: null, agreement: 0 };

    let scores: Record<string, number> = {};

    switch (votingSystem) {
        case "ranked":
            // Count first-place votes (default)
            votes.forEach((vote) => {
                const winner = vote.rankings[0];
                scores[winner] = (scores[winner] || 0) + 1;
            });
            break;

        case "borda":
            // Borda count: points based on ranking position
            votes.forEach((vote) => {
                const maxPoints = vote.rankings.length;
                vote.rankings.forEach((debaterId, index) => {
                    const points = maxPoints - index;
                    scores[debaterId] = (scores[debaterId] || 0) + points;
                });
            });
            break;

        case "approval":
            // Approval voting: count how many approve each debater (top 50% of rankings)
            votes.forEach((vote) => {
                const approvalThreshold = Math.ceil(vote.rankings.length / 2);
                vote.rankings
                    .slice(0, approvalThreshold)
                    .forEach((debaterId) => {
                        scores[debaterId] = (scores[debaterId] || 0) + 1;
                    });
            });
            break;

        case "condorcet": {
            // Condorcet method: pairwise comparisons
            const allDebaters = Array.from(
                new Set(votes.flatMap((v) => v.rankings)),
            );
            const pairwiseWins: Record<string, number> = {};

            allDebaters.forEach((d) => (pairwiseWins[d] = 0));

            // Count pairwise victories
            allDebaters.forEach((debater1) => {
                allDebaters.forEach((debater2) => {
                    if (debater1 === debater2) return;

                    let winsAgainst = 0;
                    votes.forEach((vote) => {
                        const idx1 = vote.rankings.indexOf(debater1);
                        const idx2 = vote.rankings.indexOf(debater2);
                        if (idx1 < idx2) winsAgainst++;
                    });

                    if (winsAgainst > votes.length / 2) {
                        pairwiseWins[debater1]++;
                    }
                });
            });

            scores = pairwiseWins;
            break;
        }
    }

    const totalVotes = votes.length;
    const leader = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

    if (!leader) return { reached: false, leader: null, agreement: 0, scores };

    // Calculate agreement as percentage of max possible score
    const maxPossibleScore =
        votingSystem === "borda"
            ? votes.length * votes[0]?.rankings.length || 1
            : votingSystem === "condorcet"
              ? Object.keys(scores).length - 1
              : totalVotes;

    const agreement = leader[1] / maxPossibleScore;
    const reached = agreement >= threshold;

    return {
        reached,
        leader: leader[0],
        agreement,
        scores,
    };
};

// Argument Mining: Extract key arguments and their relationships
export const extractKeyArguments = (
    rounds: DebateRound[],
    debaters: Debater[],
): ExtractedArgument[] => {
    const extractedArgs: ExtractedArgument[] = [];

    rounds.forEach((round) => {
        round.arguments.forEach((arg, index) => {
            const debater = debaters.find((d) => d.id === arg.debaterId);
            if (!debater) return;

            // Simple heuristics for argument classification
            const content = arg.content.toLowerCase();
            let type: ExtractedArgument["type"] = "claim";

            if (
                content.includes("evidence") ||
                content.includes("study") ||
                content.includes("research")
            ) {
                type = "evidence";
            } else if (
                content.includes("however") ||
                content.includes("but") ||
                content.includes("counter")
            ) {
                type = "rebuttal";
            } else if (
                content.includes("agree") ||
                content.includes("you're right") ||
                content.includes("concede")
            ) {
                type = "concession";
            }

            // Calculate strength based on length, reasoning depth, and belief updates
            const baseStrength = Math.min(arg.content.length / 500, 1) * 0.5;
            const reasoningBonus = debater.traits.reasoningDepth * 0.3;
            const beliefBonus = arg.beliefUpdate ? 0.2 : 0;
            const strength = Math.min(
                baseStrength + reasoningBonus + beliefBonus,
                1,
            );

            // Find references to other debaters
            const references = debaters
                .filter((d) => d.id !== arg.debaterId)
                .filter((d) =>
                    arg.content.toLowerCase().includes(d.name.toLowerCase()),
                )
                .map((d) => d.id);

            extractedArgs.push({
                debaterId: arg.debaterId,
                content: arg.content,
                type,
                strength,
                references,
            });
        });
    });

    // Sort by strength
    return extractedArgs.sort((a, b) => b.strength - a.strength);
};

// Build debate tree structure
export const buildDebateTree = (
    rounds: DebateRound[],
    debaters: Debater[],
): DebateNode => {
    const nodes: DebateNode[] = [];

    rounds.forEach((round, roundIndex) => {
        round.arguments.forEach((arg, argIndex) => {
            const node: DebateNode = {
                id: `${roundIndex}-${argIndex}`,
                debaterId: arg.debaterId,
                content: arg.content,
                children: [],
                agreementScore: 0,
                impact: 0,
            };

            // Calculate agreement score based on belief updates and references
            if (arg.beliefUpdate) {
                node.impact = Math.abs(arg.beliefUpdate);
            }

            nodes.push(node);
        });
    });

    // Build parent-child relationships based on references
    nodes.forEach((node) => {
        const arg = rounds
            .flatMap((r) => r.arguments)
            .find(
                (a, i) =>
                    `${Math.floor(i / rounds[0]?.arguments.length || 1)}-${i % (rounds[0]?.arguments.length || 1)}` ===
                    node.id,
            );

        if (arg) {
            const debater = debaters.find((d) => d.id === arg.debaterId);
            if (debater) {
                // Find parent nodes (arguments from other debaters mentioned in this argument)
                debaters.forEach((otherDebater) => {
                    if (
                        otherDebater.id !== debater.id &&
                        arg.content
                            .toLowerCase()
                            .includes(otherDebater.name.toLowerCase())
                    ) {
                        const parentNode = nodes.find(
                            (n) => n.debaterId === otherDebater.id,
                        );
                        if (parentNode && !parentNode.children.includes(node)) {
                            parentNode.children.push(node);
                        }
                    }
                });
            }
        }
    });

    // Create root node
    const root: DebateNode = {
        id: "root",
        debaterId: "system",
        content: "Debate Root",
        children: nodes.filter(
            (n) => !nodes.some((parent) => parent.children.includes(n)),
        ),
        agreementScore: 0,
        impact: 0,
    };

    return root;
};

// Calculate debate analytics
export const calculateDebateAnalytics = (
    session: DebateSession,
): DebateAnalytics => {
    const participationRate: Record<string, number> = {};
    const beliefChangeRate: Record<string, number> = {};
    const argumentQuality: Record<string, number> = {};

    // Initialize counters
    session.debaters.forEach((d) => {
        participationRate[d.id] = 0;
        beliefChangeRate[d.id] = 0;
        argumentQuality[d.id] = 0;
    });

    // Calculate participation
    session.rounds.forEach((round) => {
        round.arguments.forEach((arg) => {
            participationRate[arg.debaterId] =
                (participationRate[arg.debaterId] || 0) + 1;

            if (arg.beliefUpdate !== undefined) {
                const debater = session.debaters.find(
                    (d) => d.id === arg.debaterId,
                );
                if (debater && debater.internalBelief !== undefined) {
                    beliefChangeRate[arg.debaterId] += Math.abs(
                        arg.beliefUpdate - debater.internalBelief,
                    );
                }
            }
        });
    });

    // Calculate argument quality based on votes
    session.rounds.forEach((round) => {
        if (round.votes) {
            round.votes.forEach((vote) => {
                vote.rankings.forEach((debaterId, index) => {
                    const score =
                        (vote.rankings.length - index) / vote.rankings.length;
                    argumentQuality[debaterId] =
                        (argumentQuality[debaterId] || 0) + score;
                });
            });
        }
    });

    // Normalize quality scores
    const maxQuality = Math.max(...Object.values(argumentQuality));
    if (maxQuality > 0) {
        Object.keys(argumentQuality).forEach((id) => {
            argumentQuality[id] /= maxQuality;
        });
    }

    // Build consensus patterns
    const consensusPattern: ConsensusPattern[] = session.rounds
        .filter((r) => r.votes && r.votes.length > 0)
        .map((round, index) => {
            const consensus = calculateConsensus(
                round.votes!,
                session.consensusThreshold,
                session.votingSystem,
            );

            // Calculate polarization (variance in rankings)
            const allPositions: number[] = [];
            round.votes!.forEach((vote) => {
                vote.rankings.forEach((id, pos) => {
                    allPositions.push(pos);
                });
            });
            const mean =
                allPositions.reduce((a, b) => a + b, 0) / allPositions.length;
            const variance =
                allPositions.reduce(
                    (sum, pos) => sum + Math.pow(pos - mean, 2),
                    0,
                ) / allPositions.length;
            const polarization = Math.min(
                variance / (allPositions.length * allPositions.length),
                1,
            );

            return {
                round: index,
                agreementLevel: consensus.agreement,
                leadingPosition: consensus.leader || "none",
                polarization,
            };
        });

    const keyArguments = extractKeyArguments(session.rounds, session.debaters);
    const debateTree = buildDebateTree(session.rounds, session.debaters);

    return {
        participationRate,
        argumentQuality,
        beliefChangeRate,
        consensusPattern,
        keyArguments,
        debateTree,
    };
};

// Get formatted analytics summary
export const getAnalyticsSummary = (
    analytics: DebateAnalytics,
    debaters: Debater[],
): string => {
    let summary = "📊 **Debate Analytics Summary**\n\n";

    // Participation
    summary += "**Participation Rate:**\n";
    Object.entries(analytics.participationRate)
        .sort((a, b) => b[1] - a[1])
        .forEach(([id, count]) => {
            const debater = debaters.find((d) => d.id === id);
            summary += `- ${debater?.emoji} ${debater?.name}: ${count} arguments\n`;
        });

    summary += "\n**Argument Quality:**\n";
    Object.entries(analytics.argumentQuality)
        .sort((a, b) => b[1] - a[1])
        .forEach(([id, quality]) => {
            const debater = debaters.find((d) => d.id === id);
            summary += `- ${debater?.emoji} ${debater?.name}: ${(quality * 100).toFixed(1)}%\n`;
        });

    summary += "\n**Belief Change Rate:**\n";
    Object.entries(analytics.beliefChangeRate)
        .sort((a, b) => b[1] - a[1])
        .forEach(([id, change]) => {
            const debater = debaters.find((d) => d.id === id);
            summary += `- ${debater?.emoji} ${debater?.name}: ${(change * 100).toFixed(1)}% shift\n`;
        });

    summary += "\n**Consensus Pattern:**\n";
    analytics.consensusPattern.forEach((pattern) => {
        const leader = debaters.find((d) => d.id === pattern.leadingPosition);
        summary += `- Round ${pattern.round}: ${(pattern.agreementLevel * 100).toFixed(1)}% agreement`;
        if (leader) summary += ` (${leader.emoji} ${leader.name} leading)`;
        summary += `, polarization: ${(pattern.polarization * 100).toFixed(1)}%\n`;
    });

    summary += "\n**Top Arguments:**\n";
    analytics.keyArguments.slice(0, 3).forEach((arg, idx) => {
        const debater = debaters.find((d) => d.id === arg.debaterId);
        summary += `${idx + 1}. ${debater?.emoji} ${debater?.name} (${arg.type}, strength: ${(arg.strength * 100).toFixed(0)}%)\n`;
        summary += `   "${arg.content.substring(0, 100)}..."\n`;
    });

    return summary;
};
