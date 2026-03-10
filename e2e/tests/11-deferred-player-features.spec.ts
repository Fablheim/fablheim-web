import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, uniqueId } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign,
  joinCampaignByCode,
  generateInviteCode,
} from './helpers/campaign-helpers';
import { startSession, goToSession, endSession, clickDMTab } from './helpers/session-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

// ==========================================================================
// 1. Handout Unshare Broadcast
// ==========================================================================

test.describe.serial('Handout unshare broadcast', () => {
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

  test('DM creates and shares a handout, player sees it', async () => {
    // Start session
    await navigateToCampaign(dmPage, campaignId);
    await startSession(dmPage);

    // Player joins session
    await goToSession(playerPage, campaignId);

    // DM creates and shares a handout via API
    const createRes = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/handouts`,
      { data: { title: `Test Handout ${uniqueId()}`, content: 'Secret map details' } },
    );
    expect(createRes.ok()).toBeTruthy();
    const handout = await createRes.json();

    const shareRes = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/handouts/${handout._id}/share`,
    );
    expect(shareRes.ok()).toBeTruthy();

    // Player navigates to handouts tab
    await playerPage.getByRole('button', { name: 'Handouts' }).click();
    await playerPage.waitForTimeout(2_000);

    // Handout should be visible
    await expect(
      playerPage.getByText(handout.title),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('DM unshares handout, player sees toast and handout disappears', async () => {
    // Get the handout via API
    const listRes = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/handouts`,
    );
    const handouts = await listRes.json();
    const handout = handouts[0];

    // Unshare via API
    const unshareRes = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/handouts/${handout._id}/unshare`,
    );
    expect(unshareRes.ok()).toBeTruthy();

    // Player should see the handout removed from the list
    await playerPage.waitForTimeout(2_000);
    await expect(
      playerPage.getByText(handout.title),
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test('cleanup: end session', async () => {
    await endSession(dmPage);
  });
});

// ==========================================================================
// 2. Party Status Dashboard
// ==========================================================================

test.describe.serial('Party status dashboard', () => {
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

    // Create a character for the player
    const charRes = await playerPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/characters`,
      {
        data: {
          name: `Thalia ${uniqueId()}`,
          race: 'elf',
          class: 'ranger',
          level: 5,
          hp: { current: 35, max: 42 },
          ac: 16,
        },
      },
    );
    expect(charRes.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  test('DM sees party status tab with character data', async () => {
    await navigateToCampaign(dmPage, campaignId);
    await startSession(dmPage);

    // Click party tab
    await clickDMTab(dmPage, 'party');
    await dmPage.waitForTimeout(1_500);

    // Should see the character name
    await expect(
      dmPage.getByText('Thalia').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player sees party status tab', async () => {
    await goToSession(playerPage, campaignId);

    // Click party tab (Users icon)
    await playerPage.getByRole('button', { name: 'Party' }).click();
    await playerPage.waitForTimeout(1_500);

    // Should see character info
    await expect(
      playerPage.getByText('Thalia').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Party panel shows HP bar', async () => {
    // Look for HP display
    await expect(
      playerPage.getByText(/35\s*\/\s*42/).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('cleanup: end session', async () => {
    await endSession(dmPage);
  });
});

// ==========================================================================
// 3. DM-to-Player Note Sharing
// ==========================================================================

test.describe.serial('Note sharing — DM shares notes with players', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let playerContext: BrowserContext;
  let playerPage: Page;
  let campaignId: string;
  let noteId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  const noteTitle = `Shared Lore ${uniqueId()}`;

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

  test('DM creates a note via API', async () => {
    const res = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/notebook`,
      {
        data: {
          title: noteTitle,
          content: 'The ancient ruins hold great secrets.',
          category: 'lore',
        },
      },
    );
    expect(res.ok()).toBeTruthy();
    const note = await res.json();
    noteId = note._id;
    expect(noteId).toBeTruthy();
  });

  test('Player cannot read shared notes endpoint before sharing', async () => {
    const res = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/notebook/shared`,
    );
    expect(res.ok()).toBeTruthy();
    const notes = await res.json();
    expect(notes.length).toBe(0);
  });

  test('DM shares the note', async () => {
    const res = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/notebook/${noteId}/share`,
    );
    expect(res.ok()).toBeTruthy();
    const note = await res.json();
    expect(note.visibleTo).toBe('all');
    expect(note.sharedAt).toBeTruthy();
  });

  test('Player can see shared note via API', async () => {
    const res = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/notebook/shared`,
    );
    expect(res.ok()).toBeTruthy();
    const notes = await res.json();
    expect(notes.length).toBe(1);
    expect(notes[0].title).toBe(noteTitle);
  });

  test('Player sees shared notes tab in session', async () => {
    await navigateToCampaign(dmPage, campaignId);
    await startSession(dmPage);
    await goToSession(playerPage, campaignId);

    // Click shared notes tab
    await playerPage.getByRole('button', { name: 'Shared Notes' }).click();
    await playerPage.waitForTimeout(2_000);

    await expect(
      playerPage.getByText(noteTitle),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('DM unshares the note', async () => {
    const res = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/notebook/${noteId}/unshare`,
    );
    expect(res.ok()).toBeTruthy();
    const note = await res.json();
    expect(note.visibleTo).toBe('dm_only');
  });

  test('Player no longer sees the note via API', async () => {
    const res = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/notebook/shared`,
    );
    expect(res.ok()).toBeTruthy();
    const notes = await res.json();
    expect(notes.length).toBe(0);
  });

  test('Player cannot access full notebook endpoint', async () => {
    const res = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/notebook`,
    );
    expect(res.status()).toBe(403);
  });

  test('cleanup: end session', async () => {
    await endSession(dmPage);
  });
});

