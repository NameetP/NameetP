// Qualification Agent - Lead scoring and objection prediction

import Anthropic from '@anthropic-ai/sdk';
import { QUALIFICATION_PROMPT } from './prompts';
import { ResearchResult, FitScore } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface QualificationResult {
  fitScore: FitScore;
  fitRationale: string;
  painPoints: string[];
  predictedObjections: string[];
  recommendedNextStep: string;
  urgencyFraming: string;
}

export async function qualifyLead(
  productDescription: string,
  research: ResearchResult,
  outreachContent?: string
): Promise<QualificationResult> {
  try {
    const prompt = buildQualificationPrompt(productDescription, research, outreachContent);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.3,
      system: QUALIFICATION_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      fitScore: result.fitScore || 'B',
      fitRationale: result.fitRationale || 'Unable to determine fit',
      painPoints: result.painPoints || [],
      predictedObjections: result.predictedObjections || [],
      recommendedNextStep: result.recommendedNextStep || 'Wait for reply',
      urgencyFraming: result.urgencyFraming || '',
    };
  } catch (error: any) {
    console.error('Failed to qualify lead:', error);

    // Return conservative default
    return {
      fitScore: 'B',
      fitRationale: 'Automatic qualification failed',
      painPoints: [],
      predictedObjections: ['Not interested', 'Bad timing'],
      recommendedNextStep: 'Wait for reply and follow up in 3 days',
      urgencyFraming: '',
    };
  }
}

function buildQualificationPrompt(
  productDescription: string,
  research: ResearchResult,
  outreachContent?: string
): string {
  return `Qualify this lead.

USER'S PRODUCT:
${productDescription}

LEAD RESEARCH:
Company: ${research.company}
Value Props: ${research.valueProps.join(', ')}
Pain Signals: ${research.painSignals.join(', ')}
ICP Indicators: ${research.icpIndicators.join(', ')}
Pricing Indicators: ${research.pricingIndicators.join(', ')}

${outreachContent ? `OUTREACH SENT:\n${outreachContent}\n` : ''}

Score the fit (A/B/C), predict objections, recommend next steps.

RETURN JSON:
{
  "fitScore": "A" | "B" | "C",
  "fitRationale": "string",
  "painPoints": ["string"],
  "predictedObjections": ["string"],
  "recommendedNextStep": "string",
  "urgencyFraming": "string"
}`;
}
