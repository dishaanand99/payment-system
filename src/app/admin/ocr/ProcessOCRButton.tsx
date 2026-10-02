'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { processDonationOCR } from './actions';

export function ProcessOCRButton({ donationId, label }: { donationId: string, label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await processDonationOCR(donationId);
      if (!res.success) {
        setError(res.error || 'OCR failed');
        alert('OCR failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
      alert('Error occurred: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="primary" 
      className="!px-3 !py-1.5 text-xs" 
      onClick={handleProcess} 
      disabled={loading}
    >
      {loading ? 'Processing...' : label}
    </Button>
  );
}
