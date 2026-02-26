import { useState } from 'react';
import { api } from '@/api/client';

interface AgeVerificationModalProps {
  onVerified: () => void;
  onCancel: () => void;
}

export function AgeVerificationModal({ onVerified, onCancel }: AgeVerificationModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!agreed) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/users/verify-age');
      onVerified();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-6 texture-parchment">
        <h2 className="mb-4 font-['IM_Fell_English'] text-2xl font-bold text-primary">
          Age Verification Required
        </h2>

        <div className="mb-6 space-y-4">
          <p className="text-muted-foreground">
            AI-powered features generate unpredictable content that may include
            mature themes, combat descriptions, horror elements, and morally complex scenarios.
          </p>

          <p className="text-muted-foreground">
            To use AI features, you must be{' '}
            <strong className="text-primary">18 years of age or older</strong>.
          </p>

          <div className="rounded border border-border bg-background/50 p-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Note:</strong> You can still use all
            non-AI features (character sheets, dice roller, session tools, campaigns)
            without age verification.
          </div>
        </div>

        <label className="group mb-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 accent-amber-600"
          />
          <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            I confirm that I am 18 years of age or older and understand that
            AI-generated content may contain mature themes.
          </span>
        </label>

        {error && (
          <div className="mb-4 rounded border border-red-600 bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded border border-border px-4 py-2 text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!agreed || loading}
            className="btn-emboss flex-1 rounded bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Confirm & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
