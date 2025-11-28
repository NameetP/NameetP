// Core type definitions for Factory OS

export type SubscriptionTier = 'free' | 'pro' | 'growth' | 'scale';

export type OutreachType = 'email' | 'linkedin' | 'followup' | 'call_script';

export type FitScore = 'A' | 'B' | 'C';

export type LeadStatus = 'pending' | 'researching' | 'composing' | 'qualifying' | 'completed' | 'failed';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LeadInput {
  name?: string;
  company?: string;
  website?: string;
  linkedinUrl?: string;
  email?: string;
}

export interface ResearchResult {
  company: string;
  valueProps: string[];
  productCategories: string[];
  icpIndicators: string[];
  painSignals: string[];
  pricingIndicators: string[];
  websiteContent: string;
}

export interface LeadQualification {
  leadName: string;
  company: string;
  fitScore: FitScore;
  whyFit: string;
  painPoints: string[];
  outreachEmail: string;
  linkedinDm: string;
  callScript: string;
  predictedObjections: string[];
  recommendedNextStep: string;
  urgencyFraming: string;
}

export interface ProcessingStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  message?: string;
}

export interface TierLimits {
  leadsPerMonth: number;
  autoSend: boolean;
  crmIntegration: boolean;
  callScripts: boolean;
  dailyScans: boolean;
  multiChannel: boolean;
  parallelAgents: boolean;
  price: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    leadsPerMonth: 20,
    autoSend: false,
    crmIntegration: false,
    callScripts: false,
    dailyScans: false,
    multiChannel: false,
    parallelAgents: false,
    price: 0,
  },
  pro: {
    leadsPerMonth: 500,
    autoSend: true,
    crmIntegration: true,
    callScripts: true,
    dailyScans: true,
    multiChannel: false,
    parallelAgents: false,
    price: 39,
  },
  growth: {
    leadsPerMonth: 2500,
    autoSend: true,
    crmIntegration: true,
    callScripts: true,
    dailyScans: true,
    multiChannel: true,
    parallelAgents: true,
    price: 99,
  },
  scale: {
    leadsPerMonth: -1, // unlimited
    autoSend: true,
    crmIntegration: true,
    callScripts: true,
    dailyScans: true,
    multiChannel: true,
    parallelAgents: true,
    price: 299,
  },
};
