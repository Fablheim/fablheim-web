import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign,
  joinCampaignByCode,
  generateInviteCode,
} from './helpers/campaign-helpers';

// ---------------------------------------------------------------------------
// 1. Unauthenticated access redirects
// ---------------------------------------------------------------------------

test.describe('Unauthenticated access redirects to login', () => {
  test('navigating to /app redirects to /login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('navigating to /app/campaigns redirects to /login', async ({ page }) => {
    await page.goto('/app/campaigns');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('navigating to /app/campaigns/:id redirects to /login', async ({ page }) => {
    await page.goto('/app/campaigns/aaaaaaaaaaaaaaaaaaaaaaaa');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 2. API endpoint protection (no auth cookies)
// ---------------------------------------------------------------------------

// In dev mode, the API server runs on port 3000 without an /api/ prefix.
const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

test.describe('API endpoint protection without authentication', () => {
  test('GET /campaigns without auth returns 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/campaigns`);
    expect(response.status()).toBe(401);
  });

  test('GET /users/me without auth returns 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/users/me`);
    expect(response.status()).toBe(401);
  });

  test('POST /campaigns without auth returns 401', async ({ request }) => {
    const response = await request.post(`${API_BASE}/campaigns`, {
      data: { name: 'Unauthorized Campaign', system: 'dnd5e' },
    });
    expect(response.status()).toBe(401);
  });

  test('GET /campaigns/:id without auth returns 401', async ({ request }) => {
    const fakeCampaignId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const response = await request.get(`${API_BASE}/campaigns/${fakeCampaignId}`);
    expect(response.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 3. Campaign access control
// ---------------------------------------------------------------------------

test.describe('Campaign access control', () => {
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

    await signUp(playerPage, accounts.player1);
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  test('navigating to a non-existent campaign shows error or not-found', async () => {
    const fakeCampaignId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    await dmPage.goto(`/app/campaigns/${fakeCampaignId}`);

    // The app shows "Failed to load campaign" and "Campaign not found"
    await expect(
      dmPage.getByText('Failed to load campaign'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('DM can create a GM-Only world entity in the campaign', async () => {
    await navigateToCampaign(dmPage, campaignId);

    // Navigate to World section via the prep sidebar
    await dmPage.getByRole('button', { name: 'World' }).click();
    await dmPage.waitForTimeout(1_000);

    // Click the "Create" button to open the entity creation modal
    await dmPage.getByRole('button', { name: /create/i }).first().click();

    // Wait for the modal to appear
    await dmPage.locator('#entity-name').waitFor({ timeout: 5_000 });

    // Fill in entity details
    await dmPage.locator('#entity-name').fill('Secret Lich Lair');
    await dmPage.locator('#entity-type').selectOption('location');

    // Toggle visibility to "GM Only"
    const visibilityButton = dmPage.getByRole('button', { name: /public/i });
    await visibilityButton.click();

    // Verify the button now shows "GM Only"
    await expect(
      dmPage.getByRole('button', { name: /gm only/i }),
    ).toBeVisible();

    // Submit the entity — target the form's submit button specifically
    await dmPage.locator('button[type="submit"]').click();

    // Wait for modal to close
    await expect(dmPage.locator('#entity-name')).toBeHidden({ timeout: 10_000 });

    // Navigate to World and verify entity is visible
    await dmPage.getByRole('button', { name: 'World' }).click();
    await dmPage.waitForTimeout(1_500);

    // Verify the entity card is visible with GM Only badge
    await expect(dmPage.getByText('Secret Lich Lair').first()).toBeVisible({ timeout: 10_000 });
  });

  test('non-member player can load campaign page but lacks DM controls', async () => {
    // GET /campaigns/:id has no membership guard — any authenticated user can view.
    // This test documents the current behavior: non-members see the workspace
    // but should NOT see DM-only controls like "Start Session".
    await playerPage.goto(`/app/campaigns/${campaignId}`);
    await playerPage.waitForLoadState('networkidle');

    // The campaign name should be visible (non-member can view)
    await expect(
      playerPage.getByText(campaign.name).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Non-member should NOT see the "Start Session" button (DM-only action)
    await expect(
      playerPage.getByRole('button', { name: /start session/i }),
    ).not.toBeVisible({ timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// 4. DM-only content filtering for campaign members
// ---------------------------------------------------------------------------

test.describe('DM-only content filtering for members', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let playerContext: BrowserContext;
  let playerPage: Page;
  let campaignId: string;
  let inviteCode: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    playerContext = await browser.newContext();
    playerPage = await playerContext.newPage();

    // DM signs up and creates a campaign
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // DM generates an invite code via the API (InvitePanel not yet integrated in UI)
    inviteCode = await generateInviteCode(dmPage, campaignId);

    // Player signs up and joins via invite code
    await signUp(playerPage, accounts.player1);
    await joinCampaignByCode(playerPage, inviteCode);
    await expect(playerPage).toHaveURL(
      new RegExp(`/app/campaigns/${campaignId}`),
    );
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  test('DM creates a GM-Only entity in the world tab', async () => {
    await navigateToCampaign(dmPage, campaignId);

    // Navigate to World section via the prep sidebar
    await dmPage.getByRole('button', { name: 'World' }).click();
    await dmPage.waitForTimeout(1_000);

    // Click "Create" to open the entity creation modal
    await dmPage.getByRole('button', { name: /create/i }).first().click();

    // Wait for the modal
    await dmPage.locator('#entity-name').waitFor({ timeout: 5_000 });

    // Fill in entity details
    await dmPage.locator('#entity-name').fill('Hidden Dragon Cave');
    await dmPage.locator('#entity-type').selectOption('location');

    // Toggle visibility to "GM Only"
    const visibilityButton = dmPage.getByRole('button', { name: /public/i });
    await visibilityButton.click();
    await expect(
      dmPage.getByRole('button', { name: /gm only/i }),
    ).toBeVisible();

    // Submit — target the form submit button
    await dmPage.locator('button[type="submit"]').click();
    await dmPage.waitForTimeout(2_000);

    // Also create a Public entity so we can verify the player sees *something*
    await dmPage.getByRole('button', { name: /create/i }).first().click();
    await dmPage.locator('#entity-name').waitFor({ timeout: 5_000 });
    await dmPage.locator('#entity-name').fill('Town of Millhaven');
    await dmPage.locator('#entity-type').selectOption('location');
    // Visibility defaults to Public — leave it as-is
    await expect(
      dmPage.getByRole('button', { name: /public/i }),
    ).toBeVisible();

    // Submit — target the form submit button
    await dmPage.locator('button[type="submit"]').click();
    await dmPage.waitForTimeout(2_000);
  });

  test('DM can see both Public and GM-Only entities', async () => {
    await navigateToCampaign(dmPage, campaignId);
    await dmPage.getByRole('button', { name: 'World' }).click();
    await dmPage.waitForTimeout(1_500);

    // DM should see the GM-Only entity
    const hiddenEntityCard = dmPage
      .locator('[role="button"][tabindex="0"]')
      .filter({ has: dmPage.locator('h3', { hasText: 'Hidden Dragon Cave' }) });
    await expect(hiddenEntityCard).toBeVisible({ timeout: 10_000 });
    await expect(hiddenEntityCard.getByText('GM Only')).toBeVisible();

    // DM should also see the Public entity
    const publicEntityCard = dmPage
      .locator('[role="button"][tabindex="0"]')
      .filter({ has: dmPage.locator('h3', { hasText: 'Town of Millhaven' }) });
    await expect(publicEntityCard).toBeVisible({ timeout: 10_000 });
    await expect(publicEntityCard.getByText('Public')).toBeVisible();
  });

  test('player member can see Public entity but NOT GM-Only entity', async () => {
    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'World' }).click();
    await playerPage.waitForTimeout(1_500);

    // Player should see the Public entity
    const publicEntityCard = playerPage
      .locator('[role="button"][tabindex="0"]')
      .filter({
        has: playerPage.locator('h3', { hasText: 'Town of Millhaven' }),
      });
    await expect(publicEntityCard).toBeVisible({ timeout: 10_000 });

    // Player should NOT see the GM-Only entity
    const hiddenEntityCard = playerPage
      .locator('[role="button"][tabindex="0"]')
      .filter({
        has: playerPage.locator('h3', { hasText: 'Hidden Dragon Cave' }),
      });
    await expect(hiddenEntityCard).not.toBeVisible({ timeout: 5_000 });

    // Double-check: the text "Hidden Dragon Cave" should not appear anywhere
    await expect(
      playerPage.getByText('Hidden Dragon Cave'),
    ).not.toBeVisible({ timeout: 3_000 });
  });
});
