import OpenAI from 'openai';
import { config } from '@/lib/config';
import { AI_ANALYSIS_JSON_SCHEMA } from './schemas';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  return openaiClient;
}

// Analyze transactions using OpenAI
export async function analyzeTransactionsWithAI(
  transactions: any[],
  context?: {
    userId?: string;
    dateRange?: { start: string; end: string };
    knownPaycheckAmount?: number;
    knownBonusRange?: { min: number; max: number };
  }
): Promise<any> {
  const client = getOpenAIClient();

  const prompt = buildAnalysisPrompt(transactions, context);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Use a cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst specializing in transaction categorization and pattern recognition. Analyze bank transactions to identify recurring payments, one-time purchases, paychecks, and bonuses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 2000,
      response_format: {
        type: 'json_schema',
        json_schema: AI_ANALYSIS_JSON_SCHEMA,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response with enhanced error handling
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      const contentPreview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
      throw new Error(`Failed to parse OpenAI response as JSON: ${errorMessage}. Response content: ${contentPreview}`);
    }

    // Validate basic structure exists
    if (!parsed || typeof parsed !== 'object') {
      throw new Error(`Invalid response structure from OpenAI: expected object, got ${typeof parsed}`);
    }

    return parsed;
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw new Error('Failed to analyze transactions with AI');
  }
}

function buildAnalysisPrompt(transactions: any[], context?: any): string {
  const paycheckAmount = context?.knownPaycheckAmount;
  const bonusRange = context?.knownBonusRange;

  return `
Analyze the following bank transactions and return a JSON object with the structure shown below.

Context:
- Expected paycheck deposits: ~$${paycheckAmount} every 2 weeks
- Expected bonus deposits: $${bonusRange.min}-$${bonusRange.max} (much larger than normal deposits, occurs quarterly on last paycheck of month after quarter ends)

Transactions:
${JSON.stringify(transactions, null, 2)}

Return a JSON object with this exact structure:
{
  "automated_payments": [
    {
      "vendor": "string",
      "amount": number,
      "frequency": "monthly|bi-weekly|weekly|quarterly|annual",
      "last_occurrence": "ISO date string",
      "category": "rent|utilities|investments|media|other"
    }
  ],
  "anomalies": [
    {
      "transaction_index": number,
      "reason": "string (why this is considered an anomaly)"
    }
  ],
  "paychecks": [
    {
      "transaction_index": number,
      "amount": number,
      "date": "ISO date string",
      "is_bonus": boolean
    }
  ],
  "bonuses": [
    {
      "transaction_index": number,
      "amount": number,
      "date": "ISO date string"
    }
  ],
  "categories": [
    {
      "transaction_index": number,
      "category": "rent|utilities|investments|media|groceries|dining|transportation|entertainment|healthcare|shopping|subscriptions|insurance|other",
      "confidence": number (0-1)
    }
  ]
}

Rules:
1. Automated payments are recurring transactions with consistent amounts
2. Anomalies are one-off large purchases, transfers, or unusual transactions
3. Paychecks are deposits around $${paycheckAmount}
4. Bonuses are much larger deposits ($${bonusRange.min}+) that are irregular
5. Categories should match the predefined list
6. Be conservative with automated payment detection - only include truly recurring payments
`;
}
