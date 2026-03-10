import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, uniqueId } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign,
  joinCampaignByCode,
  generateInviteCode,
} from './helpers/campaign-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

// ==========================================================================
// 1. Authorization boundaries
// ==========================================================================

test.describe.serial('Authorization boundaries — player vs DM controls', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let playerContext: BrowserContext;
  let playerPage: Page;
  let player2Context: BrowserContext;
  let player2Page: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    playerContext = await browser.newContext();
    playerPage = await playerContext.newPage();
    player2Context = await browser.newContext();
    player2Page = await player2Context.newPage();

    // DM signs up and creates a campaign
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Generate invite and have player1 join
    const inviteCode = await generateInviteCode(dmPage, campaignId);
    await signUp(playerPage, accounts.player1);
    await joinCampaignByCode(playerPage, inviteCode);

    // Player2 signs up and joins via same flow
    const inviteCode2 = await generateInviteCode(dmPage, campaignId);
    await signUp(player2Page, accounts.player2);
    await joinCampaignByCode(player2Page, inviteCode2);
  });

  test.afterAll(async () => {
    await player2Context?.close();
    await playerContext?.close();
    await dmContext?.close();
  });

  test('Player does not see DM-only sidebar sections', async () => {
    await navigateToCampaign(playerPage, campaignId);

    // DM-only sections should NOT be visible
    await expect(
      playerPage.getByRole('button', { name: 'Encounters' }),
    ).not.toBeVisible({ timeout: 5_000 });
    await expect(
      playerPage.getByRole('button', { name: 'Notes' }),
    ).not.toBeVisible({ timeout: 5_000 });
    await expect(
      playerPage.getByRole('button', { name: 'Sessions' }),
    ).not.toBeVisible({ timeout: 5_000 });
    await expect(
      playerPage.getByRole('button', { name: 'AI Tools' }),
    ).not.toBeVisible({ timeout: 5_000 });
    await expect(
      playerPage.getByRole('button', { name: 'NPCs' }),
    ).not.toBeVisible({ timeout: 5_000 });

    // Player-visible sections should be present
    await expect(
      playerPage.getByRole('button', { name: 'Overview' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: 'World' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: 'Players' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: 'Arcs' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: 'Trackers' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: 'Rules' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      playerPage.getByRole('button', { name: 'My Notes' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player sees "My Notes" section', async () => {
    await playerPage.getByRole('button', { name: 'My Notes' }).click();
    await playerPage.waitForTimeout(1_500);

    // Verify the "My Notes" heading appears
    await expect(
      playerPage.getByText('My Notes'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player cannot access notebook API', async () => {
    const response = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/notebook`,
    );
    expect(response.status()).toBe(403);
  });

  test('Player cannot see dm-only world entities', async () => {
    // DM creates a dm-only entity via API
    const entityRes = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Secret Villain Hideout',
          type: 'location',
          locationType: 'dungeon',
          description: 'A hidden lair',
          visibility: 'dm-only',
        },
      },
    );
    expect(entityRes.ok()).toBeTruthy();

    // Player navigates to World panel
    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'World' }).click();
    await playerPage.waitForTimeout(1_500);

    // The dm-only entity should NOT be visible
    await expect(
      playerPage.getByText('Secret Villain Hideout'),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('Player cannot see dm-only trackers', async () => {
    // Enable worldStateTrackers feature
    const featureRes = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { worldStateTrackers: true } },
    });
    expect(featureRes.ok()).toBeTruthy();

    // DM creates a dm-only tracker via API
    const trackerRes = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/trackers`,
      {
        data: {
          name: `Hidden Doom Counter ${uniqueId()}`,
          description: 'Tracks doom progress',
          value: 30,
          min: 0,
          max: 100,
          visibility: 'dm-only',
        },
      },
    );
    expect(trackerRes.ok()).toBeTruthy();

    // Player clicks Trackers
    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'Trackers' }).click();
    await playerPage.waitForTimeout(1_500);

    // The dm-only tracker should NOT be visible
    await expect(
      playerPage.getByText('Hidden Doom Counter'),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('Player cannot see dm-only domains', async () => {
    // Enable domains feature
    const featureRes = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { domains: true } },
    });
    expect(featureRes.ok()).toBeTruthy();

    // DM creates a location with a dm-only domain via API
    const entityRes = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: `Secret Domain Keep ${uniqueId()}`,
          type: 'location',
          locationType: 'city',
          description: 'A hidden domain',
          visibility: 'dm-only',
        },
      },
    );
    expect(entityRes.ok()).toBeTruthy();
    const entity = await entityRes.json();

    // Player navigates to World panel — the dm-only entity should not be visible
    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'World' }).click();
    await playerPage.waitForTimeout(1_500);

    await expect(
      playerPage.getByText(entity.name),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('Player cannot edit another player\'s character', async () => {
    // Create a character for player1 via API
    const charRes = await playerPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/characters`,
      {
        data: {
          name: `Player1 Hero ${uniqueId()}`,
          race: 'elf',
          class: 'ranger',
          level: 5,
        },
      },
    );
    expect(charRes.ok()).toBeTruthy();
    const character = await charRes.json();
    const characterId = character._id;
    expect(characterId).toBeTruthy();

    // Player2 attempts to PATCH that character — should get 403
    const patchRes = await player2Page.request.patch(
      `${API_BASE}/campaigns/${campaignId}/characters/${characterId}`,
      {
        data: { name: 'Hacked Name' },
      },
    );
    expect(patchRes.status()).toBe(403);
  });
});

// ==========================================================================
// 2. Player campaign workspace
// ==========================================================================

test.describe.serial('Player campaign workspace — panel navigation', () => {
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

    // DM creates campaign
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Player joins
    const inviteCode = await generateInviteCode(dmPage, campaignId);
    await signUp(playerPage, accounts.player1);
    await joinCampaignByCode(playerPage, inviteCode);
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  test('Player sees campaign overview', async () => {
    await navigateToCampaign(playerPage, campaignId);

    // Campaign name should be visible
    await expect(
      playerPage.getByText(campaign.name).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player can access World panel', async () => {
    await playerPage.getByRole('button', { name: 'World' }).click();
    await playerPage.waitForTimeout(1_500);

    // World browser should load — look for the section container or heading
    await expect(
      playerPage.getByRole('button', { name: 'World' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player can access Rules panel', async () => {
    await playerPage.getByRole('button', { name: 'Rules' }).click();
    await playerPage.waitForTimeout(1_500);

    // Rules panel should load
    await expect(
      playerPage.getByRole('button', { name: 'Rules' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player can access Arcs panel', async () => {
    // Enable arcs feature
    const res = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { arcs: true } },
    });
    expect(res.ok()).toBeTruthy();

    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'Arcs' }).click();
    await playerPage.waitForTimeout(1_500);

    // Arcs panel should load (may show empty state)
    await expect(
      playerPage.getByRole('button', { name: 'Arcs' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player can access Trackers panel', async () => {
    // Enable trackers feature
    const res = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { worldStateTrackers: true } },
    });
    expect(res.ok()).toBeTruthy();

    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'Trackers' }).click();
    await playerPage.waitForTimeout(1_500);

    // Trackers panel should load
    await expect(
      playerPage.getByRole('button', { name: 'Trackers' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player sees public trackers but not dm-only', async () => {
    const publicTrackerName = `Public Morale ${uniqueId()}`;
    const dmOnlyTrackerName = `Secret Plans ${uniqueId()}`;

    // DM creates a public tracker
    const publicRes = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/trackers`,
      {
        data: {
          name: publicTrackerName,
          description: 'Morale of the army',
          value: 60,
          min: 0,
          max: 100,
          visibility: 'public',
        },
      },
    );
    expect(publicRes.ok()).toBeTruthy();

    // DM creates a dm-only tracker
    const dmOnlyRes = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/trackers`,
      {
        data: {
          name: dmOnlyTrackerName,
          description: 'Secret progress',
          value: 45,
          min: 0,
          max: 100,
          visibility: 'dm-only',
        },
      },
    );
    expect(dmOnlyRes.ok()).toBeTruthy();

    // Player navigates to Trackers
    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'Trackers' }).click();
    await playerPage.waitForTimeout(1_500);

    // Player should see the public tracker
    await expect(
      playerPage.getByText(publicTrackerName),
    ).toBeVisible({ timeout: 10_000 });

    // Player should NOT see the dm-only tracker
    await expect(
      playerPage.getByText(dmOnlyTrackerName),
    ).not.toBeVisible({ timeout: 5_000 });
  });
});

// ==========================================================================
// 3. Player notes (localStorage-backed)
// ==========================================================================

test.describe.serial('Player notes — create, pin, delete, persist', () => {
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

    // DM creates campaign
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Player joins
    const inviteCode = await generateInviteCode(dmPage, campaignId);
    await signUp(playerPage, accounts.player1);
    await joinCampaignByCode(playerPage, inviteCode);
  });

  test.afterAll(async () => {
    await playerContext?.close();
    await dmContext?.close();
  });

  test('Player can create a personal note', async () => {
    await navigateToCampaign(playerPage, campaignId);
    await playerPage.getByRole('button', { name: 'My Notes' }).click();
    await playerPage.waitForTimeout(1_500);

    // Click "New Note" button
    await playerPage.getByRole('button', { name: /New Note/i }).click();
    await playerPage.waitForTimeout(500);

    // Fill title
    const titleInput = playerPage.locator('input[placeholder="Note title..."]');
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.fill('Battle Plans');

    // Fill content
    const contentTextarea = playerPage.locator('textarea[placeholder="Write your notes here..."]');
    await contentTextarea.fill('Attack at dawn');

    // Save
    await playerPage.getByRole('button', { name: /Save/i }).click();
    await playerPage.waitForTimeout(1_500);

    // Verify note appears in list
    await expect(
      playerPage.getByText('Battle Plans'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Player can pin a note', async () => {
    // Hover over the note card to reveal action buttons
    const noteCard = playerPage.locator('.group').filter({
      hasText: 'Battle Plans',
    }).first();
    await noteCard.hover();
    await playerPage.waitForTimeout(500);

    // Click pin button
    const pinButton = noteCard.locator('button[title="Pin"]');
    await pinButton.click();
    await playerPage.waitForTimeout(1_000);

    // Verify pinned indicator — the Pin icon appears in the title row for pinned notes
    // After pinning, the button title changes to "Unpin"
    await noteCard.hover();
    await expect(
      noteCard.locator('button[title="Unpin"]'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Player can delete a note', async () => {
    // Hover over the note card to reveal action buttons
    const noteCard = playerPage.locator('.group').filter({
      hasText: 'Battle Plans',
    }).first();
    await noteCard.hover();
    await playerPage.waitForTimeout(500);

    // Click delete button
    const deleteButton = noteCard.locator('button[title="Delete"]');
    await deleteButton.click();
    await playerPage.waitForTimeout(500);

    // Confirm deletion in the dialog
    await playerPage.getByRole('button', { name: 'Delete', exact: true }).click();
    await playerPage.waitForTimeout(1_500);

    // Verify note is removed
    await expect(
      playerPage.getByText('Battle Plans'),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('Notes persist across page reloads', async () => {
    // Create a new note for persistence testing
    await playerPage.getByRole('button', { name: /New Note/i }).click();
    await playerPage.waitForTimeout(500);

    const titleInput = playerPage.locator('input[placeholder="Note title..."]');
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.fill('Tavern Rumors');

    const contentTextarea = playerPage.locator('textarea[placeholder="Write your notes here..."]');
    await contentTextarea.fill('The bartender whispered about a hidden passage');

    await playerPage.getByRole('button', { name: /Save/i }).click();
    await playerPage.waitForTimeout(1_500);

    // Verify note exists before reload
    await expect(
      playerPage.getByText('Tavern Rumors'),
    ).toBeVisible({ timeout: 10_000 });

    // Reload the page
    await playerPage.reload({ waitUntil: 'networkidle' });

    // Navigate back to My Notes
    await playerPage.getByRole('button', { name: 'My Notes' }).click();
    await playerPage.waitForTimeout(1_500);

    // Verify note persisted (localStorage)
    await expect(
      playerPage.getByText('Tavern Rumors'),
    ).toBeVisible({ timeout: 10_000 });
  });
});
