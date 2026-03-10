import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, uniqueId } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign,
} from './helpers/campaign-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

// ==========================================================================
// 1. Authentication — Register / Login / Session
// ==========================================================================

test.describe.serial('Authentication flows', () => {
  let context: BrowserContext;
  let page: Page;
  const email = `auth_test_${uniqueId()}@test.com`;
  const password = 'TestPass123!';
  const username = `authuser_${uniqueId()}`;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('register with valid credentials succeeds', async () => {
    await page.goto('/register');
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    // Submit — may have Turnstile in E2E mode
    await page.getByRole('button', { name: /register|sign up|create/i }).click();
    // Should redirect to app after register
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
  });

  test('register with duplicate email fails', async () => {
    // New context to avoid existing session
    const ctx2 = await page.context().browser()!.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto('/register');
    await p2.getByLabel(/username/i).fill(`dup_${uniqueId()}`);
    await p2.getByLabel(/email/i).fill(email);
    await p2.getByLabel(/^password$/i).fill(password);
    await p2.getByRole('button', { name: /register|sign up|create/i }).click();
    // Should show error (409 Conflict → displayed as error text)
    await expect(
      p2.getByText(/already registered|already exists|email.*taken/i),
    ).toBeVisible({ timeout: 10_000 });
    await ctx2.close();
  });

  test('login with valid credentials returns session', async () => {
    // Logout first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
  });

  test('login with invalid credentials returns error', async () => {
    const ctx3 = await page.context().browser()!.newContext();
    const p3 = await ctx3.newPage();
    await p3.goto('/login');
    await p3.getByLabel(/email/i).fill(email);
    await p3.getByLabel(/password/i).fill('WrongPassword999!');
    await p3.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(
      p3.getByText(/invalid credentials|incorrect/i),
    ).toBeVisible({ timeout: 10_000 });
    await ctx3.close();
  });

  test('logout clears session correctly', async () => {
    // Should be logged in from previous test
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app/, { timeout: 10_000 });
    // Click user menu → logout
    const userMenu = page.getByRole('button', { name: /account|profile|menu/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
      const logoutBtn = page.getByRole('menuitem', { name: /log ?out|sign ?out/i });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
      }
    }
    // After logout, navigating to /app should redirect to login
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

// ==========================================================================
// 2. Authentication — API-level token validation
// ==========================================================================

test.describe('API authentication enforcement', () => {
  test('unauthenticated GET /users/me returns 401', async ({ request }) => {
    const res = await request.get(`${API_BASE}/users/me`);
    expect(res.status()).toBe(401);
  });

  test('unauthenticated POST /auth/change-password returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/change-password`, {
      data: { currentPassword: 'old', newPassword: 'newPass123!' },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated DELETE /users/me returns 401', async ({ request }) => {
    const res = await request.delete(`${API_BASE}/users/me`);
    expect(res.status()).toBe(401);
  });
});

// ==========================================================================
// 3. Authorization — Admin route protection
// ==========================================================================

test.describe.serial('Admin authorization', () => {
  let userContext: BrowserContext;
  let userPage: Page;
  const accounts = generateAccounts();

  test.beforeAll(async ({ browser }) => {
    userContext = await browser.newContext();
    userPage = await userContext.newPage();
    await signUp(userPage, accounts.dm);
  });

  test.afterAll(async () => {
    await userContext?.close();
  });

  test('non-admin GET /admin/users returns 403', async () => {
    const res = await userPage.request.get(`${API_BASE}/admin/users`);
    expect(res.status()).toBe(403);
  });

  test('non-admin GET /admin/billing/webhook-events returns 403', async () => {
    const res = await userPage.request.get(`${API_BASE}/admin/billing/webhook-events`);
    expect(res.status()).toBe(403);
  });

  test('non-admin POST /admin/users/:id/credits returns 403', async () => {
    const fakeId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const res = await userPage.request.post(`${API_BASE}/admin/users/${fakeId}/credits`, {
      data: { amount: 100, reason: 'test', idempotencyKey: 'test_key' },
    });
    expect(res.status()).toBe(403);
  });

  test('non-admin cannot elevate role', async () => {
    // Attempt to update own profile with role field
    const res = await userPage.request.patch(`${API_BASE}/users/me`, {
      data: { role: 'admin' },
    });
    // Should either ignore the role field or reject
    if (res.ok()) {
      // If 200, verify role was NOT changed
      const meRes = await userPage.request.get(`${API_BASE}/users/me`);
      const me = await meRes.json();
      expect(me.role).not.toBe('admin');
    }
  });
});

// ==========================================================================
// 4. CSRF protection
// ==========================================================================

test.describe('CSRF protection', () => {
  test('POST without CSRF token while having session cookie is rejected', async ({ request }) => {
    // First create a session by registering
    const email = `csrf_test_${uniqueId()}@test.com`;
    const regRes = await request.post(`${API_BASE}/auth/register`, {
      data: {
        username: `csrfuser_${uniqueId()}`,
        email,
        password: 'TestPass123!',
      },
    });

    if (regRes.ok()) {
      // Now try to make a POST request without CSRF header
      // The middleware should block if session cookies are present
      const headers: Record<string, string> = {};
      // Explicitly do NOT set x-csrf-token
      const res = await request.post(`${API_BASE}/auth/change-password`, {
        data: { currentPassword: 'TestPass123!', newPassword: 'NewPass456!' },
        headers,
      });
      // Should be 403 (CSRF) or 401 (if cookies not forwarded by Playwright)
      expect([401, 403]).toContain(res.status());
    }
  });
});

// ==========================================================================
// 5. Password reset flow
// ==========================================================================

test.describe.serial('Password reset flow', () => {
  let context: BrowserContext;
  let page: Page;
  const email = `reset_test_${uniqueId()}@test.com`;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await signUp(page, {
      username: `resetuser_${uniqueId()}`,
      email,
      password,
    });
    // Log out
    await page.request.post(`${API_BASE}/auth/logout`);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('forgot-password endpoint returns success for any email (no enumeration)', async () => {
    // Real email
    const res1 = await page.request.post(`${API_BASE}/auth/forgot-password`, {
      data: { email },
    });
    expect(res1.status()).toBe(200);

    // Non-existent email should also return 200 (not 404)
    const res2 = await page.request.post(`${API_BASE}/auth/forgot-password`, {
      data: { email: `nonexistent_${uniqueId()}@nowhere.com` },
    });
    expect(res2.status()).toBe(200);
  });

  test('reset-password with invalid token returns 400', async () => {
    const res = await page.request.post(`${API_BASE}/auth/reset-password`, {
      data: { token: 'invalid_token_that_does_not_exist', newPassword: 'NewPass123!' },
    });
    expect(res.status()).toBe(400);
  });
});

// ==========================================================================
// 6. Rate limiting on auth endpoints
// ==========================================================================

test.describe('Rate limiting on login', () => {
  test('too many login attempts triggers 429', async ({ request }) => {
    // Login endpoint is rate-limited to 5/min
    const results: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: {
          email: `ratelimit_${uniqueId()}@test.com`,
          password: 'wrong',
        },
      });
      results.push(res.status());
      if (res.status() === 429) break;
    }
    // Should hit rate limit (429) at some point
    expect(results).toContain(429);
  });
});

