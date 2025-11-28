// Outreach Agent - Personalized message generation

import Anthropic from '@anthropic-ai/sdk';
import { OUTREACH_PROMPT } from './prompts';
import { ResearchResult, OutreachType } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface OutreachResult {
  email?: string;
  linkedinDm?: string;
  callScript?: string;
}

export async function generateOutreach(
  productDescription: string,
  outreachType: OutreachType,
  leadData: {
    name?: string;
    company?: string;
  },
  research: ResearchResult
): Promise<OutreachResult> {
  try {
    const prompt = buildOutreachPrompt(productDescription, outreachType, leadData, research);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7, // Higher temp for more creative, human-sounding copy
      system: OUTREACH_PROMPT,
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
      email: result.email,
      linkedinDm: result.linkedinDm,
      callScript: result.callScript,
    };
  } catch (error: any) {
    console.error('Failed to generate outreach:', error);

    // Return fallback message
    return {
      email: generateFallbackEmail(productDescription, leadData),
    };
  }
}

function buildOutreachPrompt(
  productDescription: string,
  outreachType: OutreachType,
  leadData: { name?: string; company?: string },
  research: ResearchResult
): string {
  return `Generate ${outreachType} outreach.

USER'S PRODUCT:
${productDescription}

LEAD:
Name: ${leadData.name || 'Unknown'}
Company: ${research.company}

RESEARCH:
Value Props: ${research.valueProps.join(', ')}
Pain Signals: ${research.painSignals.join(', ')}
ICP Indicators: ${research.icpIndicators.join(', ')}

REQUIREMENTS:
- Personalize based on their business
- Connect product value to their pain
- Keep it concise and human
- Clear CTA

RETURN JSON:
{
  ${outreachType === 'email' || outreachType === 'followup' ? '"email": "string",' : ''}
  ${outreachType === 'linkedin' ? '"linkedinDm": "string",' : ''}
  ${outreachType === 'call_script' ? '"callScript": "string"' : ''}
}`;
}

function generateFallbackEmail(productDescription: string, leadData: { name?: string; company?: string }): string {
  return `Hi ${leadData.name || 'there'},

I noticed ${leadData.company || 'your company'} and thought our product might be relevant.

${productDescription}

Would you be open to a quick conversation about how we might help?

Best,
[Your Name]`;
}
