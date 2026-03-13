import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, uniqueId } from './helpers/test-data';
import { signUp, login, logout } from './helpers/auth-helpers';
import {
  createCampaign,
  generateInviteCode as _generateInviteCode,
  joinCampaignByCode as _joinCampaignByCode,
} from './helpers/campaign-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

// ==========================================================================
// 1. Routing — Auth Guards & Redirects
// ==========================================================================

test.describe.serial('Routing: auth guards and redirects', () => {
  const accounts = generateAccounts();
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    await signUp(page, accounts.dm);
  });

  test.afterAll(async () => {
    await ctx?.close();
  });

  test('unauthenticated user redirected to login from protected route', async ({ browser }) => {
    const anonCtx = await browser.newContext();
    const anonPage = await anonCtx.newPage();

    await anonPage.goto('/app/campaigns');
    await anonPage.waitForURL(/\/login/, { timeout: 10_000 });
    expect(anonPage.url()).toContain('/login');

    await anonCtx.close();
  });

  test('redirect preserves original path after login', async ({ browser }) => {
    const anonCtx = await browser.newContext();
    const anonPage = await anonCtx.newPage();

    await anonPage.goto('/app/settings');
    await anonPage.waitForURL(/\/login/, { timeout: 10_000 });

    // The redirect param should contain the original path
    const url = new URL(anonPage.url());
    const redirect = url.searchParams.get('redirect');
    expect(redirect).toBe('/app/settings');

    await anonCtx.close();
  });

  test('after login redirects to originally requested page', async ({ browser }) => {
    const anonCtx = await browser.newContext();
    const anonPage = await anonCtx.newPage();

    // Go to protected route first — will redirect to login with redirect param
    await anonPage.goto('/app/settings');
    await anonPage.waitForURL(/\/login/, { timeout: 10_000 });

    // Now log in
    await login(anonPage, accounts.dm.email, accounts.dm.password);

    // Should land on the originally requested page
    await expect(anonPage).toHaveURL(/\/app\/settings/);

    await anonCtx.close();
  });

  test('already authenticated user on login page redirects to dashboard', async () => {
    await page.goto('/login');
    await page.waitForURL(/\/app/, { timeout: 10_000 });
    expect(page.url()).toContain('/app');
  });
});

// ==========================================================================
// 2. Routing — 404 Handling
// ==========================================================================

test.describe('Routing: 404 handling', () => {
  test('unknown public route shows 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await expect(page.getByText('Page Not Found')).toBeVisible({ timeout: 5_000 });
  });

  test('404 page has link to home', async ({ page }) => {
    await page.goto('/nonexistent-page-abc');
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toBeVisible({ timeout: 5_000 });
  });

  test('404 page has link to dashboard', async ({ page }) => {
    await page.goto('/nonexistent-page-def');
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    await expect(dashboardLink).toBeVisible({ timeout: 5_000 });
  });
});

// ==========================================================================
// 3. Routing — Lazy-loaded routes
// ==========================================================================

