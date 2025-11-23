/**
 * Agent Council - 3-Stage LLM Council Orchestration
 * Menggunakan model gratis dari OpenRouter, Groq, dan Together AI
 */

import { groqApi } from "./groqApi";
import { togetherApi } from "./togetherApi";
import { openrouterApi } from "./openrouterApi";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CouncilMember {
    name: string;
    provider: "groq" | "together" | "openrouter";
    modelId: string;
}

export interface Stage1Response {
    member: string;
    model: string;
    provider: string;
    response: string;
}

export interface Stage2Ranking {
    member: string;
    model: string;
    provider: string;
    ranking: string;
    parsed_ranking: string[];
}

export interface Stage3Result {
    chairman: string;
    model: string;
    provider: string;
    response: string;
}

export interface CouncilMetadata {
    label_to_member: Record<string, string>;
    aggregate_rankings: Array<{
        member: string;
        average_rank: number;
        rankings_count: number;
    }>;
}

export interface CouncilResult {
    stage1_results: Stage1Response[];
    stage2_results: Stage2Ranking[];
    stage3_result: Stage3Result;
    metadata: CouncilMetadata;
}

// ============================================================================
// COUNCIL CONFIGURATION - Model gratis yang tersedia (Default)
// ============================================================================

export const DEFAULT_COUNCIL_MEMBERS: CouncilMember[] = [
    {
        name: "Llama Scholar",
        provider: "groq",
        modelId: "llama-3.1-8b-instant",
    },
    {
        name: "Mixtral Sage",
        provider: "groq",
        modelId: "mixtral-8x7b-32768",
    },
    {
        name: "Gemma Analyst",
        provider: "groq",
        modelId: "gemma2-9b-it",
    },
    {
        name: "Qwen Expert",
        provider: "together",
        modelId: "Qwen/Qwen3-Next-80B-A3B-Instruct",
    },
    {
        name: "Nemotron Oracle",
        provider: "openrouter",
        modelId: "nvidia/nemotron-nano-12b-v2-vl:free",
    },
];

// Chairman - menggunakan model terbaik untuk sintesis akhir (Default)
export const DEFAULT_CHAIRMAN: CouncilMember = {
    name: "Qwen Chairman",
    provider: "together",
    modelId: "Qwen/Qwen3-Next-80B-A3B-Instruct",
};

// Config storage key
const COUNCIL_CONFIG_KEY = "agent_council_config";

export interface CouncilConfig {
    members: CouncilMember[];
    chairman: CouncilMember;
}

