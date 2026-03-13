import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign as _navigateToCampaign,
  joinCampaignByCode,
  generateInviteCode,
} from './helpers/campaign-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

// ==========================================================================
// 1. DM Field Stripping — players must not see DM-only entity fields
// ==========================================================================

test.describe.serial('DM field stripping on world entities', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let playerContext: BrowserContext;
  let playerPage: Page;
  let campaignId: string;
  let factionId: string;
  let npcId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    playerContext = await browser.newContext();
    playerPage = await playerContext.newPage();

    // DM setup
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

  test('DM creates a faction with reputation and hidden goals via API', async () => {
    const response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Thieves Guild',
          type: 'faction',
          description: 'A shadowy network',
          visibility: 'public',
          disposition: 'unfriendly',
          reputation: -25,
          hiddenGoals: 'Overthrow the king and install a puppet ruler',
          reputationHistory: [
            { description: 'Robbed the treasury', delta: -10, date: new Date().toISOString() },
          ],
          factionRelationships: [],
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    factionId = body._id;
    expect(factionId).toBeTruthy();
  });

  test('DM creates an NPC with secrets and loyalties via API', async () => {
    const response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Vex the Informant',
          type: 'npc',
          description: 'A street-savvy informant',
          visibility: 'public',
          npcDisposition: 'neutral',
          secrets: [
            { description: 'Actually works for the crown', revealed: false },
          ],
          motivations: ['Money', 'Survival'],
          loyalties: [
            { factionEntityId: factionId, strength: 70 },
          ],
          attitudeHistory: [
            { description: 'Met the party at the tavern', date: new Date().toISOString() },
          ],
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    npcId = body._id;
    expect(npcId).toBeTruthy();
  });

  test('DM can see all DM-only fields on the faction', async () => {
    const response = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${factionId}`,
    );
    expect(response.ok()).toBeTruthy();
    const entity = await response.json();
    expect(entity.hiddenGoals).toBeTruthy();
    expect(entity.reputationHistory).toBeDefined();
    expect(entity.reputationHistory.length).toBeGreaterThan(0);
  });

  test('Player CANNOT see DM-only fields on the faction', async () => {
    const response = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${factionId}`,
    );
    expect(response.ok()).toBeTruthy();
    const entity = await response.json();

    // These fields must be stripped
    expect(entity.hiddenGoals).toBeUndefined();
    expect(entity.reputationHistory).toBeUndefined();
    expect(entity.factionRelationships).toBeUndefined();
    expect(entity.secrets).toBeUndefined();
    expect(entity.loyalties).toBeUndefined();
    expect(entity.attitudeHistory).toBeUndefined();
    expect(entity.outcomes).toBeUndefined();
    expect(entity.stakes).toBeUndefined();
    expect(entity.factionImpact).toBeUndefined();

    // Public fields should still be present
    expect(entity.name).toBe('Thieves Guild');
    expect(entity.description).toBeTruthy();
  });

  test('Player CANNOT see DM-only fields on the NPC', async () => {
    const response = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${npcId}`,
    );
    expect(response.ok()).toBeTruthy();
    const entity = await response.json();

    expect(entity.secrets).toBeUndefined();
    expect(entity.loyalties).toBeUndefined();
    expect(entity.attitudeHistory).toBeUndefined();
    expect(entity.name).toBe('Vex the Informant');
  });

  test('Player CANNOT see DM-only fields in list endpoint', async () => {
    const response = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
    );
    expect(response.ok()).toBeTruthy();
    const entities: unknown[] = await response.json();
    const faction = entities.find((e: unknown) => (e as Record<string, unknown>).name === 'Thieves Guild') as Record<string, unknown> | undefined;
    expect(faction).toBeTruthy();
    expect(faction.hiddenGoals).toBeUndefined();
    expect(faction.reputationHistory).toBeUndefined();
  });
});

// ==========================================================================
// 2. Feature Flag Gating
// ==========================================================================

test.describe.serial('Feature flag gating on world endpoints', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  let questId: string;
  let factionId: string;
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

  test('create quest and faction for flag tests', async () => {
    // Create a quest
    let response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Flag Test Quest',
          type: 'quest',
          questStatus: 'active',
          outcomes: [
            { id: 'o1', description: 'Victory', chosen: false },
            { id: 'o2', description: 'Defeat', chosen: false },
          ],
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    questId = (await response.json())._id;

    // Create a faction
    response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Flag Test Faction',
          type: 'faction',
          disposition: 'neutral',
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    factionId = (await response.json())._id;
  });

  test('quest-status endpoint is gated by questBranching feature', async () => {
    // Disable the feature
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { questBranching: false } },
    });

    const response = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${questId}/quest-status`,
      { data: { status: 'completed' } },
    );
    expect(response.status()).toBe(403);

    // Re-enable the feature
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { questBranching: true } },
    });
  });

  test('reputation endpoint is gated by factionReputation feature', async () => {
    // Disable the feature
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { factionReputation: false } },
    });

    const response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${factionId}/reputation`,
      { data: { delta: 10, description: 'Test' } },
    );
    expect(response.status()).toBe(403);

    // Re-enable
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { factionReputation: true } },
    });
  });

  test('reputation endpoint works when feature is enabled', async () => {
    const response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${factionId}/reputation`,
      { data: { delta: 15, description: 'Helped the militia' } },
    );
    expect(response.ok()).toBeTruthy();
    const entity = await response.json();
    expect(entity.reputation).toBe(15);
    expect(entity.reputationHistory?.length).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 3. Entity Relationship & Hierarchy Validation
