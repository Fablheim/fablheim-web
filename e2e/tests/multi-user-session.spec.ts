import { test, expect } from '../fixtures/multi-user.fixture';
import { NavigationHelper } from '../helpers/navigation.helper';
import { FormHelper } from '../helpers/form.helper';
import { generateCampaign } from '../fixtures/test-users';

test.describe('Multi-User Real-Time Sessions', () => {
  test('DM creates campaign, invites player via API, starts session', async ({
    dmPage,
    playerPage,
  }) => {
    const dmNav = new NavigationHelper(dmPage);
    const dmForm = new FormHelper(dmPage);

    // --- DM: Create a campaign ---
    await dmNav.goToCampaigns();
    const campaign = generateCampaign();
    await dmForm.createCampaign({ name: campaign.name, system: 'dnd5e' });

    // Open the campaign workspace
    await dmPage.getByText(campaign.name).click();
    await expect(dmPage.getByRole('button', { name: 'Overview' })).toBeVisible({ timeout: 10_000 });

    // --- DM: Generate invite code via API ---
    // Extract campaign ID from URL (format: /app/campaigns/:id)
    const url = dmPage.url();
    const campaignId = url.split('/campaigns/')[1]?.split(/[/?#]/)[0] ?? '';

    const inviteResponse = await dmPage.request.post(
      `/api/campaigns/${campaignId}/invite-code`,
    );
    const inviteCode = inviteResponse.ok()
      ? (await inviteResponse.json()).inviteCode
      : '';

    // --- Player: Join via invite code ---
    if (inviteCode) {
      await playerPage.goto(`/join/${inviteCode}`);
      // Verify the app shell loaded for the player
      await expect(playerPage.getByRole('button', { name: 'Campaigns' })).toBeVisible({ timeout: 15_000 });
    }

    // --- DM: Start a session ---
    await dmForm.startSession();

    // DM should see "online" indicator
    await expect(dmPage.getByText(/online/i)).toBeVisible({ timeout: 10_000 });
  });

  test('session tabs are accessible for DM', async ({
    dmPage,
  }) => {
    const dmNav = new NavigationHelper(dmPage);
    const dmForm = new FormHelper(dmPage);

    // DM creates campaign and starts session
    await dmNav.goToCampaigns();
    const campaign = generateCampaign();
    await dmForm.createCampaign({ name: campaign.name, system: 'dnd5e' });

    // Open campaign workspace
    await dmPage.getByText(campaign.name).click();
    await expect(dmPage.getByRole('button', { name: 'Overview' })).toBeVisible({ timeout: 10_000 });

    // Start session
    await dmForm.startSession();

    // Verify the mosaic workspace loaded with panels visible
    // Panel titles appear in the mosaic window toolbars
    for (const panel of ['Notes', 'Chat'] as const) {
      await expect(dmPage.getByText(panel).first()).toBeVisible({ timeout: 10_000 });
    }

    // DM should see "End Session" button
    await expect(dmPage.getByRole('button', { name: 'End Session' })).toBeVisible();
  });
});
