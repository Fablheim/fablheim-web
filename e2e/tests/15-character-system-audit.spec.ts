import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, uniqueId } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  generateInviteCode,
  joinCampaignByCode,
} from './helpers/campaign-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

const TEST_CHARACTER = {
  name: `TestChar_${uniqueId()}`,
  class: 'fighter',
  race: 'human',
  level: 5,
  stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  hp: { current: 44, max: 44, temp: 0 },
  ac: 18,
  speed: 30,
  initiativeBonus: 2,
  attacks: [],
  spellSlots: {
    level1: { current: 2, max: 2 },
    level2: { current: 1, max: 1 },
  },
  passiveScores: { perception: 13, insight: 11, investigation: 10 },
};

// ==========================================================================
// 1. Character Authorization
// ==========================================================================

test.describe.serial('Character authorization — owner, DM, player', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  let otherContext: BrowserContext;
  let otherPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;

  test.beforeAll(async ({ browser }) => {
    // DM creates campaign
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Player 1 (owner) joins and creates character
    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId },
    });
    expect(charRes.ok()).toBeTruthy();
    const charBody = await charRes.json();
    characterId = charBody._id;

    // Player 2 (other) joins campaign
    const inviteCode2 = await generateInviteCode(dmPage, campaignId);
    otherContext = await browser.newContext();
    otherPage = await otherContext.newPage();
    await signUp(otherPage, accounts.player2);
    await joinCampaignByCode(otherPage, inviteCode2);
  });

  test.afterAll(async () => {
    await dmContext?.close();
    await ownerContext?.close();
    await otherContext?.close();
  });

  test('owner can read own character', async () => {
    const res = await ownerPage.request.get(`${API_BASE}/characters/${characterId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.name).toBe(TEST_CHARACTER.name);
  });

  test('owner can edit own character', async () => {
    const res = await ownerPage.request.patch(`${API_BASE}/characters/${characterId}`, {
      data: { name: `${TEST_CHARACTER.name}_updated` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.name).toContain('_updated');
  });

  test('DM can read any campaign character', async () => {
    const res = await dmPage.request.get(`${API_BASE}/characters/${characterId}`);
    expect(res.ok()).toBeTruthy();
  });

  test('DM can edit any campaign character', async () => {
    const res = await dmPage.request.patch(`${API_BASE}/characters/${characterId}`, {
      data: { name: TEST_CHARACTER.name },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('other player can read campaign character', async () => {
    const res = await otherPage.request.get(`${API_BASE}/characters/${characterId}`);
    expect(res.ok()).toBeTruthy();
  });

  test('other player cannot edit another player\'s character', async () => {
    const res = await otherPage.request.patch(`${API_BASE}/characters/${characterId}`, {
      data: { name: 'Hacked!' },
    });
    expect(res.status()).toBe(403);
  });

  test('other player cannot delete another player\'s character', async () => {
    const res = await otherPage.request.delete(`${API_BASE}/characters/${characterId}`);
    expect(res.status()).toBe(403);
  });

  test('player cannot create character in non-member campaign', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const id = uniqueId();
    await signUp(p, { username: `outsider_${id}`, email: `outsider_${id}@test.com`, password: 'TestPass123!' });

    const res = await p.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId },
    });
    expect(res.status()).toBe(403);
    await ctx.close();
  });

  test('unauthenticated user cannot access characters', async ({ request }) => {
    const res = await request.get(`${API_BASE}/characters/${characterId}`);
    expect(res.status()).toBe(401);
  });
});

// ==========================================================================
// 2. Combat State — HP Management
// ==========================================================================

test.describe.serial('Combat state — HP management', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId, hp: { current: 44, max: 44, temp: 5 } },
    });
    const charBody = await charRes.json();
    characterId = charBody._id;
  });

  test.afterAll(async () => {
    await dmContext?.close();
    await ownerContext?.close();
  });

  test('damage consumes temp HP before regular HP', async () => {
    // Character has 5 temp HP, 44/44 regular
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/damage`, {
      data: { amount: 8 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // 5 temp absorbed, 3 remaining applied to HP: 44 - 3 = 41
    expect(body.hp.temp).toBe(0);
    expect(body.hp.current).toBe(41);
  });

  test('HP cannot go below 0', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/damage`, {
      data: { amount: 999 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.hp.current).toBe(0);
  });

  test('healing does not exceed max HP', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/heal`, {
      data: { amount: 999 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.hp.current).toBe(body.hp.max);
  });

  test('DM can damage player character', async () => {
    const res = await dmPage.request.post(`${API_BASE}/characters/${characterId}/damage`, {
      data: { amount: 10 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.hp.current).toBe(34); // 44 - 10
  });

  test('temp HP takes higher value (no stacking)', async () => {
    // Add 5 temp HP, then try adding 3 — should stay at 5
    await ownerPage.request.post(`${API_BASE}/characters/${characterId}/temp-hp`, {
      data: { amount: 5 },
    });
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/temp-hp`, {
      data: { amount: 3 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.hp.temp).toBe(5);
  });
});

// ==========================================================================
// 3. Death Saves
// ==========================================================================

test.describe.serial('Death saves', () => {
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;

  test.beforeAll(async ({ browser }) => {
    const dmCtx = await browser.newContext();
    const dmPage = await dmCtx.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId },
    });
    const charBody = await charRes.json();
    characterId = charBody._id;

    // Knock character to 0 HP
    await ownerPage.request.post(`${API_BASE}/characters/${characterId}/damage`, {
      data: { amount: 999 },
    });

    await dmCtx.close();
  });

  test.afterAll(async () => {
    await ownerContext?.close();
  });

  test('death save initializes at 0 HP', async () => {
    const res = await ownerPage.request.get(`${API_BASE}/characters/${characterId}`);
    const body = await res.json();
    expect(body.hp.current).toBe(0);
    expect(body.deathSaves).toBeTruthy();
    expect(body.deathSaves.successes).toBe(0);
    expect(body.deathSaves.failures).toBe(0);
  });

  test('death save success increments correctly', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/death-save`, {
      data: { result: 'success' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.deathSaves.successes).toBe(1);
  });

  test('death save failure increments correctly', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/death-save`, {
      data: { result: 'failure' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.deathSaves.failures).toBe(1);
  });

  test('death saves reset on heal from 0 HP', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/heal`, {
      data: { amount: 5 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.hp.current).toBe(5);
    expect(body.deathSaves).toBeNull();
  });

  test('death save rejected when not at 0 HP', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/death-save`, {
      data: { result: 'success' },
    });
    expect(res.status()).toBe(400);
  });
});

// ==========================================================================
// 4. Spell Slots
// ==========================================================================

test.describe.serial('Spell slot management', () => {
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;

  test.beforeAll(async ({ browser }) => {
    const dmCtx = await browser.newContext();
    const dmPage = await dmCtx.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId },
    });
    const charBody = await charRes.json();
    characterId = charBody._id;

    await dmCtx.close();
  });

  test.afterAll(async () => {
    await ownerContext?.close();
  });

  test('consume spell slot decrements correctly', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/consume-spell-slot`, {
      data: { level: 1 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.spellSlots.level1.current).toBe(1); // was 2, now 1
  });

  test('restore spell slot increments correctly', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/restore-spell-slot`, {
      data: { level: 1 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.spellSlots.level1.current).toBe(2); // back to max
  });

  test('cannot consume when no slots available', async () => {
    // Use both level 2 slots
    await ownerPage.request.post(`${API_BASE}/characters/${characterId}/consume-spell-slot`, {
      data: { level: 2 },
    });
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/consume-spell-slot`, {
      data: { level: 2 },
    });
    expect(res.status()).toBe(400);
  });

  test('cannot restore beyond max', async () => {
    // Level 1 is at max (2/2), try to restore
    const res = await ownerPage.request.post(`${API_BASE}/characters/${characterId}/restore-spell-slot`, {
      data: { level: 1 },
    });
    expect(res.status()).toBe(400);
  });
});

// ==========================================================================
// 5. Inventory & Items
// ==========================================================================

test.describe.serial('Inventory and items', () => {
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;
  let swordId: string;

  test.beforeAll(async ({ browser }) => {
    const dmCtx = await browser.newContext();
    const dmPage = await dmCtx.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId },
    });
    const charBody = await charRes.json();
    characterId = charBody._id;

    await dmCtx.close();
  });

  test.afterAll(async () => {
    await ownerContext?.close();
  });

  test('create item succeeds', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/items`, {
      data: {
        characterId,
        campaignId,
        name: 'Longsword',
        type: 'weapon',
        quantity: 1,
        weight: 3,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    swordId = body._id;
    expect(body.name).toBe('Longsword');
  });

  test('equip item to slot', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/items/${swordId}/equip`, {
      data: { slot: 'mainHand' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.isEquipped).toBe(true);
    expect(body.slot).toBe('mainHand');
  });

  test('equip conflict auto-unequips previous item', async () => {
    // Create a second weapon
    const res2 = await ownerPage.request.post(`${API_BASE}/items`, {
      data: {
        characterId,
        campaignId,
        name: 'Battleaxe',
        type: 'weapon',
        quantity: 1,
        weight: 4,
      },
    });
    const axe = await res2.json();

    // Equip to same slot
    const equipRes = await ownerPage.request.post(`${API_BASE}/items/${axe._id}/equip`, {
      data: { slot: 'mainHand' },
    });
    expect(equipRes.ok()).toBeTruthy();

    // Original sword should be unequipped
    const swordRes = await ownerPage.request.get(`${API_BASE}/items/${swordId}`);
    const sword = await swordRes.json();
    expect(sword.isEquipped).toBe(false);
  });

  test('attunement limit enforced at 3', async () => {
    // Create 4 attunable items and try to attune all
    const items: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await ownerPage.request.post(`${API_BASE}/items`, {
        data: {
          characterId,
          campaignId,
          name: `Ring of Power ${i}`,
          type: 'wondrous',
          quantity: 1,
          weight: 0,
          isMagical: true,
          requiresAttunement: true,
        },
      });
      const body = await res.json();
      items.push(body._id);
    }

    // Attune first 3 — should succeed
    for (let i = 0; i < 3; i++) {
      const res = await ownerPage.request.post(`${API_BASE}/items/${items[i]}/toggle-attunement`);
      expect(res.ok()).toBeTruthy();
    }

    // 4th attunement should fail
    const res = await ownerPage.request.post(`${API_BASE}/items/${items[3]}/toggle-attunement`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('3');
  });

  test('currency cannot be set to negative values', async () => {
    const res = await ownerPage.request.patch(`${API_BASE}/items/currency/${characterId}`, {
      data: { gp: -10 },
    });
    expect(res.status()).toBe(400);
  });

  test('currency update succeeds with valid values', async () => {
    const res = await ownerPage.request.patch(`${API_BASE}/items/currency/${characterId}`, {
      data: { gp: 50, sp: 25 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.gp).toBe(50);
    expect(body.sp).toBe(25);
  });
});

// ==========================================================================
// 6. Progression System
// ==========================================================================

test.describe.serial('Progression system', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId, level: 1, xp: 0 },
    });
    const charBody = await charRes.json();
    characterId = charBody._id;
  });

  test.afterAll(async () => {
    await dmContext?.close();
    await ownerContext?.close();
  });

  test('DM can award XP', async () => {
    const res = await dmPage.request.post(`${API_BASE}/progression/${characterId}/award-xp`, {
      data: { amount: 300, reason: 'Defeated goblins' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.character.xp).toBe(300);
    expect(body.leveledUp).toBe(true);
    expect(body.newLevel).toBe(2);
  });

  test('player cannot award XP to own character', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/progression/${characterId}/award-xp`, {
      data: { amount: 100 },
    });
    expect(res.status()).toBe(403);
  });

  test('negative XP award rejected', async () => {
    const res = await dmPage.request.post(`${API_BASE}/progression/${characterId}/award-xp`, {
      data: { amount: -100 },
    });
    expect(res.status()).toBe(400);
  });

  test('set level with bounds validation', async () => {
    // Valid level
    const res = await dmPage.request.put(`${API_BASE}/progression/${characterId}/set-level`, {
      data: { level: 10 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.level).toBe(10);

    // Level 0 rejected
    const res0 = await dmPage.request.put(`${API_BASE}/progression/${characterId}/set-level`, {
      data: { level: 0 },
    });
    expect(res0.status()).toBe(400);

    // Level 21 rejected
    const res21 = await dmPage.request.put(`${API_BASE}/progression/${characterId}/set-level`, {
      data: { level: 21 },
    });
    expect(res21.status()).toBe(400);
  });

  test('negative XP rejected on set-xp', async () => {
    const res = await dmPage.request.put(`${API_BASE}/progression/${characterId}/set-xp`, {
      data: { xp: -100 },
    });
    expect(res.status()).toBe(400);
  });

  test('party XP awards to all campaign characters', async () => {
    // Create a second character
    const char2Res = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, name: `Char2_${uniqueId()}`, campaignId, level: 1, xp: 0 },
    });
    const char2 = await char2Res.json();

    // Award party XP
    const res = await dmPage.request.post(`${API_BASE}/progression/party-xp`, {
      data: { campaignId, totalXP: 1000 },
    });
    expect(res.ok()).toBeTruthy();
    const results = await res.json();
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Clean up
    await ownerPage.request.delete(`${API_BASE}/characters/${char2._id}`);
  });
});

// ==========================================================================
// 7. Character Creation
// ==========================================================================

test.describe.serial('Character creation validation', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);
  });

  test.afterAll(async () => {
    await dmContext?.close();
    await ownerContext?.close();
  });

  test('character creation with valid data succeeds', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, name: `ValidChar_${uniqueId()}`, campaignId },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body._id).toBeTruthy();
    expect(body.campaignId).toBe(campaignId);
  });

  test('character creation without name fails', async () => {
    const { name: _name, ...noName } = TEST_CHARACTER;
    const res = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...noName, campaignId },
    });
    expect(res.status()).toBe(400);
  });

  test('character creation without campaignId fails', async () => {
    const res = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER },
    });
    expect(res.status()).toBe(400);
  });
});

// ==========================================================================
// 8. Conditions
// ==========================================================================

test.describe.serial('Condition management', () => {
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;

  test.beforeAll(async ({ browser }) => {
    const dmCtx = await browser.newContext();
    const dmPage = await dmCtx.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId },
    });
    const charBody = await charRes.json();
    characterId = charBody._id;

    await dmCtx.close();
  });

  test.afterAll(async () => {
    await ownerContext?.close();
  });

  test('set conditions on character', async () => {
    const res = await ownerPage.request.patch(`${API_BASE}/characters/${characterId}/conditions`, {
      data: { conditions: ['poisoned', 'frightened'] },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.conditions).toContain('poisoned');
    expect(body.conditions).toContain('frightened');
  });

  test('clear all conditions', async () => {
    const res = await ownerPage.request.patch(`${API_BASE}/characters/${characterId}/conditions`, {
      data: { conditions: [] },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.conditions).toHaveLength(0);
  });
});

// ==========================================================================
// 9. Spells
// ==========================================================================

test.describe.serial('Spell management', () => {
  let ownerContext: BrowserContext;
  let ownerPage: Page;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  let campaignId: string;
  let characterId: string;
  let spellId: string;
  let characterSpellId: string;

  test.beforeAll(async ({ browser }) => {
    const dmCtx = await browser.newContext();
    const dmPage = await dmCtx.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    const inviteCode = await generateInviteCode(dmPage, campaignId);
    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, accounts.player1);
    await joinCampaignByCode(ownerPage, inviteCode);

    const charRes = await ownerPage.request.post(`${API_BASE}/characters`, {
      data: { ...TEST_CHARACTER, campaignId },
    });
    const charBody = await charRes.json();
    characterId = charBody._id;

    // Get a spell from the SRD list
    const spellsRes = await ownerPage.request.get(`${API_BASE}/spells?limit=1`);
    const spells = await spellsRes.json();
    if (spells.length > 0) {
      spellId = spells[0]._id;
    }

    await dmCtx.close();
  });

  test.afterAll(async () => {
    await ownerContext?.close();
  });

  test('learn spell succeeds', async () => {
    if (!spellId) return test.skip();
    const res = await ownerPage.request.post(`${API_BASE}/spells/learn`, {
      data: { characterId, spellId },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    characterSpellId = body._id;
    expect(body.spellId).toBeTruthy();
  });

  test('cannot learn same spell twice', async () => {
    if (!spellId) return test.skip();
    const res = await ownerPage.request.post(`${API_BASE}/spells/learn`, {
      data: { characterId, spellId },
    });
    // Should fail with conflict (duplicate unique index)
    expect(res.ok()).toBeFalsy();
  });

  test('prepare spell toggles correctly', async () => {
    if (!characterSpellId) return test.skip();
    const res = await ownerPage.request.patch(`${API_BASE}/spells/character-spell/${characterSpellId}/prepare`, {
      data: { isPrepared: true },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.isPrepared).toBe(true);
  });

  test('forget spell removes it', async () => {
    if (!characterSpellId) return test.skip();
    const res = await ownerPage.request.delete(`${API_BASE}/spells/character-spell/${characterSpellId}`);
    expect(res.status()).toBe(204);

    // Verify it's gone
    const listRes = await ownerPage.request.get(`${API_BASE}/spells/character/${characterId}`);
    const list = await listRes.json();
    const found = list.find((s: unknown) => (s as Record<string, unknown>)._id === characterSpellId);
    expect(found).toBeUndefined();
  });
});

// ==========================================================================
// 10. API Auth Boundaries
// ==========================================================================

test.describe('Character API auth boundaries', () => {
  test('unauthenticated POST to characters returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/characters`, {
      data: { name: 'Hacked', campaignId: 'aaaaaaaaaaaaaaaaaaaaaaaa' },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated POST to damage returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/characters/aaaaaaaaaaaaaaaaaaaaaaaa/damage`, {
      data: { amount: 10 },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated POST to progression returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/progression/aaaaaaaaaaaaaaaaaaaaaaaa/award-xp`, {
      data: { amount: 100 },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated POST to items returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/items`, {
      data: { characterId: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Hacked' },
    });
    expect(res.status()).toBe(401);
  });
});