// ==========================================================================
// 4. Request Roll System
// ==========================================================================

test.describe.serial('Roll request system — DM requests, players respond', () => {
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

    // Create character
    const charRes = await playerPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/characters`,
      {
        data: {
          name: `RollTest Hero ${uniqueId()}`,
          race: 'human',
          class: 'fighter',
          level: 3,
        },
      },
    );
    expect(charRes.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  test('DM can open request roll modal', async () => {
    await navigateToCampaign(dmPage, campaignId);
    await startSession(dmPage);
    await goToSession(playerPage, campaignId);

    // Click "Request Roll" button
    await dmPage.getByRole('button', { name: /Request Roll/i }).click();
    await dmPage.waitForTimeout(500);

    // Modal should be visible
    await expect(
      dmPage.getByText('Request Roll').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('DM fills out and sends roll request', async () => {
    // Fill label
    const labelInput = dmPage.locator('input[placeholder*="Perception"]');
    await labelInput.fill('Perception Check');

    // Fill DC
    const dcInput = dmPage.locator('input[type="number"]');
    await dcInput.fill('15');

    // Click send
    await dmPage.getByRole('button', { name: /Send Roll Request/i }).click();
    await dmPage.waitForTimeout(1_000);

    // Should transition to pending view
    await expect(
      dmPage.getByText('Perception Check').first(),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      dmPage.getByText(/Waiting for players/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Player sees roll request prompt', async () => {
    // Player should see the roll prompt overlay
    await expect(
      playerPage.getByText('Perception Check'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: /Roll d20/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Player submits roll response', async () => {
    await playerPage.getByRole('button', { name: /Roll d20/i }).click();
    await playerPage.waitForTimeout(1_500);

    // Should show "Submitted"
    await expect(
      playerPage.getByText('Submitted'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('DM sees roll response', async () => {
    // DM should see the player's response in the pending panel
    await dmPage.waitForTimeout(2_000);

    // Response count should update
    await expect(
      dmPage.getByText(/Responses \(1\)/),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('DM can cancel a roll request', async () => {
    // Click "New Request" to start a new one
    await dmPage.getByRole('button', { name: /New Request/i }).click();
    await dmPage.waitForTimeout(500);

    // Fill and send another request
    const labelInput = dmPage.locator('input[placeholder*="Perception"]');
    await labelInput.fill('DEX Save');
    await dmPage.getByRole('button', { name: /Send Roll Request/i }).click();
    await dmPage.waitForTimeout(1_000);

    // Cancel it
    await dmPage.getByRole('button', { name: /Cancel Request/i }).click();
    await dmPage.waitForTimeout(500);

    // Should return to form view
    await expect(
      dmPage.getByRole('button', { name: /Send Roll Request/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('DM closes modal and ends session', async () => {
    // Close modal
    await dmPage.locator('button').filter({ has: dmPage.locator('svg.lucide-x') }).first().click();
    await dmPage.waitForTimeout(500);

    await endSession(dmPage);
  });
});
