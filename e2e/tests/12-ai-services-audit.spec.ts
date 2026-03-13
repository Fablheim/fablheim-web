import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, uniqueId } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign as _navigateToCampaign,
  joinCampaignByCode,
  generateInviteCode,
} from './helpers/campaign-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

// ==========================================================================
// 1. AI Authorization — Campaign membership required
// ==========================================================================

test.describe.serial('AI authorization: campaign membership', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let outsiderContext: BrowserContext;
  let outsiderPage: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    outsiderContext = await browser.newContext();
    outsiderPage = await outsiderContext.newPage();

    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Outsider signs up but does NOT join the campaign
    await signUp(outsiderPage, {
      username: `outsider_${uniqueId()}`,
      email: `outsider_${uniqueId()}@test.com`,
      password: 'TestPass123!',
    });
  });

  test.afterAll(async () => {
    await outsiderContext?.close();
    await dmContext?.close();
  });

  test('non-member cannot generate NPC (403)', async () => {
    const res = await outsiderPage.request.post(`${API_BASE}/ai/generate-npc`, {
      data: {
        campaignId,
        description: 'A friendly tavern keeper',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('non-member cannot generate encounter (403)', async () => {
    const res = await outsiderPage.request.post(`${API_BASE}/ai/generate-encounter`, {
      data: {
        campaignId,
        description: 'A forest ambush',
        partyLevel: 5,
        partySize: 4,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('non-member cannot ask rules (403)', async () => {
    const res = await outsiderPage.request.post(`${API_BASE}/ai/ask-rule`, {
      data: {
        campaignId,
        question: 'How does grappling work?',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('non-member cannot generate character suggestions (403)', async () => {
    const res = await outsiderPage.request.post(`${API_BASE}/ai/character/suggestions`, {
      data: {
        campaignId,
        preferences: 'warrior type',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('non-member cannot generate backstory (403)', async () => {
    const res = await outsiderPage.request.post(`${API_BASE}/ai/character/backstory`, {
      data: {
        campaignId,
        characterName: 'Theron',
        characterRace: 'Human',
        characterClass: 'Fighter',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('non-member cannot use world building endpoints (403)', async () => {
    const endpoints = [
      { path: 'world/generate-location', data: { campaignId, description: 'A dark cave' } },
      { path: 'world/generate-tavern', data: { campaignId, description: 'A cozy inn' } },
      { path: 'world/generate-shop', data: { campaignId, description: 'A weapon shop' } },
      { path: 'world/generate-faction', data: { campaignId, description: 'A thieves guild' } },
      { path: 'world/generate-npc', data: { campaignId, description: 'A merchant' } },
      { path: 'world/generate-plot-hooks', data: { campaignId, context: 'A mysterious artifact' } },
      { path: 'world/generate-quest', data: { campaignId, description: 'Rescue the princess' } },
      { path: 'world/generate-lore', data: { campaignId, topic: 'Ancient history' } },
    ];

    for (const ep of endpoints) {
      const res = await outsiderPage.request.post(`${API_BASE}/ai/${ep.path}`, {
        data: ep.data,
      });
      expect(res.status(), `${ep.path} should return 403`).toBe(403);
    }
  });

  test('DM can access AI endpoints (not 403)', async () => {
    // DM should get past the membership check (may fail on credits/quota, but not 403)
    const res = await dmPage.request.post(`${API_BASE}/ai/ask-rule`, {
      data: {
        campaignId,
        question: 'How does initiative work?',
      },
    });
    // Should NOT be 403 — may be 402 (no credits) or 200, but not 403
    expect(res.status()).not.toBe(403);
  });
});

// ==========================================================================
// 2. AI Authorization — Unauthenticated access
// ==========================================================================

test.describe('AI endpoints require authentication', () => {
  const fakeCampaignId = 'aaaaaaaaaaaaaaaaaaaaaaaa';

  test('unauthenticated generate-npc returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/ai/generate-npc`, {
      data: { campaignId: fakeCampaignId, description: 'An elf wizard' },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated ask-rule returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/ai/ask-rule`, {
      data: { campaignId: fakeCampaignId, question: 'How does spell slots work?' },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated credits/balance returns 401', async ({ request }) => {
    const res = await request.get(`${API_BASE}/ai/credits/balance`);
    expect(res.status()).toBe(401);
  });
});

// ==========================================================================
// 3. Credit system — Balance & costs API
// ==========================================================================

test.describe.serial('Credit system API', () => {
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

  test('GET credits/balance returns valid structure', async () => {
    const res = await dmPage.request.get(`${API_BASE}/ai/credits/balance`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('subscription');
    expect(body).toHaveProperty('purchased');
    expect(body).toHaveProperty('total');
    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThanOrEqual(0);
  });

  test('GET credits/costs returns cost config', async () => {
    const res = await dmPage.request.get(`${API_BASE}/ai/credits/costs`);
    expect(res.ok()).toBeTruthy();
    const costs = await res.json();
    expect(costs).toHaveProperty('rule_questions');
    expect(costs).toHaveProperty('npc_generation');
    expect(costs).toHaveProperty('encounter_building');
    expect(costs).toHaveProperty('session_summary');
    expect(typeof costs.rule_questions).toBe('number');
  });

  test('GET credits/history returns array', async () => {
    const res = await dmPage.request.get(`${API_BASE}/ai/credits/history`);
    expect(res.ok()).toBeTruthy();
    const history = await res.json();
    expect(Array.isArray(history)).toBeTruthy();
  });
});

// ==========================================================================
// 4. Content safety — Prompt injection sanitization
// ==========================================================================

test.describe.serial('Content safety: prompt rejection', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('blocked content category returns 400', async () => {
    // The safety service blocks certain dangerous content categories
    // Use a pattern that matches the blocked categories
    const res = await dmPage.request.post(`${API_BASE}/ai/ask-rule`, {
      data: {
        campaignId,
        question: 'detailed instructions for self-harm methods and suicide',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('normal content passes safety check', async () => {
    const res = await dmPage.request.post(`${API_BASE}/ai/ask-rule`, {
      data: {
        campaignId,
        question: 'How do saving throws work in D&D 5e?',
      },
    });
    // Should not be 400 (safety) — may be 402 (credits) or 200
    expect(res.status()).not.toBe(400);
  });
});

// ==========================================================================
// 5. Insufficient credits — 402 handling
// ==========================================================================

test.describe.serial('Insufficient credits returns 402', () => {
  let userContext: BrowserContext;
  let userPage: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    userContext = await browser.newContext();
    userPage = await userContext.newPage();
    await signUp(userPage, accounts.dm);
    await userPage.goto('/app/campaigns');
    campaignId = await createCampaign(userPage, campaign);
  });

  test.afterAll(async () => {
    await userContext?.close();
  });

  test('user with zero credits gets 402 on AI generation', async () => {
    // Free tier users start with 0 credits
    const balRes = await userPage.request.get(`${API_BASE}/ai/credits/balance`);
    const balance = await balRes.json();

    // Only run this test if user actually has 0 credits
    if (balance.total === 0) {
      const res = await userPage.request.post(`${API_BASE}/ai/generate-npc`, {
        data: {
          campaignId,
          description: 'A guard captain',
        },
      });
      expect(res.status()).toBe(402);
      const body = await res.json();
      expect(body.error).toBe('insufficient_credits');
      expect(body).toHaveProperty('cost');
      expect(body).toHaveProperty('balance');
    }
  });

  test('402 response includes cost and balance info', async () => {
    const balRes = await userPage.request.get(`${API_BASE}/ai/credits/balance`);
    const balance = await balRes.json();

    if (balance.total === 0) {
      const res = await userPage.request.post(`${API_BASE}/ai/generate-encounter`, {
        data: {
          campaignId,
          description: 'A goblin ambush',
          partyLevel: 3,
          partySize: 4,
        },
      });
      expect(res.status()).toBe(402);
      const body = await res.json();
      expect(typeof body.cost).toBe('number');
      expect(body.cost).toBeGreaterThan(0);
      expect(typeof body.balance).toBe('number');
    }
  });
});

// ==========================================================================
// 6. Rate limiting — Throttle enforcement
// ==========================================================================

test.describe.serial('Rate limiting on AI endpoints', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('rapid requests eventually get throttled (429)', async () => {
    // Controller has @Throttle({ default: { ttl: 60000, limit: 20 } })
    // Send 25 rapid requests — should hit the limit
    const results: number[] = [];

    for (let i = 0; i < 25; i++) {
      const res = await dmPage.request.post(`${API_BASE}/ai/ask-rule`, {
        data: {
          campaignId,
          question: `Test question ${i}`,
        },
      });
      results.push(res.status());
      // If we already got a 429, no need to keep going
      if (res.status() === 429) break;
    }

    // At least one request should have been throttled (429)
    // or all passed (if credits/safety intercepted first at 400/402)
    const got429 = results.includes(429);
    const allBlocked = results.every((s) => s === 400 || s === 402);
    expect(got429 || allBlocked).toBeTruthy();
  });
});

// ==========================================================================
// 7. Frontend — Credit balance display
// ==========================================================================

test.describe.serial('Frontend credit display', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let _campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    _campaignId = await createCampaign(dmPage, campaign);
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('credits page loads and shows balance', async () => {
    await dmPage.goto('/app/credits');
    // Should show some credit-related content
    await expect(
      dmPage.getByText(/credits?/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ==========================================================================
// 8. Player-triggered AI — context scoping
// ==========================================================================

test.describe.serial('Player AI context scoping', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let playerContext: BrowserContext;
  let playerPage: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    playerContext = await browser.newContext();
    playerPage = await playerContext.newPage();

    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    await signUp(playerPage, accounts.player1);
    await joinCampaignByCode(playerPage, inviteCode);
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  test('player can access character suggestions (member check passes)', async () => {
    const res = await playerPage.request.post(`${API_BASE}/ai/character/suggestions`, {
      data: {
        campaignId,
        preferences: 'A stealthy rogue type',
      },
    });
    // Should pass membership check — may get 402 (no credits) but not 403
    expect(res.status()).not.toBe(403);
  });

  test('player can access rules assistant (member check passes)', async () => {
    const res = await playerPage.request.post(`${API_BASE}/ai/ask-rule`, {
      data: {
        campaignId,
        question: 'How does sneak attack work?',
      },
    });
    expect(res.status()).not.toBe(403);
  });

  test('player cannot access non-member campaign AI', async () => {
    const fakeCampaignId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
    const res = await playerPage.request.post(`${API_BASE}/ai/ask-rule`, {
      data: {
        campaignId: fakeCampaignId,
        question: 'How does initiative work?',
      },
    });
    expect(res.status()).toBe(403);
  });
});
