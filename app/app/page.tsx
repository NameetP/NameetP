'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { downloadSampleCSV } from '@/lib/csv-parser';

export default function InputConsolePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productDescription, setProductDescription] = useState('');
  const [outreachType, setOutreachType] = useState('email');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productDescription.trim()) {
      alert('Please describe your product');
      return;
    }

    if (!selectedFile) {
      alert('Please upload a lead list');
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('productDescription', productDescription);
      formData.append('outreachType', outreachType);

      // Upload and process
      const response = await fetch('/api/batches/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create batch');
      }

      const { batchId } = await response.json();

      // Navigate to workspace
      router.push(`/app/workspace/${batchId}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Generate Your Outreach</h1>
        <p className="text-gray-400">
          Upload leads, describe your product, and watch our AI agents work their magic
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Description */}
        <div className="space-y-3">
          <Label htmlFor="product" className="text-base">
            What's your product?
          </Label>
          <Input
            id="product"
            placeholder="e.g., AI-powered customer support platform for SaaS companies"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            className="h-12 text-base"
            required
          />
          <p className="text-sm text-gray-500">
            One-line description of what you sell and who you help
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <Label htmlFor="file" className="text-base">
            Upload lead list
          </Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              selectedFile
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              required
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-6 h-6 text-green-500" />
                <span className="text-green-500 font-medium">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-2">Click to upload CSV</p>
                <p className="text-sm text-gray-600">
                  Required: name, company, website
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={downloadSampleCSV}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Download sample CSV template
          </button>
        </div>

        {/* Outreach Type */}
        <div className="space-y-3">
          <Label htmlFor="outreach-type" className="text-base">
            What type of outreach?
          </Label>
          <Select value={outreachType} onValueChange={setOutreachType}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Cold Email</SelectItem>
              <SelectItem value="linkedin">LinkedIn DM</SelectItem>
              <SelectItem value="followup">Follow-up</SelectItem>
              <SelectItem value="call_script">Qualification Call Script</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Generate My Outreach
            </>
          )}
        </Button>

        <p className="text-center text-sm text-gray-500">
          Target latency: 5-8 seconds per lead
        </p>
      </form>
    </div>
  );
}