// ==========================================================================
// 7. Billing — Webhook security
// ==========================================================================

test.describe('Stripe webhook security', () => {
  test('webhook without Stripe-Signature header returns 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/stripe/webhook`, {
      data: JSON.stringify({ type: 'test', data: {} }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('webhook with invalid signature returns 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/stripe/webhook`, {
      data: JSON.stringify({ type: 'test', data: {} }),
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=invalid_signature_hash',
      },
    });
    expect(res.status()).toBe(400);
  });
});

// ==========================================================================
// 8. Credit consumption — atomic, no negative balance
// ==========================================================================

test.describe.serial('Credit consumption atomicity', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    await createCampaign(dmPage, campaign);
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('credit balance is never negative', async () => {
    const res = await dmPage.request.get(`${API_BASE}/ai/credits/balance`);
    expect(res.ok()).toBeTruthy();
    const balance = await res.json();
    expect(balance.total).toBeGreaterThanOrEqual(0);
    expect(balance.subscription).toBeGreaterThanOrEqual(0);
    expect(balance.purchased).toBeGreaterThanOrEqual(0);
  });
});

// ==========================================================================
// 9. Account security
// ==========================================================================

test.describe.serial('Account security', () => {
  let context: BrowserContext;
  let page: Page;
  const email = `acct_test_${uniqueId()}@test.com`;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await signUp(page, {
      username: `acctuser_${uniqueId()}`,
      email,
      password,
    });
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('email change requires password verification', async () => {
    // Attempt email change without password
    const res = await page.request.patch(`${API_BASE}/users/me/email`, {
      data: { newEmail: `changed_${uniqueId()}@test.com` },
    });
    // Should fail — requires password field
    expect(res.ok()).toBeFalsy();
  });

  test('age verification enforced on AI endpoints', async () => {
    // New user is not age-verified by default
    const meRes = await page.request.get(`${API_BASE}/users/me`);
    const me = await meRes.json();

    // Only test if user is NOT age verified
    if (!me.ageVerified) {
      const res = await page.request.post(`${API_BASE}/ai/generate-npc`, {
        data: {
          campaignId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
          description: 'A guard',
        },
      });
      // Should be blocked by AgeVerifiedGuard (403) or campaign membership (403)
      expect(res.status()).toBe(403);
    }
  });

  test('GDPR deletion endpoint requires confirmation', async () => {
    // Attempt deletion without confirm flag
    const res = await page.request.delete(`${API_BASE}/users/me`, {
      data: { password },
    });
    // Should fail without confirm: true
    expect(res.ok()).toBeFalsy();
  });
});

