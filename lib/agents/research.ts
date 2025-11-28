// Research Agent - Website crawler and intelligence extractor

import Anthropic from '@anthropic-ai/sdk';
import { RESEARCH_PROMPT } from './prompts';
import { ResearchResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function crawlWebsite(url: string): Promise<string> {
  try {
    // Simple fetch-based crawler for v1
    // TODO: Replace with Firecrawl API for production
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FactoryOS/1.0; +https://factory-os.com)',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract text content (simple extraction, good enough for v1)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.slice(0, 8000); // Limit to 8k chars
  } catch (error: any) {
    console.error(`Failed to crawl ${url}:`, error.message);
    return `[Failed to crawl website: ${error.message}]`;
  }
}

export async function analyzeWebsite(
  websiteContent: string,
  company: string
): Promise<ResearchResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.3,
      system: RESEARCH_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this website for: ${company}\n\nWebsite content:\n${websiteContent}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleaned);

    return {
      company: analysis.company || company,
      valueProps: analysis.valueProps || [],
      productCategories: analysis.productCategories || [],
      icpIndicators: analysis.icpIndicators || [],
      painSignals: analysis.painSignals || [],
      pricingIndicators: analysis.pricingIndicators || [],
      websiteContent: websiteContent.slice(0, 2000),
    };
  } catch (error: any) {
    console.error('Failed to analyze website:', error);

    // Return minimal result on failure
    return {
      company,
      valueProps: [],
      productCategories: [],
      icpIndicators: [],
      painSignals: [],
      pricingIndicators: [],
      websiteContent: websiteContent.slice(0, 2000),
    };
  }
}

export async function researchLead(leadData: {
  name?: string;
  company?: string;
  website?: string;
}): Promise<ResearchResult> {
  if (!leadData.website) {
    throw new Error('Website URL is required for research');
  }

  // Step 1: Crawl website
  const websiteContent = await crawlWebsite(leadData.website);

  // Step 2: Analyze with AI
  const analysis = await analyzeWebsite(websiteContent, leadData.company || 'Unknown Company');

  return analysis;
}