export function saveCouncilConfig(config: CouncilConfig): void {
    try {
        localStorage.setItem(COUNCIL_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Error saving council config:", error);
    }
}

export function loadCouncilConfig(): CouncilConfig | null {
    try {
        const saved = localStorage.getItem(COUNCIL_CONFIG_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error("Error loading council config:", error);
    }
    return null;
}

export function getCouncilConfig(): CouncilConfig {
    const saved = loadCouncilConfig();
    return (
        saved || {
            members: DEFAULT_COUNCIL_MEMBERS,
            chairman: DEFAULT_CHAIRMAN,
        }
    );
}

// ============================================================================
// HELPER FUNCTIONS - Query providers
// ============================================================================

async function queryProvider(
    provider: "groq" | "together" | "openrouter",
    modelId: string,
    messages: Array<{ role: string; content: string }>,
): Promise<string | null> {
    try {
        switch (provider) {
            case "groq":
                const groqResponse = await groqApi.sendMessage({
                    model: modelId,
                    messages: messages as Array<{
                        role: "user" | "assistant" | "system";
                        content: string;
                    }>,
                    temperature: 0.7,
                    max_completion_tokens: 4096,
                });
                return groqResponse.choices[0]?.message?.content || null;

            case "together":
                const togetherResponse = await togetherApi.sendMessage({
                    model: modelId,
                    messages: messages as Array<{
                        role: "user" | "assistant" | "system";
                        content: string;
                    }>,
                    temperature: 0.7,
                    max_tokens: 4096,
                });
                return togetherResponse.choices[0]?.message?.content || null;

            case "openrouter":
                const openrouterResponse = await openrouterApi.sendMessage({
                    model: modelId,
                    messages: messages as Array<{
                        role: "user" | "assistant" | "system";
                        content: string;
                    }>,
                    temperature: 0.7,
                    max_tokens: 4096,
                });
                return openrouterResponse.choices[0]?.message?.content || null;

            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    } catch (error) {
        console.error(
            `Error querying ${provider} with model ${modelId}:`,
            error,
        );
        return null;
    }
}

async function queryProvidersParallel(
    members: CouncilMember[],
    messages: Array<{ role: string; content: string }>,
): Promise<Map<string, string | null>> {
    const promises = members.map(async (member) => {
        const response = await queryProvider(
            member.provider,
            member.modelId,
            messages,
        );
        return { member: member.name, response };
    });

    const results = await Promise.all(promises);
    const resultMap = new Map<string, string | null>();

    results.forEach(({ member, response }) => {
        resultMap.set(member, response);
    });

    return resultMap;
}

// ============================================================================
// STAGE 1: Collect Individual Responses
// ============================================================================

export async function stage1_collect_responses(
    user_query: string,
    members?: CouncilMember[],
): Promise<Stage1Response[]> {
    const councilMembers = members || getCouncilConfig().members;
    
    // Enhanced prompt untuk Stage 1
    const enhanced_query = `You are participating in an expert AI council deliberation.

CONTEXT: You're one of ${councilMembers.length} AI models collaborating to provide the best possible answer. Your response will be peer-reviewed by other models and synthesized by a chairman.

QUESTION:
${user_query}

YOUR TASK:
1. Provide a comprehensive, well-reasoned response
2. Draw on your unique strengths and perspective  
3. Be specific with examples or evidence when possible
4. Consider edge cases and limitations
5. Structure your response clearly with sections if needed
6. Aim for accuracy and helpfulness above all

Remember: Quality and clarity matter. Your peers will evaluate your contribution.

Provide your expert analysis:`;

    const messages = [{ role: "user", content: enhanced_query }];

    console.log("🎯 Stage 1: Collecting responses from council members...");

    // Query semua member secara parallel
    const responses = await queryProvidersParallel(councilMembers, messages);

    // Format hasil
    const stage1_results: Stage1Response[] = [];

    for (const member of councilMembers) {
        const response = responses.get(member.name);
        if (response) {
            stage1_results.push({
                member: member.name,
                model: member.modelId,
                provider: member.provider,
                response: response,
            });
            console.log(`✅ ${member.name} responded`);
        } else {
            console.log(`❌ ${member.name} failed`);
        }
    }

    console.log(
        `✅ Stage 1 complete: ${stage1_results.length}/${councilMembers.length} responses`,
    );

    return stage1_results;
}

// ============================================================================
// STAGE 2: Collect Rankings
// ============================================================================

function parse_ranking_from_text(ranking_text: string): string[] {
    // Cari section "FINAL RANKING:"
    if (ranking_text.includes("FINAL RANKING:")) {
        const parts = ranking_text.split("FINAL RANKING:");
        if (parts.length >= 2) {
            const ranking_section = parts[1];

            // Extract numbered list format (e.g., "1. Response A")
            const numbered_matches = ranking_section.match(
                /\d+\.\s*Response [A-Z]/g,
            );
            if (numbered_matches) {
                return numbered_matches.map((m) => {
                    const match = m.match(/Response [A-Z]/);
                    return match ? match[0] : "";
                });
            }

            // Fallback: ambil semua "Response X" patterns
            const matches = ranking_section.match(/Response [A-Z]/g);
            return matches || [];
        }
    }

    // Fallback: cari semua "Response X" patterns
    const matches = ranking_text.match(/Response [A-Z]/g);
    return matches || [];
}

export async function stage2_collect_rankings(
    user_query: string,
    stage1_results: Stage1Response[],
    members?: CouncilMember[],
): Promise<{
    stage2_results: Stage2Ranking[];
    label_to_member: Record<string, string>;
}> {
    const councilMembers = members || getCouncilConfig().members;
    console.log("🎯 Stage 2: Collecting rankings from council members...");

    // Buat label anonim (Response A, Response B, dll)
    const labels = stage1_results.map((_, i) => String.fromCharCode(65 + i)); // A, B, C, ...

    // Mapping dari label ke member name
    const label_to_member: Record<string, string> = {};
    stage1_results.forEach((result, i) => {
        label_to_member[`Response ${labels[i]}`] = result.member;
    });

    // Build ranking prompt
    const responses_text = stage1_results
        .map((result, i) => `Response ${labels[i]}:\n${result.response}`)
        .join("\n\n");

    const ranking_prompt = `You are serving as a peer reviewer in an AI council evaluation process.

ORIGINAL QUESTION:
${user_query}

ANONYMIZED RESPONSES (${stage1_results.length} total):
${responses_text}

═══════════════════════════════════════

YOUR TASK AS PEER REVIEWER:

Phase 1 - INDIVIDUAL EVALUATION:
For each response, analyze:
• **Accuracy & Correctness**: Is the information factually accurate?
• **Completeness**: Does it thoroughly address all aspects?
• **Clarity & Structure**: Is it well-organized and easy to understand?
• **Practical Value**: Does it provide actionable insights?
• **Depth of Analysis**: Does it go beyond surface-level answers?

Provide 2-3 sentences for each response explaining strengths and weaknesses.

Phase 2 - FINAL RANKING:
After your analysis, you MUST provide a final ranking.

CRITICAL FORMAT REQUIREMENTS:
- Start with exactly "FINAL RANKING:" (all caps, with colon)
- List responses from BEST to WORST as a numbered list
- Each line format: "number. Response [LETTER]" (e.g., "1. Response A")
- Do NOT add any text after the response label in the ranking section

═══════════════════════════════════════

EXAMPLE OF COMPLETE RESPONSE:

Response A demonstrates strong technical accuracy and provides practical examples. However, it lacks depth in edge case analysis.

Response B offers comprehensive coverage with excellent structure. Minor weakness in providing concrete examples.

Response C is clear but somewhat superficial, missing key considerations that were asked in the question.

FINAL RANKING:
1. Response B
2. Response A  
3. Response C

═══════════════════════════════════════

Now provide your evaluation and ranking:`;

    const messages = [{ role: "user", content: ranking_prompt }];

    // Get rankings dari semua council members secara parallel
    const responses = await queryProvidersParallel(councilMembers, messages);

    // Format hasil
    const stage2_results: Stage2Ranking[] = [];

    for (const member of councilMembers) {
        const response = responses.get(member.name);
        if (response) {
            const parsed = parse_ranking_from_text(response);
            stage2_results.push({
                member: member.name,
                model: member.modelId,
                provider: member.provider,
                ranking: response,
                parsed_ranking: parsed,
            });
            console.log(`✅ ${member.name} provided ranking`);
        } else {
            console.log(`❌ ${member.name} failed to rank`);
        }
    }

    console.log(
        `✅ Stage 2 complete: ${stage2_results.length}/${councilMembers.length} rankings`,
    );

    return { stage2_results, label_to_member };
}

// ============================================================================
// STAGE 3: Chairman Synthesis
// ============================================================================

export async function stage3_synthesize_final(
    user_query: string,
    stage1_results: Stage1Response[],
    stage2_results: Stage2Ranking[],
    chairman?: CouncilMember,
): Promise<Stage3Result> {
    const chairmanMember = chairman || getCouncilConfig().chairman;
    console.log("🎯 Stage 3: Chairman synthesizing final response...");

    // Build comprehensive context untuk chairman
    const stage1_text = stage1_results
        .map(
            (result) =>
                `Member: ${result.member} (${result.provider}/${result.model})\nResponse: ${result.response}`,
        )
        .join("\n\n");

    const stage2_text = stage2_results
        .map(
            (result) =>
                `Member: ${result.member}\nRanking: ${result.ranking}`,
        )
        .join("\n\n");

    const chairman_prompt = `You are the Chairman of an AI Council. Your role is to synthesize multiple expert perspectives into ONE definitive answer.

═══════════════════════════════════════
ORIGINAL QUESTION:
${user_query}
═══════════════════════════════════════

STAGE 1 - COUNCIL MEMBER RESPONSES (${stage1_results.length} members):
${stage1_text}

═══════════════════════════════════════
STAGE 2 - PEER EVALUATION RESULTS (${stage2_results.length} rankings):
${stage2_text}

═══════════════════════════════════════

YOUR ROLE AS CHAIRMAN:

You must create ONE comprehensive answer by synthesizing these diverse perspectives. This is NOT a summary - it's a carefully crafted response that:

1. **Integrates Best Ideas**: Extract and combine the strongest points from all responses
2. **Resolves Conflicts**: Where responses disagree, determine the best approach using evidence and reasoning
3. **Fills Gaps**: Add important points that individual members missed
4. **Provides Structure**: Organize information logically with clear sections (use markdown headers/lists)
5. **Maintains Objectivity**: Consider rankings but use your judgment - sometimes lower-ranked responses have valuable insights
6. **Ensures Completeness**: Address ALL aspects of the original question
7. **Adds Value**: Don't just repeat - synthesize, enhance, and improve upon the individual contributions

SYNTHESIS GUIDELINES:
• Start directly with your answer (no meta-commentary about being chairman)
• Use clear markdown formatting (headers, lists, bold) for complex topics
• Be authoritative yet acknowledge uncertainty where appropriate
• Prioritize accuracy over completeness if there's doubt
• Make it practical and actionable when relevant
• Cite specific points from different members when they add credibility
• Length should match complexity - don't pad, but don't omit important details

QUALITY STANDARDS:
✓ Accurate and factually correct
✓ Comprehensive yet concise
✓ Well-structured and easy to follow
✓ Practical and helpful
✓ Integrates multiple perspectives intelligently

Provide your synthesized final answer now:`;

    const messages = [{ role: "user", content: chairman_prompt }];

    // Query chairman
    const response = await queryProvider(
        chairmanMember.provider,
        chairmanMember.modelId,
        messages,
    );

    if (!response) {
        console.log("❌ Chairman failed to respond");
        return {
            chairman: chairmanMember.name,
            model: chairmanMember.modelId,
            provider: chairmanMember.provider,
            response:
                "Error: Unable to generate final synthesis. The chairman model did not respond.",
        };
    }

    console.log("✅ Stage 3 complete: Chairman has synthesized final answer");

    return {
        chairman: chairmanMember.name,
        model: chairmanMember.modelId,
        provider: chairmanMember.provider,
        response: response,
    };
}

// ============================================================================
// AGGREGATE RANKINGS CALCULATION
// ============================================================================

export function calculate_aggregate_rankings(
    stage2_results: Stage2Ranking[],
    label_to_member: Record<string, string>,
): Array<{
    member: string;
    average_rank: number;
    rankings_count: number;
}> {
    const member_positions: Record<string, number[]> = {};

    // Track positions untuk setiap member
    stage2_results.forEach((ranking) => {
        ranking.parsed_ranking.forEach((label, position) => {
            const member = label_to_member[label];
            if (member) {
                if (!member_positions[member]) {
                    member_positions[member] = [];
                }
                member_positions[member].push(position + 1); // 1-indexed
            }
        });
    });

    // Calculate average position untuk setiap member
    const aggregate = Object.entries(member_positions).map(
        ([member, positions]) => ({
            member,
            average_rank:
                positions.length > 0
                    ? Math.round(
                          (positions.reduce((a, b) => a + b, 0) /
                              positions.length) *
                              100,
                      ) / 100
                    : 999,
            rankings_count: positions.length,
        }),
    );

    // Sort by average rank (lower is better)
    aggregate.sort((a, b) => a.average_rank - b.average_rank);

    return aggregate;
}

// ============================================================================
// TITLE GENERATION
// ============================================================================

export async function generate_conversation_title(
    user_query: string,
): Promise<string> {
    const title_prompt = `Generate a very short title (3-5 words maximum) that summarizes the following question.

The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: ${user_query}

Title:`;

    const messages = [{ role: "user", content: title_prompt }];

    // Gunakan model cepat untuk generate title
    const response = await queryProvider(
        "groq",
        "llama-3.1-8b-instant",
        messages,
    );

    if (!response) {
        return "New Conversation";
    }

    // Clean up title
    let title = response.trim().replace(/["']/g, "");

    // Truncate jika terlalu panjang
    if (title.length > 50) {
        title = title.substring(0, 47) + "...";
    }

    return title;
}

// ============================================================================
// MAIN FUNCTION - Run Full Council Process
// ============================================================================

export async function run_full_council(
    user_query: string,
    config?: CouncilConfig,
): Promise<CouncilResult> {
    const councilConfig = config || getCouncilConfig();
    console.log("🚀 Starting Agent Council for query:", user_query);

    // Stage 1: Collect individual responses
    const stage1_results = await stage1_collect_responses(
        user_query,
        councilConfig.members,
    );

    // Jika tidak ada yang respond, return error
    if (stage1_results.length === 0) {
        return {
            stage1_results: [],
            stage2_results: [],
            stage3_result: {
                chairman: "Error",
                model: "none",
                provider: "none",
                response:
                    "All models failed to respond. Please check your API keys and try again.",
            },
            metadata: {
                label_to_member: {},
                aggregate_rankings: [],
            },
        };
    }

    // Stage 2: Collect rankings
    const { stage2_results, label_to_member } = await stage2_collect_rankings(
        user_query,
        stage1_results,
        councilConfig.members,
    );

    // Calculate aggregate rankings
    const aggregate_rankings = calculate_aggregate_rankings(
        stage2_results,
        label_to_member,
    );

    // Stage 3: Synthesize final answer
    const stage3_result = await stage3_synthesize_final(
        user_query,
        stage1_results,
        stage2_results,
        councilConfig.chairman,
    );

    console.log("🎉 Agent Council complete!");

    return {
        stage1_results,
        stage2_results,
        stage3_result,
        metadata: {
            label_to_member,
            aggregate_rankings,
        },
    };
}

// ============================================================================
// UTILITY FUNCTIONS - Export untuk digunakan di UI
// ============================================================================

export function get_council_members(): CouncilMember[] {
    return getCouncilConfig().members;
}

export function get_chairman(): CouncilMember {
    return getCouncilConfig().chairman;
}

export function is_council_available(): boolean {
    // Cek apakah minimal 1 provider tersedia
    return (
        groqApi.isConfigured() ||
        togetherApi.isConfigured() ||
        openrouterApi.isConfigured()
    );
}

export function getAvailableModels(): {
    groq: boolean;
    together: boolean;
    openrouter: boolean;
} {
    return {
        groq: groqApi.isConfigured(),
        together: togetherApi.isConfigured(),
        openrouter: openrouterApi.isConfigured(),
    };
}

