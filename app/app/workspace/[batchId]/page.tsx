'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Lead {
  id: string;
  name: string;
  company: string;
  website: string;
  status: string;
  fitScore?: string;
  processingLog?: Array<{ step: string; status: string; message?: string }>;
}

interface Batch {
  id: string;
  status: string;
  totalLeads: number;
  processedLeads: number;
  leads: Lead[];
}

export default function WorkspacePage({ params }: { params: { batchId: string } }) {
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    loadBatch();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadBatch, 2000);

    return () => clearInterval(interval);
  }, [params.batchId]);

  const loadBatch = async () => {
    try {
      const response = await fetch(`/api/batches/${params.batchId}`);
      if (!response.ok) throw new Error('Failed to load batch');

      const data = await response.json();
      setBatch(data);

      // Auto-select first lead if none selected
      if (!selectedLead && data.leads.length > 0) {
        setSelectedLead(data.leads[0].id);
      }

      // Redirect to results when complete
      if (data.status === 'completed') {
        setTimeout(() => {
          router.push(`/app/results/${params.batchId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to load batch:', error);
    }
  };

  if (!batch) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const progress = (batch.processedLeads / batch.totalLeads) * 100;
  const currentLead = batch.leads.find((l) => l.id === selectedLead);

  return (
    <div className="h-[calc(100vh-73px)] flex">
      {/* Left: Lead List */}
      <div className="w-80 border-r border-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Processing Batch</div>
          <div className="text-2xl font-bold mb-3">
            {batch.processedLeads} / {batch.totalLeads}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="divide-y divide-gray-800">
          {batch.leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead.id)}
              className={`w-full p-4 text-left hover:bg-gray-800/50 transition-colors ${
                selectedLead === lead.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium truncate">{lead.company}</div>
                {lead.status === 'completed' && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                {lead.status === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                {lead.status !== 'completed' && lead.status !== 'failed' && (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                )}
              </div>
              <div className="text-sm text-gray-400 truncate">{lead.name}</div>
              {lead.fitScore && (
                <div className="mt-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      lead.fitScore === 'A'
                        ? 'bg-green-500/20 text-green-400'
                        : lead.fitScore === 'B'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    Fit: {lead.fitScore}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Activity Stream */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Agent Activity</h2>

          {currentLead && (
            <div className="space-y-4">
              {currentLead.processingLog?.map((log, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="mt-1">
                    {log.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {log.status === 'in_progress' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {log.status === 'pending' && (
                      <Clock className="w-5 h-5 text-gray-500" />
                    )}
                    {log.status === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">{log.step}</div>
                    {log.message && (
                      <div className="text-sm text-gray-400 mt-1">{log.message}</div>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-gray-500 italic">Waiting to start...</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="w-96 border-l border-gray-800 overflow-y-auto bg-gray-900/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Output Preview</h3>

          {currentLead?.status === 'completed' ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Fit Score</div>
                <span
                  className={`inline-block px-3 py-1 rounded font-medium ${
                    currentLead.fitScore === 'A'
                      ? 'bg-green-500/20 text-green-400'
                      : currentLead.fitScore === 'B'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {currentLead.fitScore}
                </span>
              </div>

              <div className="text-sm text-gray-400 italic">
                Full results available on completion
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Processing in progress...
            </div>
          )}
        </div>
      </div>

      {/* Completion Redirect Notice */}
      {batch.status === 'completed' && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">All leads processed!</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