// ==========================================================================

test.describe.serial('Entity relationship and hierarchy validation', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  let otherCampaignId: string;
  let locationAId: string;
  let locationBId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Create a second campaign for cross-campaign testing
    await dmPage.goto('/app/campaigns');
    const campaign2 = generateCampaignData();
    otherCampaignId = await createCampaign(dmPage, campaign2);
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('create test locations for hierarchy tests', async () => {
    let response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      { data: { name: 'Region A', type: 'location', locationType: 'region' } },
    );
    expect(response.ok()).toBeTruthy();
    locationAId = (await response.json())._id;

    response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'City B',
          type: 'location',
          locationType: 'city',
          parentEntityId: locationAId,
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    locationBId = (await response.json())._id;
  });

  test('setting circular parent reference is rejected', async () => {
    // Try to set A's parent to B (which is already a child of A)
    const response = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${locationAId}`,
      { data: { parentEntityId: locationBId } },
    );
    expect(response.status()).toBe(400);
  });

  test('cross-campaign entity references are rejected', async () => {
    // Create an entity in the other campaign
    const otherResponse = await dmPage.request.post(
      `${API_BASE}/campaigns/${otherCampaignId}/world/entities`,
      { data: { name: 'Foreign NPC', type: 'npc' } },
    );
    expect(otherResponse.ok()).toBeTruthy();
    const foreignId = (await otherResponse.json())._id;

    // Try to link it as a related entity in campaign 1
    const response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Local Quest',
          type: 'quest',
          relatedEntities: [
            { entityId: foreignId, relationshipType: 'involves' },
          ],
        },
      },
    );
    // Should be rejected (400) because foreign entity doesn't belong to this campaign
    expect(response.status()).toBe(400);
  });
});

// ==========================================================================
// 4. Campaign Context Security
// ==========================================================================

test.describe.serial('Campaign context DM field stripping', () => {
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

  test('seed campaign context with sensitive data', async () => {
    const response = await dmPage.request.put(
      `${API_BASE}/campaigns/${campaignId}/context`,
      {
        data: {
          keyNPCs: [
            {
              name: 'Lord Blackthorn',
              role: 'Antagonist',
              secrets: 'Plans to summon an elder dragon',
            },
          ],
          plotThreads: [
            {
              name: 'The Dragon Plot',
              description: 'An evil lord summons a dragon',
              status: 'active',
            },
          ],
          dmPreferences: {
            tone: 'dark',
            themes: ['betrayal', 'redemption'],
          },
        },
      },
    );
    // PUT may return 200 or 201
    expect(response.ok()).toBeTruthy();
  });

  test('DM sees full campaign context including secrets', async () => {
    const response = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/context`,
    );
    expect(response.ok()).toBeTruthy();
    const ctx = await response.json();
    expect(ctx.keyNPCs?.[0]?.secrets).toBeTruthy();
    expect(ctx.plotThreads).toBeDefined();
    expect(ctx.dmPreferences).toBeDefined();
  });

  test('player does NOT see campaign context secrets', async () => {
    const response = await playerPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/context`,
    );
    expect(response.ok()).toBeTruthy();
    const ctx = await response.json();

    // Secrets should be stripped
    if (ctx.keyNPCs?.[0]) {
      expect(ctx.keyNPCs[0].secrets).toBeUndefined();
    }
    // plotThreads and dmPreferences should be stripped entirely
    expect(ctx.plotThreads).toBeUndefined();
    expect(ctx.dmPreferences).toBeUndefined();
  });
});

// ==========================================================================
// 5. Arcs & Trackers API
// ==========================================================================

test.describe.serial('Campaign arcs and world state trackers', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  let arcId: string;
  let trackerId: string;
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

  test('DM can create an arc', async () => {
    const response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/arcs`,
      {
        data: {
          name: 'The Dragon War',
          description: 'An epic arc about dragons',
          status: 'active',
          milestones: [
            { description: 'Find the dragon egg' },
            { description: 'Awaken the dragon' },
            { description: 'Defeat the dragon' },
          ],
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const arcs = body.arcs ?? [];
    const newArc = arcs.find((a: unknown) => (a as Record<string, unknown>).name === 'The Dragon War');
    expect(newArc).toBeTruthy();
    arcId = newArc._id;
    expect(newArc.milestones.length).toBe(3);
  });

  test('DM can toggle a milestone', async () => {
    // Get the arc milestones
    const arcsResponse = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/arcs`,
    );
    expect(arcsResponse.ok()).toBeTruthy();
    const arcs = await arcsResponse.json();
    const arc = arcs.find((a: unknown) => (a as Record<string, unknown>)._id === arcId);
    const milestoneId = arc.milestones[0]._id;

    const response = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/arcs/${arcId}/milestones/${milestoneId}`,
    );
    expect(response.ok()).toBeTruthy();
    const updated = await response.json();
    const updatedArc = updated.arcs.find((a: unknown) => (a as Record<string, unknown>)._id === arcId);
    expect(updatedArc.milestones[0].completed).toBe(true);
  });

  test('DM can create a world state tracker', async () => {
    const response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/trackers`,
      {
        data: {
          name: 'Kingdom Stability',
          description: 'How stable is the kingdom?',
          value: 75,
          min: 0,
          max: 100,
          thresholds: [
            { value: 25, label: 'Civil War', effect: 'Factions turn hostile' },
            { value: 75, label: 'Prosperous', effect: 'Trade bonuses' },
          ],
          visibility: 'public',
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const trackers = body.worldStateTrackers ?? [];
    const newTracker = trackers.find((t: unknown) => (t as Record<string, unknown>).name === 'Kingdom Stability');
    expect(newTracker).toBeTruthy();
    trackerId = newTracker._id;
    expect(newTracker.value).toBe(75);
  });

  test('DM can adjust a tracker value', async () => {
    const response = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/trackers/${trackerId}/adjust`,
      { data: { delta: -10 } },
    );
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const tracker = body.worldStateTrackers.find((t: unknown) => (t as Record<string, unknown>)._id === trackerId);
    expect(tracker.value).toBe(65);
  });

  test('arcs are gated by arcs feature flag', async () => {
    // Disable arcs feature
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { arcs: false } },
    });

    const response = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/arcs`,
    );
    expect(response.status()).toBe(403);

    // Re-enable
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { arcs: true } },
    });
  });

  test('trackers are gated by worldStateTrackers feature flag', async () => {
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { worldStateTrackers: false } },
    });

    const response = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/trackers`,
    );
    expect(response.status()).toBe(403);

    // Re-enable
    await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { worldStateTrackers: true } },
    });
  });
});

