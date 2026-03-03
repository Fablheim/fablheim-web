import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { Crown, ExternalLink, KeyRound, Mail, ShieldCheck, TriangleAlert, UserCog } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { stripeApi } from '@/api/stripe';
import * as authApi from '@/api/auth';

const inputClass =
  'mt-1 block w-full rounded-md border border-input/85 bg-background/75 px-3 py-2.5 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

const sectionCardClass =
  'app-card rounded-xl border border-[color:var(--mkt-border)]/80 bg-[linear-gradient(180deg,hsla(32,26%,15%,0.28)_0%,hsla(24,16%,8%,0.5)_100%)] p-6';

const sectionHeaderClass = 'font-[Cinzel] text-lg font-semibold text-foreground';

const feedbackClass = {
  error: 'rounded-md border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive',
  success: 'rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400',
};

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
    <section className={sectionCardClass}>
      <header className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
          <KeyRound className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className={sectionHeaderClass}>Change Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Update your password to keep your account secure.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
        {error && <div className={feedbackClass.error}>{error}</div>}
        {success && <div className={feedbackClass.success}>{success}</div>}

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
    </section>
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
    <section className={sectionCardClass}>
      <header className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
          <Mail className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className={sectionHeaderClass}>Change Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current email: <span className="font-medium text-foreground">{user?.email}</span>
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
        {error && <div className={feedbackClass.error}>{error}</div>}
        {success && <div className={feedbackClass.success}>{success}</div>}

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
    </section>
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
    <section className="rounded-xl border border-destructive/45 bg-[linear-gradient(180deg,hsla(0,46%,22%,0.22)_0%,hsla(24,16%,9%,0.58)_100%)] p-6 shadow-[inset_0_1px_0_hsla(0,64%,72%,0.12)]">
      <header className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-destructive/35 bg-destructive/10 text-destructive">
          <TriangleAlert className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-[Cinzel] text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
      </header>

      {!showConfirm ? (
        <Button variant="destructive" className="mt-4" onClick={() => setShowConfirm(true)}>
          Delete Account
        </Button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 max-w-md space-y-4">
          {error && <div className={feedbackClass.error}>{error}</div>}

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
    </section>
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
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to open subscription portal');
      } else {
        toast.error('Failed to open subscription portal');
      }
      setPortalLoading(false);
    }
  };

  return (
    <>
      <section className={sectionCardClass}>
        <header className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
            <Crown className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className={sectionHeaderClass}>Subscription</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manage plan tier, billing access, and credits flow.</p>
          </div>
        </header>

        <div className="mt-4 flex items-center justify-between gap-4">
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
      </section>

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
    <PageContainer title="Settings" subtitle="Control your account, billing, and security">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="app-card rounded-xl border border-[color:var(--mkt-border)]/85 bg-[linear-gradient(160deg,hsla(38,84%,56%,0.14)_0%,hsla(24,16%,11%,0.88)_46%,hsla(24,16%,7%,0.94)_100%)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account Command</p>
              <h2 className="mt-1 font-[Cinzel] text-2xl text-foreground">Manage Access & Security</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--mkt-border)]/75 bg-black/25 px-3 py-2">
              <UserCog className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                {isLocal ? 'Local Account' : 'Google Account'}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <SubscriptionSection />
            {isLocal && <ChangePasswordSection />}
            {isLocal && <ChangeEmailSection />}
          </div>

          <div className="space-y-6">
            <section className={sectionCardClass}>
              <header className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className={sectionHeaderClass}>Security Notes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep your account protected with strong credentials and regular password updates.
                  </p>
                </div>
              </header>

              <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <p className="rounded-md border border-border/65 bg-accent/25 px-3 py-2.5">
                  Use unique passwords for your Fablheim account.
                </p>
                <p className="rounded-md border border-border/65 bg-accent/25 px-3 py-2.5">
                  Avoid sharing account access with other players.
                </p>
                {!isLocal && (
                  <p className="rounded-md border border-border/65 bg-accent/25 px-3 py-2.5">
                    Google-authenticated accounts manage password and email at Google.
                  </p>
                )}
              </div>
            </section>

            {!isLocal && (
              <section className={sectionCardClass}>
                <h2 className={sectionHeaderClass}>Account Provider</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You signed in with Google. Password and email changes are managed through your Google account settings.
                </p>
              </section>
            )}

            {isLocal && <DeleteAccountSection />}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
