// CSV Parser and Lead Ingestion

import Papa from 'papaparse';
import { LeadInput } from '@/types';
import { normalizeUrl, validateEmail } from './utils';

export interface ParseResult {
  leads: LeadInput[];
  errors: string[];
  warnings: string[];
}

export interface CSVRow {
  name?: string;
  company?: string;
  website?: string;
  linkedin?: string;
  linkedinUrl?: string;
  linkedin_url?: string;
  email?: string;
  [key: string]: any; // Allow extra columns
}

/**
 * Parse CSV file containing lead data
 * Expected columns: name, company, website, linkedin/linkedinUrl, email (all optional but website recommended)
 */
export async function parseLeadCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const leads: LeadInput[] = [];

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize headers
        return header.toLowerCase().trim().replace(/\s+/g, '_');
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          errors.push(...results.errors.map(e => `Row ${e.row}: ${e.message}`));
        }

        results.data.forEach((row, index) => {
          try {
            const lead = parseLeadRow(row, index + 2); // +2 for header and 1-indexing

            if (lead) {
              leads.push(lead);
            } else {
              warnings.push(`Row ${index + 2}: Skipped (no valid data)`);
            }
          } catch (error: any) {
            errors.push(`Row ${index + 2}: ${error.message}`);
          }
        });

        if (leads.length === 0) {
          errors.push('No valid leads found in CSV');
        }

        resolve({ leads, errors, warnings });
      },
      error: (error) => {
        errors.push(`Parse error: ${error.message}`);
        resolve({ leads: [], errors, warnings });
      },
    });
  });
}

function parseLeadRow(row: CSVRow, rowNumber: number): LeadInput | null {
  // Extract fields with multiple possible column names
  const name = row.name || row.contact_name || row.first_name;
  const company = row.company || row.company_name || row.organization;
  const website = row.website || row.url || row.domain || row.company_website;
  const linkedinUrl = row.linkedin || row.linkedinUrl || row.linkedin_url || row.linkedin_profile;
  const email = row.email || row.email_address;

  // At minimum, we need either website or company name
  if (!website && !company) {
    return null;
  }

  const lead: LeadInput = {};

  if (name) {
    lead.name = name.trim();
  }

  if (company) {
    lead.company = company.trim();
  }

  if (website) {
    try {
      lead.website = normalizeUrl(website.trim());
    } catch (error) {
      console.warn(`Row ${rowNumber}: Invalid website URL: ${website}`);
    }
  }

  if (linkedinUrl) {
    lead.linkedinUrl = linkedinUrl.trim();
  }

  if (email) {
    const trimmedEmail = email.trim();
    if (validateEmail(trimmedEmail)) {
      lead.email = trimmedEmail;
    } else {
      console.warn(`Row ${rowNumber}: Invalid email: ${email}`);
    }
  }

  return lead;
}

/**
 * Validate a batch of leads
 */
export function validateLeads(leads: LeadInput[]): { valid: LeadInput[]; invalid: Array<{ lead: LeadInput; reason: string }> } {
  const valid: LeadInput[] = [];
  const invalid: Array<{ lead: LeadInput; reason: string }> = [];

  for (const lead of leads) {
    if (!lead.website && !lead.company) {
      invalid.push({
        lead,
        reason: 'Missing both website and company name',
      });
      continue;
    }

    if (lead.website) {
      try {
        new URL(lead.website);
        valid.push(lead);
      } catch {
        invalid.push({
          lead,
          reason: 'Invalid website URL',
        });
      }
    } else {
      // If no website but has company, it's still valid (we can try to find website)
      valid.push(lead);
    }
  }

  return { valid, invalid };
}

/**
 * Generate a sample CSV template
 */
export function generateSampleCSV(): string {
  const headers = ['name', 'company', 'website', 'linkedin_url', 'email'];
  const sampleRows = [
    ['John Doe', 'Acme Corp', 'https://acme.com', 'https://linkedin.com/in/johndoe', 'john@acme.com'],
    ['Jane Smith', 'Tech Startup', 'https://techstartup.io', '', 'jane@techstartup.io'],
    ['', 'Enterprise Inc', 'https://enterprise.com', '', ''],
  ];

  const csv = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}

/**
 * Download sample CSV template
 */
export function downloadSampleCSV(): void {
  const csv = generateSampleCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'lead_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
