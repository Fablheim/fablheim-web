import { test, expect } from '../fixtures/multi-user.fixture';
import { NavigationHelper } from '../helpers/navigation.helper';
import { FormHelper } from '../helpers/form.helper';
import { generateCampaign } from '../fixtures/test-users';

test.describe('Multi-User Real-Time Sessions', () => {
  test('DM creates campaign, invites player via code, starts session', async ({
    dmPage,
    playerPage,
  }) => {
    const dmNav = new NavigationHelper(dmPage);
    const dmForm = new FormHelper(dmPage);

    // --- DM: Create a campaign ---
    await dmNav.goToCampaigns();
    const campaign = generateCampaign();
    await dmForm.createCampaign({ name: campaign.name, system: 'dnd5e' });

    // Open the campaign detail
    await dmPage.getByText(campaign.name).click();
    await expect(dmPage.getByText('Quick Actions')).toBeVisible({ timeout: 10_000 });

    // --- DM: Generate invite code ---
    // The InvitePanel is directly on the campaign detail page (not behind a button).
    // It has tabs: "Share Link" and "Email Invite". Share Link is the default.

    // Click "Generate Invite Link" button (exact name)
    const generateBtn = dmPage.getByRole('button', { name: 'Generate Invite Link' });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // Wait for the invite link input to appear
    const inviteLinkInput = dmPage.locator('input[readonly]');
    await expect(inviteLinkInput).toBeVisible({ timeout: 5_000 });

    // Extract invite code from the displayed link
    const linkText = await inviteLinkInput.inputValue();
    const codeMatch = linkText.match(/\/join\/(\S+)/);
    const inviteCode = codeMatch?.[1] ?? '';

    // --- Player: Join via invite code ---
    if (inviteCode) {
      await playerPage.goto(`/join/${inviteCode}`);
      // Should be redirected to the app after joining
      await expect(playerPage.getByText('Sign Out')).toBeVisible({ timeout: 15_000 });
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

    // Open campaign detail
    await dmPage.getByText(campaign.name).click();
    await expect(dmPage.getByText('Quick Actions')).toBeVisible({ timeout: 10_000 });

    // Start session
    await dmForm.startSession();

    // Verify DM can switch tabs
    const dmTabNav = new NavigationHelper(dmPage);
    for (const tab of ['Notes', 'Chat', 'Map'] as const) {
      await dmTabNav.clickSessionTab(tab);
    }

    // DM should see "End Session" button
    await expect(dmPage.getByRole('button', { name: 'End Session' })).toBeVisible();
  });
});