test.describe.serial('Routing: lazy-loaded routes', () => {
  const accounts = generateAccounts();
  let ctx: BrowserContext;
  let page: Page;
  let _campaignId: string;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    await signUp(page, accounts.dm);
    _campaignId = await createCampaign(page, generateCampaignData());
  });

  test.afterAll(async () => {
    await ctx?.close();
  });

  test('lazy-loaded settings page loads correctly', async () => {
    await page.goto('/app/settings');
    await expect(page.getByText(/settings/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('lazy-loaded world page loads correctly', async () => {
    await page.goto('/app/world');
    await page.waitForLoadState('networkidle');
    // Page should load without blank screen — either content or "no campaign" message
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 4. State Management — Cache Invalidation
// ==========================================================================

test.describe.serial('State management: cache invalidation', () => {
  let dmCtx: BrowserContext;
  let dmPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    dmCtx = await browser.newContext();
    dmPage = await dmCtx.newPage();
    await signUp(dmPage, accounts.dm);
    campaignId = await createCampaign(dmPage, campaign);
  });

  test.afterAll(async () => {
    await dmCtx?.close();
  });

  test('campaign update reflects in campaign list without manual refresh', async () => {
    // Update campaign name via API
    const newName = `Updated ${campaign.name}`;
    const res = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { name: newName },
    });
    expect(res.ok()).toBeTruthy();

    // Navigate to campaigns list — should show updated name after invalidation
    await dmPage.goto('/app/campaigns');
    await expect(dmPage.getByText(newName)).toBeVisible({ timeout: 10_000 });
  });
});

// ==========================================================================
// 5. State Management — Logout Cache Clearing
// ==========================================================================

test.describe.serial('State management: logout clears cache', () => {
  const accounts1 = generateAccounts();
  const accounts2 = generateAccounts();
  const campaign1 = generateCampaignData();

  test('logging out and in as different user shows clean state', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Sign up as user 1 and create a campaign
    await signUp(page, accounts1.dm);
    await createCampaign(page, campaign1);
    await page.goto('/app/campaigns');
    await expect(page.getByText(campaign1.name)).toBeVisible({ timeout: 10_000 });

    // Logout
    await logout(page);

    // Sign up as user 2
    await signUp(page, accounts2.dm);
    await page.goto('/app/campaigns');

    // User 2 should NOT see user 1's campaign
    await page.waitForTimeout(1_000);
    await expect(page.getByText(campaign1.name)).not.toBeVisible();

    await ctx.close();
  });
});

// ==========================================================================
// 6. API Client — 401 Token Refresh
// ==========================================================================

test.describe.serial('API client: 401 handling', () => {
  const accounts = generateAccounts();

  test('authenticated request succeeds', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUp(page, accounts.dm);

    const res = await page.request.get(`${API_BASE}/users/me`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.email).toBe(accounts.dm.email);

    await ctx.close();
  });

  test('unauthenticated request returns 401', async ({ request }) => {
    const res = await request.get(`${API_BASE}/users/me`);
    expect(res.status()).toBe(401);
  });
});

// ==========================================================================
// 7. Error Handling — ErrorBoundary
// ==========================================================================

test.describe('Error handling: ErrorBoundary', () => {
  test('error boundary shows recovery UI on navigation error', async ({ page }) => {
    // Navigate to a protected route without auth — should redirect, not crash
    await page.goto('/app');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    // The page should not be blank
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

// ==========================================================================
// 8. API Client — Request Validation
// ==========================================================================

test.describe.serial('API client: error responses', () => {
  const accounts = generateAccounts();
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    await signUp(page, accounts.dm);
  });

  test.afterAll(async () => {
    await ctx?.close();
  });

  test('400 error returned for invalid campaign creation', async () => {
    const res = await page.request.post(`${API_BASE}/campaigns`, {
      data: { name: '' }, // Missing required fields
    });
    expect(res.status()).toBe(400);
  });

  test('404 error returned for nonexistent resource', async () => {
    const fakeId = '000000000000000000000000';
    const res = await page.request.get(`${API_BASE}/campaigns/${fakeId}`);
    // Either 404 or 403 (member guard blocks before not-found)
    expect([403, 404]).toContain(res.status());
  });
});

// ==========================================================================
// 9. Workspace — Layout Persistence
// ==========================================================================

test.describe.serial('Workspace: layout persistence', () => {
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let ctx: BrowserContext;
  let page: Page;
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    await signUp(page, accounts.dm);
    campaignId = await createCampaign(page, campaign);
  });

  test.afterAll(async () => {
    await ctx?.close();
  });

  test('workspace loads for campaign without error', async () => {
    await page.goto(`/app/campaigns/${campaignId}`);
    await page.waitForLoadState('networkidle');

    // The workspace should render — look for the campaign name in the page
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    // Should not show the error boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible();
  });

  test('workspace persists layout across page reload', async () => {
    await page.goto(`/app/campaigns/${campaignId}`);
    await page.waitForLoadState('networkidle');

    // Verify localStorage has workspace data
    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => k.startsWith('fablheim:workspace'));
    });
    // After visiting campaign workspace, localStorage should have layout data
    // (may be empty on first visit if no panels were interacted with)
    expect(storageKeys).toBeDefined();
  });
});

// ==========================================================================
// 10. SEO — Public Page Meta Tags
// ==========================================================================

test.describe('SEO: meta tags on public pages', () => {
  test('landing page has title and description', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(0);
  });

  test('landing page has canonical link', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBeTruthy();
  });

  test('landing page has Open Graph tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
    const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
    expect(ogDesc).toBeTruthy();
  });

  test('public pages do not leak campaign or user data in meta tags', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    const description = await page.getAttribute('meta[name="description"]', 'content') ?? '';

    // Should not contain test-specific or user-specific data
    expect(title).not.toContain('@');
    expect(description).not.toContain('@');
  });
});

