// Agent Orchestrator - Coordinates all agents for full lead processing

import Anthropic from '@anthropic-ai/sdk';
import { buildFullAgentPrompt } from './prompts';
import { crawlWebsite } from './research';
import { LeadQualification, LeadInput, OutreachType, ProcessingStep } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ProcessLeadOptions {
  productDescription: string;
  outreachType: OutreachType;
  leadData: LeadInput;
  onProgress?: (step: ProcessingStep) => void;
}

/**
 * Main orchestrator - processes a single lead through all agents
 * This is the primary entry point for lead processing
 */
export async function processLead(options: ProcessLeadOptions): Promise<LeadQualification> {
  const { productDescription, outreachType, leadData, onProgress } = options;

  try {
    // Step 1: Crawl website
    onProgress?.({
      step: 'research',
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      message: `Crawling ${leadData.website}`,
    });

    if (!leadData.website) {
      throw new Error('Website URL is required');
    }

    const websiteContent = await crawlWebsite(leadData.website);

    onProgress?.({
      step: 'research',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });

    // Step 2: Run full agent pipeline (single Claude call for speed)
    onProgress?.({
      step: 'analyze',
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      message: 'Analyzing fit and generating outreach',
    });

    const prompt = buildFullAgentPrompt(
      productDescription,
      outreachType,
      websiteContent,
      leadData
    );

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.5,
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
    const result = JSON.parse(cleaned) as LeadQualification;

    onProgress?.({
      step: 'analyze',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });

    onProgress?.({
      step: 'completed',
      status: 'completed',
      timestamp: new Date().toISOString(),
      message: `Lead qualified as ${result.fitScore}`,
    });

    return result;
  } catch (error: any) {
    console.error('Failed to process lead:', error);

    onProgress?.({
      step: 'failed',
      status: 'failed',
      timestamp: new Date().toISOString(),
      message: error.message,
    });

    throw error;
  }
}

/**
 * Process multiple leads in parallel (for Pro+ users)
 */
export async function processLeadBatch(
  leads: LeadInput[],
  options: Omit<ProcessLeadOptions, 'leadData'>,
  maxConcurrency = 3
): Promise<LeadQualification[]> {
  const results: LeadQualification[] = [];
  const queue = [...leads];

  async function processNext(): Promise<void> {
    const lead = queue.shift();
    if (!lead) return;

    try {
      const result = await processLead({
        ...options,
        leadData: lead,
      });
      results.push(result);
    } catch (error) {
      console.error('Failed to process lead in batch:', error);
      // Continue processing other leads
    }

    if (queue.length > 0) {
      await processNext();
    }
  }

  // Start parallel processing
  const workers = Array(Math.min(maxConcurrency, leads.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);

  return results;
}
