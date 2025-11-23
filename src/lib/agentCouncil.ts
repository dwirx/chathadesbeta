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
    const messages = [{ role: "user", content: user_query }];

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

    const ranking_prompt = `You are evaluating different responses to the following question:

Question: ${user_query}

Here are the responses from different models (anonymized):

${responses_text}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

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

    const chairman_prompt = `You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: ${user_query}

STAGE 1 - Individual Responses:
${stage1_text}

STAGE 2 - Peer Rankings:
${stage2_text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:`;

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

