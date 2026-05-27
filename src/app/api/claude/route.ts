import { NextResponse } from 'next/server';

const openAIUrl = 'https://api.openai.com/v1/chat/completions';
const anthropicUrl = 'https://api.anthropic.com/v1/chat/completions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, patientSummary, safetyText, mode } = body;
        console.debug("🚀 ~ POST ~ safetyText:", safetyText)
        console.debug("🚀 ~ POST ~ patientSummary:", patientSummary)
        const provider = process.env.LLM_PROVIDER ?? 'anthropic';
        const apiKey = process.env.LLM_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing LLM_API_KEY' }, { status: 500 });
        }
        if (!question || !patientSummary) {
            return NextResponse.json({ error: 'Fetch patient summary and Enter your question' }, { status: 400 });
        }

        const systemPrompt = mode === 'enhanced' && safetyText
            // ? `You are a clinical safety assistant. Follow all safety constraints exactly as mandatory clinical rules. Do not override or ignore any HARD BLOCKS, and do not recommend therapies that conflict with them. If the question would violate a hard block, clearly say so and offer a safer alternative when possible.\n\n${safetyText}\n\nPatient summary:\n${patientSummary}`
            ? `
            You are a deterministic clinical safety enforcement assistant.
                
            NON-NEGOTIABLE RULES:
                
            1. Safety constraints below are mandatory clinical rules, NOT suggestions.
            2. If any HARD BLOCK, SEVERE interaction, contraindication, allergy conflict, renal dosing issue, or critical contradiction exists:
               - DO NOT answer with a general treatment overview first.
               - DO NOT say the drug is appropriate.
               - DO NOT provide standard dosing for a contraindicated drug.
               - FIRST explicitly state that the proposed therapy is unsafe or contraindicated.
                
            3. If the user asks about a therapy that conflicts with safety constraints:
               - Start the response with "CLINICAL SAFETY SUMMARY"
               - Clearly list all blocking contradictions
               - Explicitly reject unsafe therapy
               - Suggest safer alternatives when available
                
            4. NEVER contradict the supplied safety constraints.
                
            5. If safety constraints contain SEVERE interaction warnings, treat them as disqualifying unless an override is explicitly stated.
                
            REQUIRED RESPONSE FORMAT:
                
            CLINICAL SAFETY SUMMARY:
            [List contradictions first]
                
            RECOMMENDATION:
            [State whether therapy should or should not be used]
                
            RATIONALE:
            [Clinical explanation]
                
            SAFER ALTERNATIVES:
            [If applicable]
                
            SAFETY CONSTRAINTS:
            ${safetyText}
                
            PATIENT SUMMARY:
            ${patientSummary}
            `
            : `You are a clinical assistant. Patient summary:\n${patientSummary}`;

        const userPrompt = `Doctor question: ${question}`;
        let responseText = '';

        if (provider === 'openai') {
            const response = await fetch(openAIUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    max_tokens: 500,
                    temperature: 0.2,
                }),
            });
            const data = await response.json();
            responseText = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
        } else {
            const response = await fetch(anthropicUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-6',
                    system: systemPrompt,
                    messages: [
                        { role: 'user', content: userPrompt },
                    ],
                    max_tokens: 500,
                    temperature: 0.2,
                }),
            });
            const data = await response.json();
            responseText = data?.completion ?? data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
        }

        return NextResponse.json({ response: responseText });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
