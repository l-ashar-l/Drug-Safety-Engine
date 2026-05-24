import { NextResponse } from 'next/server';

const openAIUrl = 'https://api.openai.com/v1/chat/completions';
const anthropicUrl = 'https://api.anthropic.com/v1/chat/completions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, patientSummary, safetyText, mode } = body;
        const provider = process.env.LLM_PROVIDER ?? 'anthropic';
        const apiKey = process.env.LLM_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing LLM_API_KEY' }, { status: 500 });
        }
        if (!question || !patientSummary) {
            return NextResponse.json({ error: 'Missing question or patient summary' }, { status: 400 });
        }

        const systemPrompt = mode === 'enhanced' && safetyText
            ? `${safetyText}\n\nPatient summary:\n${patientSummary}`
            : `Patient summary:\n${patientSummary}`;

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