// ==========================================================================
// 6. Quest Side Effects Chain
// ==========================================================================

test.describe.serial('Quest side effects when choosing outcome', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  let factionId: string;
  let questId: string;
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

  test('set up faction and quest with faction impact', async () => {
    // Create a faction
    let response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Town Guard',
          type: 'faction',
          disposition: 'neutral',
          reputation: 0,
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    factionId = (await response.json())._id;

    // Create a quest with faction impact and outcomes
    response = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: 'Rescue the Captain',
          type: 'quest',
          questStatus: 'active',
          outcomes: [
            { id: 'victory', description: 'Rescue successful', chosen: false, consequences: 'Guard is grateful' },
            { id: 'failure', description: 'Captain dies', chosen: false, consequences: 'Guard distrusts party' },
          ],
          factionImpact: [
            { factionEntityId: factionId, reputationDelta: 20, description: 'Rescued their captain' },
          ],
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    questId = (await response.json())._id;
  });

  test('choosing an outcome applies faction reputation delta', async () => {
    const response = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${questId}/outcomes/victory/choose`,
    );
    expect(response.ok()).toBeTruthy();

    // Verify the quest outcome is marked as chosen
    const quest = await response.json();
    const chosenOutcome = quest.outcomes?.find((o: unknown) => (o as Record<string, unknown>).id === 'victory');
    expect(chosenOutcome?.chosen).toBe(true);

    // Verify the faction reputation changed
    const factionResponse = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${factionId}`,
    );
    expect(factionResponse.ok()).toBeTruthy();
    const faction = await factionResponse.json();
    expect(faction.reputation).toBe(20);
  });

  test('idempotent quest status update does not double-apply side effects', async () => {
    // Complete the quest again (should be idempotent)
    const response = await dmPage.request.patch(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${questId}/quest-status`,
      { data: { status: 'completed' } },
    );
    // Should succeed but not re-apply effects
    expect(response.ok()).toBeTruthy();

    // Faction reputation should still be 20, not 40
    const factionResponse = await dmPage.request.get(
      `${API_BASE}/campaigns/${campaignId}/world/entities/${factionId}`,
    );
    const faction = await factionResponse.json();
    expect(faction.reputation).toBe(20);
  });
});
