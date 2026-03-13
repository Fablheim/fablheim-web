import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, TEST_CHARACTER } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign,
  joinCampaignByCode,
  generateInviteCode,
} from './helpers/campaign-helpers';
import {
  goToCharacterCreation,
  createCharacter,
  expectCharacterVisible,
  verifyCharacterPersisted as _verifyCharacterPersisted,
} from './helpers/character-helpers';
import {
  startSession,
  goToSession as _goToSession,
  sendChatMessage,
  setChatMode,
} from './helpers/session-helpers';

test.describe.serial('Player Complete Flow — Join, Character, Session, Chat', () => {
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
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  // ── Step 1: DM creates account and campaign ────────────────

  test('DM creates account and campaign', async () => {
    await signUp(dmPage, accounts.dm);
    await expect(dmPage).toHaveURL(/\/app/);

    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);
    expect(campaignId).toBeTruthy();
  });

  // ── Step 2: Player creates account ─────────────────────────

  test('Player creates account', async () => {
    await signUp(playerPage, accounts.player1);
    await expect(playerPage).toHaveURL(/\/app/);
  });

  // ── Step 3: Player sees empty state ────────────────────────

  test('Player sees empty campaigns state before joining any campaign', async () => {
    await playerPage.goto('/app');
    await expect(
      playerPage.getByText(/no campaigns yet|join a campaign|you haven't joined/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 4: DM generates invite, player joins ─────────────

  test('DM generates an invite code for the campaign', async () => {
    // Generate invite code via API (InvitePanel not yet integrated in workspace UI)
    inviteCode = await generateInviteCode(dmPage, campaignId);
    expect(inviteCode).toBeTruthy();
  });

  test('Player joins campaign via invite code URL', async () => {
    // The /join/:inviteCode page auto-processes on mount and redirects
    await joinCampaignByCode(playerPage, inviteCode);

    // Player should land on the campaign workspace
    await expect(playerPage).toHaveURL(
      new RegExp(`/app/campaigns/${campaignId}`),
    );

    // Campaign name should be visible on the workspace
    await expect(
      playerPage.getByText(campaign.name).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 5: Player creates character with stats ────────────

  test('Player creates a character with HP, AC, and Speed', async () => {
    await goToCharacterCreation(playerPage, campaignId);
    await expect(playerPage).toHaveURL(
      new RegExp(`/app/campaigns/${campaignId}/characters/create`),
    );

    await createCharacter(playerPage, TEST_CHARACTER);

    // After creation, the app redirects to the character detail page
    await expect(playerPage).toHaveURL(/\/app\/characters\/[a-f0-9]+/, { timeout: 15_000 });

    // Character name should be visible on the detail page
    await expectCharacterVisible(playerPage, TEST_CHARACTER.name);
  });

  // ── Step 6: Verify character data persists after refresh ───

  test('Character data persists after page refresh', async () => {
    // Refresh the character detail page
    await playerPage.reload({ waitUntil: 'networkidle' });

    // Verify the character name survived the refresh
    await expectCharacterVisible(playerPage, TEST_CHARACTER.name);
  });

  // ── Step 7: Player sees campaign prep sidebar sections ─────

  test('Player sees campaign prep sidebar sections', async () => {
    // Navigate to the campaign workspace
    await navigateToCampaign(playerPage, campaignId);

    // Player should see key prep sidebar sections (buttons, not tabs)
    await expect(
      playerPage.getByRole('button', { name: 'Overview' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: 'Notes' }),
    ).toBeVisible();
    await expect(
      playerPage.getByRole('button', { name: 'Rules' }),
    ).toBeVisible();
  });

  // ── Step 8: DM starts session ──────────────────────────────

  test('DM starts a live session', async () => {
    await navigateToCampaign(dmPage, campaignId);
    await startSession(dmPage);

    // Verify DM is on the session page
    await expect(dmPage).toHaveURL(
      new RegExp(`/app/campaigns/${campaignId}/session`),
    );

    // Verify the session top bar is visible
    await expect(
      dmPage.locator('header.session-top-bar'),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 9: Player navigates to session ────────────────────

  test('Player navigates to the active session', async () => {
    // Navigate to the campaign workspace first to refresh campaign data (stage → 'live')
    await playerPage.goto(`/app/campaigns/${campaignId}`);
    await playerPage.waitForTimeout(1_000);

    // Now navigate to the session — the campaign stage should be 'live'
    await playerPage.goto(`/app/campaigns/${campaignId}/session`);

    await expect(playerPage).toHaveURL(
      new RegExp(`/app/campaigns/${campaignId}/session`),
    );

    // Verify the player's session view loaded — session top bar header
    await expect(
      playerPage.locator('header.session-top-bar'),
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── Step 10: Player sends IC chat message ──────────────────

  test('Player sends an in-character chat message', async () => {
    // Switch to in-character mode
    await setChatMode(playerPage, 'ic');

    const icMessage = 'I cautiously step into the dungeon, bow drawn.';
    await sendChatMessage(playerPage, icMessage);

    // Verify the IC message appears in the chat message list
    const chatList = playerPage.locator('.chat-message-list');
    await expect(chatList.getByText(icMessage)).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 11: Player sends OOC chat message ─────────────────

  test('Player sends an out-of-character chat message', async () => {
    // Switch to out-of-character mode
    await setChatMode(playerPage, 'ooc');

    const oocMessage = 'Hey DM, can I roll for perception here?';
    await sendChatMessage(playerPage, oocMessage);

    // Verify the OOC message appears in the chat message list
    const chatList = playerPage.locator('.chat-message-list');
    await expect(chatList.getByText(oocMessage)).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 12: Player can view full chat history ─────────────

  test('Player can view chat history with all sent messages', async () => {
    const chatList = playerPage.locator('.chat-message-list');
    await expect(chatList).toBeVisible();

    // Both earlier messages should still be present in the chat history
    await expect(
      chatList.getByText('I cautiously step into the dungeon, bow drawn.'),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      chatList.getByText('Hey DM, can I roll for perception here?'),
    ).toBeVisible({ timeout: 5_000 });
  });
});