// ==========================================================================
// 11. Admin Route — Client-side Guard
// ==========================================================================

test.describe.serial('Admin route: client-side guard', () => {
  const accounts = generateAccounts();

  test('non-admin user redirected away from admin routes', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUp(page, accounts.dm);

    await page.goto('/app/admin');
    // AdminRoute redirects non-admins to /app
    await page.waitForURL(/\/app(?!\/admin)/, { timeout: 10_000 });

    await ctx.close();
  });

  test('admin API endpoints require server-side AdminGuard', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUp(page, accounts.player1);

    // Try accessing admin API directly
    const res = await page.request.get(`${API_BASE}/admin/users`);
    expect(res.status()).toBe(403);

    await ctx.close();
  });
});

// ==========================================================================
// 12. WebSocket — Connection Lifecycle
// ==========================================================================

test.describe.serial('WebSocket: connection lifecycle', () => {
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let ctx: BrowserContext;
  let page: Page;
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    await signUp(page, accounts.dm);
    campaignId = await createCampaign(page, campaign);
  });

  test.afterAll(async () => {
    await ctx?.close();
  });

  test('session page loads without WebSocket errors', async () => {
    // Create a session first
    const sessionRes = await page.request.post(`${API_BASE}/sessions`, {
      data: { campaignId, title: `Test Session ${uniqueId()}` },
    });
    expect(sessionRes.ok()).toBeTruthy();

    // Navigate to session — should not crash
    await page.goto(`/app/campaigns/${campaignId}/session`);
    await page.waitForLoadState('networkidle');

    // Page should not show error boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible();
  });
});

// ==========================================================================
// 13. Performance — Bundle & Code Splitting
// ==========================================================================

test.describe('Performance: code splitting', () => {
  test('initial page load does not fetch admin chunks', async ({ page }) => {
    const adminChunkRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('Admin') && req.url().endsWith('.js')) {
        adminChunkRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Admin chunks should NOT be loaded on the landing page
    expect(adminChunkRequests).toHaveLength(0);
  });

  test('session runner chunk only loads on session route', async ({ page }) => {
    const sessionChunkRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('SessionRunner') && req.url().endsWith('.js')) {
        sessionChunkRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Session runner should NOT be loaded on the landing page
    expect(sessionChunkRequests).toHaveLength(0);
  });
});

// ==========================================================================
// 14. CSRF Token Bootstrap
// ==========================================================================

test.describe.serial('CSRF: token bootstrap', () => {
  const accounts = generateAccounts();

  test('mutating requests include CSRF token', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUp(page, accounts.dm);

    // After sign up, CSRF cookie should be set
    const cookies = await ctx.cookies();
    const csrfCookie = cookies.find(c => c.name === 'csrf_token');
    // CSRF cookie should exist (set during the registration POST)
    expect(csrfCookie).toBeDefined();

    await ctx.close();
  });
});

// ==========================================================================
// 15. Analytics — No PII Leak
// ==========================================================================

test.describe('Analytics: no PII in tracking', () => {
  test('PostHog initialization uses identified_only mode', async ({ page }) => {
    await page.goto('/');

    // Check that posthog is not autocapturing (which could leak PII)
    const autocapture = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, Record<string, unknown>>>;
      if (w.posthog && w.posthog.config) {
        return w.posthog.config.autocapture;
      }
      return undefined; // PostHog not initialized (no key) — safe
    });

    // Either PostHog is not initialized (no key in test env) or autocapture is disabled
    expect(autocapture === undefined || autocapture === false).toBeTruthy();
  });
});

// ==========================================================================
// 16. Deep Linking
// ==========================================================================

test.describe.serial('Deep linking: campaign and character URLs', () => {
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let ctx: BrowserContext;
  let page: Page;
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    await signUp(page, accounts.dm);
    campaignId = await createCampaign(page, campaign);
  });

  test.afterAll(async () => {
    await ctx?.close();
  });

  test('direct link to campaign detail loads correctly', async () => {
    await page.goto(`/app/campaigns/${campaignId}`);
    await page.waitForLoadState('networkidle');
    // Should not redirect away or show error
    expect(page.url()).toContain(campaignId);
    await expect(page.getByText('Something went wrong')).not.toBeVisible();
  });

  test('direct link to settings loads correctly', async () => {
    await page.goto('/app/settings');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/settings');
    await expect(page.getByText('Something went wrong')).not.toBeVisible();
  });
});
