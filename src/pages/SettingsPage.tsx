import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { Crown, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { stripeApi } from '@/api/stripe';
import * as authApi from '@/api/auth';

const inputClass =
  'mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Failed to change password');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-card-foreground">Change Password</h2>
      <p className="mt-1 text-sm text-muted-foreground">Update your password to keep your account secure.</p>

      <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-500">{success}</div>}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">Must be 8-128 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Changing...' : 'Change Password'}
        </Button>
      </form>
    </div>
  );
}

function ChangeEmailSection() {
  const { user, refreshUser } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await authApi.changeEmail(newEmail, password);
      await refreshUser();
      setSuccess('Email updated successfully');
      setNewEmail('');
      setPassword('');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Failed to change email');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-card-foreground">Change Email</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Current email: <span className="font-medium text-foreground">{user?.email}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-500">{success}</div>}

        <div>
          <label htmlFor="newEmail" className="block text-sm font-medium text-foreground">
            New Email
          </label>
          <input
            id="newEmail"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="emailPassword" className="block text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <input
            id="emailPassword"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Email'}
        </Button>
      </form>
    </div>
  );
}

function DeleteAccountSection() {
  const { clearUser } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.deleteAccount(password);
      clearUser();
      navigate('/login', { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Failed to delete account');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-destructive/50 bg-card p-6">
      <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <Button variant="destructive" className="mt-4" onClick={() => setShowConfirm(true)}>
          Delete Account
        </Button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 max-w-md space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground">
            This will permanently delete your account, all campaigns you own, your characters, and campaign
            memberships. This cannot be undone.
          </div>

          <div>
            <label htmlFor="deletePassword" className="block text-sm font-medium text-foreground">
              Enter your password to confirm
            </label>
            <input
              id="deletePassword"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowConfirm(false);
                setPassword('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Permanently Delete Account'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

const TIER_DISPLAY: Record<string, string> = {
  free: 'Wanderer (Free)',
  hobbyist: 'Hobbyist',
  pro: 'Game Master',
  professional: 'Pro',
};

function SubscriptionSection() {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const tier = user?.subscriptionTier ?? 'free';
  const isPaid = tier !== 'free';

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await stripeApi.createPortalSession();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to open subscription portal');
      setPortalLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">Subscription</h2>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className={`h-5 w-5 ${isPaid ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium text-foreground">{TIER_DISPLAY[tier] ?? tier}</span>
            </div>
            {user?.subscriptionStatus && user.subscriptionStatus !== 'active' && (
              <p className="mt-1 text-sm text-muted-foreground capitalize">
                Status: {user.subscriptionStatus}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {isPaid && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {portalLoading ? 'Loading...' : 'Manage'}
              </Button>
            )}
            {!isPaid && (
              <Button onClick={() => setShowUpgrade(true)}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          currentTier={tier}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const isLocal = user?.provider === 'local';
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const subscription = searchParams.get('subscription');
    if (subscription === 'success') {
      toast.success('Subscription activated! Your credits have been added.');
      searchParams.delete('subscription');
      setSearchParams(searchParams, { replace: true });
    } else if (subscription === 'cancelled') {
      toast.info('Subscription upgrade was cancelled.');
      searchParams.delete('subscription');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <PageContainer title="Settings" subtitle="Manage your account">
      <div className="space-y-6">
        <SubscriptionSection />

        {isLocal && <ChangePasswordSection />}
        {isLocal && <ChangeEmailSection />}

        {!isLocal && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-card-foreground">Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You signed in with Google. Password and email changes are managed through your Google account.
            </p>
          </div>
        )}

        {isLocal && <DeleteAccountSection />}
      </div>
    </PageContainer>
  );
}