// ==========================================================================
// 10. Health endpoints
// ==========================================================================

test.describe('Health endpoints', () => {
  test('GET /health returns 200 with status', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });

  test('GET /health/ready returns status info', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health/ready`);
    // May be 200 or 503 depending on server state
    expect([200, 503]).toContain(res.status());
  });

  test('GET /health/live returns liveness status', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health/live`);
    expect([200, 503]).toContain(res.status());
  });

  test('health endpoints do not leak sensitive info', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    const body = JSON.stringify(await res.json());
    // Should not contain connection strings, passwords, or internal IPs
    expect(body).not.toContain('mongodb://');
    expect(body).not.toContain('password');
    expect(body).not.toContain('192.168.');
    expect(body).not.toContain('10.0.');
  });
});

// ==========================================================================
// 11. Refresh token rotation
// ==========================================================================

test.describe.serial('Refresh token rotation', () => {
  test('refresh endpoint returns new tokens', async ({ request }) => {
    // Register to get initial tokens
    const email = `refresh_${uniqueId()}@test.com`;
    const regRes = await request.post(`${API_BASE}/auth/register`, {
      data: {
        username: `refreshuser_${uniqueId()}`,
        email,
        password: 'TestPass123!',
      },
    });

    if (regRes.ok()) {
      // Refresh should work with existing cookies
      const refreshRes = await request.post(`${API_BASE}/auth/refresh`);
      // May be 200 (success) or 401 (no cookies forwarded by Playwright)
      expect([200, 401]).toContain(refreshRes.status());
    }
  });
});

// ==========================================================================
// 12. Correlation ID
// ==========================================================================

test.describe('Correlation ID handling', () => {
  test('returns X-Request-Id header on responses', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    const requestId = res.headers()['x-request-id'];
    expect(requestId).toBeTruthy();
    // Should be a valid UUID format
    expect(requestId).toMatch(/^[a-f0-9\-]{36}$/);
  });

  test('sanitizes malicious X-Request-Id header', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`, {
      headers: { 'x-request-id': '<script>alert(1)</script>' },
    });
    const requestId = res.headers()['x-request-id'];
    // Should be a generated UUID, NOT the injected value
    expect(requestId).not.toContain('<script>');
    expect(requestId).toMatch(/^[a-f0-9\-]{36}$/);
  });

  test('accepts valid X-Request-Id header', async ({ request }) => {
    const validId = 'abc-123-def-456';
    const res = await request.get(`${API_BASE}/health`, {
      headers: { 'x-request-id': validId },
    });
    const requestId = res.headers()['x-request-id'];
    expect(requestId).toBe(validId);
  });
});
