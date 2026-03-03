import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  joinCampaignByCode,
  navigateToCampaign,
  generateInviteCode,
} from './helpers/campaign-helpers';
import {
  startSession,
  goToSession,
  endSession,
  sendChatMessage,
  setChatMode,
} from './helpers/session-helpers';

test.describe.serial('Multi-User Session — Real-time Chat & Whispers', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let p1Context: BrowserContext;
  let p1Page: Page;
  let p2Context: BrowserContext;
  let p2Page: Page;
  let campaignId: string;
  let inviteCode: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  // ── Setup & Teardown ──────────────────────────────────────

  test.beforeAll(async ({ browser }) => {
    // Each user gets an isolated browser context (separate cookies / storage)
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();

    p1Context = await browser.newContext();
    p1Page = await p1Context.newPage();

    p2Context = await browser.newContext();
    p2Page = await p2Context.newPage();
  });

  test.afterAll(async () => {
    await p2Context?.close();
    await p1Context?.close();
    await dmContext?.close();
  });

  // ── Step 1: DM creates account and campaign ───────────────

  test('Step 1: DM creates account and campaign', async () => {
    await signUp(dmPage, accounts.dm);
    await expect(dmPage).toHaveURL(/\/app/);

    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);
    expect(campaignId).toBeTruthy();
  });

  // ── Step 2: DM generates an invite link ───────────────────

  test('Step 2: DM generates invite code', async () => {
    // Generate invite code via API (InvitePanel not yet integrated in workspace UI)
    inviteCode = await generateInviteCode(dmPage, campaignId);
    expect(inviteCode).toBeTruthy();
    expect(inviteCode.length).toBeGreaterThan(0);
  });

  // ── Step 3: Both players create accounts & join campaign ──

  test('Step 3: Player 1 creates account and joins campaign', async () => {
    await signUp(p1Page, accounts.player1);
    await expect(p1Page).toHaveURL(/\/app/);

    await joinCampaignByCode(p1Page, inviteCode);
    await expect(p1Page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));
  });

  test('Step 4: Player 2 creates account and joins campaign', async () => {
    await signUp(p2Page, accounts.player2);
    await expect(p2Page).toHaveURL(/\/app/);

    await joinCampaignByCode(p2Page, inviteCode);
    await expect(p2Page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));
  });

  // ── Step 5: DM starts session, both players navigate to it ─

  test('Step 5: DM starts session and players navigate to session', async () => {
    // DM starts the session from the campaign workspace
    await navigateToCampaign(dmPage, campaignId);
    await startSession(dmPage);

    // Verify DM sees the session shell header
    await expect(dmPage.locator('header.session-top-bar')).toBeVisible({
      timeout: 15_000,
    });

    // Player 1 navigates to the session
    await goToSession(p1Page, campaignId);
    await expect(p1Page).toHaveURL(
      new RegExp(`/app/campaigns/${campaignId}/session`),
    );
    await expect(p1Page.locator('header.session-top-bar')).toBeVisible({
      timeout: 15_000,
    });

    // Player 2 navigates to the session
    await goToSession(p2Page, campaignId);
    await expect(p2Page).toHaveURL(
      new RegExp(`/app/campaigns/${campaignId}/session`),
    );
    await expect(p2Page.locator('header.session-top-bar')).toBeVisible({
      timeout: 15_000,
    });
  });

  // ── Step 6: DM sends IC message → both players see it ─────

  test('Step 6: DM sends IC message visible to both players', async () => {
    // Switch DM to In-Character mode
    await setChatMode(dmPage, 'ic');

    const dmMessage = 'A chill wind sweeps through the ancient hall. Roll for perception.';
    await sendChatMessage(dmPage, dmMessage);

    // DM sees their own message
    const dmChat = dmPage.locator('.chat-message-list');
    await expect(dmChat.getByText(dmMessage)).toBeVisible({ timeout: 10_000 });

    // Player 1 sees the DM's IC message
    const p1Chat = p1Page.locator('.chat-message-list');
    await expect(p1Chat.getByText(dmMessage)).toBeVisible({ timeout: 10_000 });

    // Player 2 sees the DM's IC message
    const p2Chat = p2Page.locator('.chat-message-list');
    await expect(p2Chat.getByText(dmMessage)).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 7: Player 1 sends OOC message → DM and P2 see it ─

  test('Step 7: Player 1 sends OOC message visible to DM and Player 2', async () => {
    // Switch Player 1 to OOC mode
    await setChatMode(p1Page, 'ooc');

    const oocMessage = 'Hang on, do I add my proficiency bonus to this check?';
    await sendChatMessage(p1Page, oocMessage);

    // Player 1 sees their own message
    const p1Chat = p1Page.locator('.chat-message-list');
    await expect(p1Chat.getByText(oocMessage)).toBeVisible({ timeout: 10_000 });

    // DM sees the OOC message
    const dmChat = dmPage.locator('.chat-message-list');
    await expect(dmChat.getByText(oocMessage)).toBeVisible({ timeout: 10_000 });

    // Player 2 sees the OOC message
    const p2Chat = p2Page.locator('.chat-message-list');
    await expect(p2Chat.getByText(oocMessage)).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 8: DM whispers Player 1 → P1 sees it, P2 does NOT ─

  test('Step 8: DM whispers Player 1 — only Player 1 sees it', async () => {
    // Switch DM to whisper mode
    await setChatMode(dmPage, 'whisper');

    // Select Player 1 as the whisper recipient from the dropdown
    const recipientSelect = dmPage.locator('select');
    await recipientSelect.waitFor({ timeout: 5_000 });

    // Find the option matching Player 1's username
    const p1Username = accounts.player1.username;
    const options = recipientSelect.locator('option');
    const count = await options.count();
    let matchedValue = '';
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text && text.toLowerCase().includes(p1Username.toLowerCase())) {
        matchedValue = await options.nth(i).getAttribute('value') ?? '';
        break;
      }
    }
    expect(matchedValue).toBeTruthy();
    await recipientSelect.selectOption(matchedValue);

    const whisperMessage = 'You notice a hidden door behind the tapestry. Only you can see this.';
    await sendChatMessage(dmPage, whisperMessage);

    // DM sees the whisper they sent
    const dmChat = dmPage.locator('.chat-message-list');
    await expect(dmChat.getByText(whisperMessage)).toBeVisible({ timeout: 10_000 });

    // Player 1 (the recipient) sees the whisper
    const p1Chat = p1Page.locator('.chat-message-list');
    await expect(p1Chat.getByText(whisperMessage)).toBeVisible({ timeout: 10_000 });

    // Player 2 must NOT see the whisper — wait a reasonable time then assert absence
    const p2Chat = p2Page.locator('.chat-message-list');
    // Give the websocket time to potentially deliver the message
    await p2Page.waitForTimeout(3_000);
    await expect(p2Chat.getByText(whisperMessage)).not.toBeVisible();
  });

  // ── Step 9: End session ───────────────────────────────────

  test('Step 9: DM ends the session', async () => {
    // Switch DM back to OOC to reset chat mode before ending
    await setChatMode(dmPage, 'ooc');

    await endSession(dmPage);

    // DM should return to the campaign workspace
    await expect(dmPage).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));
  });
});
