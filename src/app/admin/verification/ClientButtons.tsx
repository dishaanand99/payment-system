'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { runAutoVerification, manualVerifyDecision, seedMockTrustedTransaction } from './actions';
import { VerificationDecision } from '@/lib/verification/types';

export function AutoVerifyButton({ donationId }: { donationId: string }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const res = await runAutoVerification(donationId);
      if (res.overallDecision === 'VERIFIED') {
        alert('Verified automatically!');
      } else {
        alert(`Result: ${res.overallDecision}\nReason: ${res.reason}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert('Error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={handle} disabled={loading}>
      {loading ? 'Running...' : 'Auto-Match'}
    </Button>
  );
}

export function ManualDecisionButtons({ donationId }: { donationId: string }) {
    const [loading, setLoading] = useState(false);

    const handle = async (decision: VerificationDecision) => {
      const reason = prompt(`Reason for ${decision}?`);
      if (!reason && decision !== 'VERIFIED') return;
      setLoading(true);
      try {
        await manualVerifyDecision(donationId, decision, reason || 'Manual verification.');
        alert('Saved.');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        alert('Error: ' + msg);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="flex gap-2">
        <Button variant="primary" onClick={() => handle('VERIFIED')} disabled={loading}>Approve (Verified)</Button>
        <Button variant="secondary" onClick={() => handle('NEEDS_MANUAL_REVIEW')} disabled={loading}>Mark Review</Button>
        <Button variant="danger" onClick={() => handle('REJECTED')} disabled={loading}>Reject</Button>
      </div>
    );
}

export function MockTransactionForm({ donationId, defaultAmount, defaultUtr, defaultDate }: { donationId: string, defaultAmount: number, defaultUtr: string | null, defaultDate: string | null }) {
    const [loading, setLoading] = useState(false);

    const handle = async () => {
      const utr = prompt('UTR:', defaultUtr || '');
      if (!utr) return;
      const amountStr = prompt('Amount:', String(defaultAmount));
      if (!amountStr) return;
      
      setLoading(true);
      try {
        await seedMockTrustedTransaction(donationId, {
            utr,
            amount: parseFloat(amountStr),
            date: defaultDate || new Date().toISOString()
        });
        alert('Mock transaction injected!');
      } catch (e: any) {
        alert('Error: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <Button variant="secondary" className="!text-xs border-dashed" onClick={handle} disabled={loading}>
        Inject Mock Bank Tx (Phase 6 Test)
      </Button>
    );
}
