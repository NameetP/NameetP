'use client';

import { useEffect, useState } from 'react';
import { Download, Mail, Send, Edit, RefreshCw, CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Lead {
  id: string;
  name: string;
  company: string;
  website: string;
  fitScore: string;
  fitRationale: string;
  painPoints: string[];
  outreachEmail?: string;
  linkedinDm?: string;
  callScript?: string;
  predictedObjections: string[];
  recommendedNextStep: string;
}

interface Batch {
  id: string;
  productDescription: string;
  outreachType: string;
  totalLeads: number;
  leads: Lead[];
}

export default function ResultsPage({ params }: { params: { batchId: string } }) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');

  useEffect(() => {
    loadBatch();
  }, [params.batchId]);

  const loadBatch = async () => {
    try {
      const response = await fetch(`/api/batches/${params.batchId}/results`);
      if (!response.ok) throw new Error('Failed to load results');

      const data = await response.json();
      setBatch(data);

      if (!selectedLead && data.leads.length > 0) {
        setSelectedLead(data.leads[0].id);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    }
  };

  const handleExportCSV = () => {
    if (!batch) return;

    const headers = ['Name', 'Company', 'Website', 'Fit Score', 'Fit Rationale', 'Pain Points', 'Outreach', 'Next Step'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.company,
      lead.website,
      lead.fitScore,
      lead.fitRationale,
      lead.painPoints.join('; '),
      lead.outreachEmail || lead.linkedinDm || lead.callScript || '',
      lead.recommendedNextStep,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factory-os-results-${params.batchId}.csv`;
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (!batch) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading results...</div>
      </div>
    );
  }

  const filteredLeads = filter === 'all'
    ? batch.leads
    : batch.leads.filter(l => l.fitScore === filter);

  const currentLead = batch.leads.find(l => l.id === selectedLead);

  const stats = {
    A: batch.leads.filter(l => l.fitScore === 'A').length,
    B: batch.leads.filter(l => l.fitScore === 'B').length,
    C: batch.leads.filter(l => l.fitScore === 'C').length,
  };

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-gray-800 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Outreach Generated</h1>
            <div className="flex gap-6 text-sm">
              <span className="text-gray-400">
                Total: <span className="text-white font-medium">{batch.totalLeads}</span>
              </span>
              <span className="text-green-400">
                A-tier: <span className="font-medium">{stats.A}</span>
              </span>
              <span className="text-yellow-400">
                B-tier: <span className="font-medium">{stats.B}</span>
              </span>
              <span className="text-gray-400">
                C-tier: <span className="font-medium">{stats.C}</span>
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button disabled className="opacity-50">
              <Send className="w-4 h-4 mr-2" />
              Auto-Send (Pro)
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Lead List */}
        <div className="w-80 border-r border-gray-800 overflow-y-auto">
          <div className="p-3 border-b border-gray-800 flex gap-2">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'A' ? 'default' : 'outline'}
              onClick={() => setFilter('A')}
            >
              A-tier
            </Button>
            <Button
              size="sm"
              variant={filter === 'B' ? 'default' : 'outline'}
              onClick={() => setFilter('B')}
            >
              B-tier
            </Button>
            <Button
              size="sm"
              variant={filter === 'C' ? 'default' : 'outline'}
              onClick={() => setFilter('C')}
            >
              C-tier
            </Button>
          </div>

          <div className="divide-y divide-gray-800">
            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead.id)}
                className={`w-full p-4 text-left hover:bg-gray-800/50 transition-colors ${
                  selectedLead === lead.id ? 'bg-gray-800' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium truncate">{lead.company}</div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                      lead.fitScore === 'A'
                        ? 'bg-green-500/20 text-green-400'
                        : lead.fitScore === 'B'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {lead.fitScore}
                  </span>
                </div>
                <div className="text-sm text-gray-400 truncate">{lead.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Lead Details */}
        <div className="flex-1 overflow-y-auto">
          {currentLead ? (
            <div className="p-8 max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{currentLead.company}</h2>
                    <div className="text-gray-400">{currentLead.name}</div>
                    <a
                      href={currentLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline"
                    >
                      {currentLead.website}
                    </a>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-lg text-lg font-bold ${
                      currentLead.fitScore === 'A'
                        ? 'bg-green-500/20 text-green-400'
                        : currentLead.fitScore === 'B'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    Fit: {currentLead.fitScore}
                  </span>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Why this score:</div>
                  <div className="text-gray-200">{currentLead.fitRationale}</div>
                </div>
              </div>

              {/* Pain Points */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Pain Points</h3>
                <ul className="space-y-2">
                  {currentLead.painPoints.map((pain, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-gray-300">{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outreach */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">
                    {batch.outreachType === 'email' || batch.outreachType === 'followup'
                      ? 'Email Outreach'
                      : batch.outreachType === 'linkedin'
                      ? 'LinkedIn DM'
                      : 'Call Script'}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(currentLead.outreachEmail || currentLead.linkedinDm || currentLead.callScript || '')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap">
                  {currentLead.outreachEmail || currentLead.linkedinDm || currentLead.callScript}
                </div>
              </div>

              {/* Predicted Objections */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Predicted Objections</h3>
                <ul className="space-y-2">
                  {currentLead.predictedObjections.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">⚠</span>
                      <span className="text-gray-300">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Step */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-blue-400">Recommended Next Step</h3>
                <p className="text-gray-300">{currentLead.recommendedNextStep}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a lead to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
