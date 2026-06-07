import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { fromIni } from '@aws-sdk/credential-providers';

const client = new BedrockRuntimeClient({
  region: 'us-west-2',
  credentials: fromIni({ profile: 'eero-token-vending' }),
});

const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0'; // Fast + cheap for queries

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const systemPrompt = `You are an AI assistant embedded in the "Simplified Inventory Dashboard" — a device tracking platform used by eero's Beta team. You help team members look up information about devices, testers, programs, shipments, and operational processes.

You have access to the following data context (provided as JSON). Use it to answer questions accurately:

${context || 'No data context provided.'}

Guidelines:
- Be concise and direct. No fluff.
- When referencing devices, show serial numbers.
- When referencing people, show their name and email.
- If you can't find the answer in the provided data, say so clearly.
- For process questions (how to shapeshift, how to return devices, etc.), provide step-by-step guidance based on the platform's workflows.
- Format responses with markdown when helpful (bold for emphasis, bullet points for lists).`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const answer = responseBody.content?.[0]?.text || 'No response generated.';

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('[Agent API Error]', error);

    // If credentials expired, give helpful message
    if (error.name === 'CredentialsProviderError' || error.message?.includes('credential')) {
      return NextResponse.json({
        answer: '⚠️ AWS credentials expired. Run `mwinit` in your terminal, then `ada credentials print --provider conduit --account eero-token-vending --role EeroTokenVendingUser` to refresh.',
        error: 'credentials_expired',
      });
    }

    // If model access denied
    if (error.name === 'AccessDeniedException') {
      return NextResponse.json({
        answer: '⚠️ Bedrock model access not enabled. Go to AWS Console → Bedrock → Model Access and request access to Claude models.',
        error: 'access_denied',
      });
    }

    return NextResponse.json({
      answer: `⚠️ Error: ${error.message || 'Unknown error'}`,
      error: error.message,
    });
  }
}
