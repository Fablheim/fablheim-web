import { type Page, expect } from '@playwright/test';

/**
 * Create a campaign via the modal form.
 * After creation the modal closes and the user stays on the campaigns list.
 * We then click into the new campaign card to navigate to its workspace
 * and extract the campaign ID from the resulting URL.
 */
export async function createCampaign(
  page: Page,
  campaign: { name: string; description?: string; system?: string; setting?: string },
): Promise<string> {
  // Click "New Campaign" button
  await page.getByRole('button', { name: /new campaign/i }).click();

  // Wait for the modal form
  await expect(page.locator('#campaign-name')).toBeVisible({ timeout: 5_000 });

  // Fill required fields
  await page.fill('#campaign-name', campaign.name);

  if (campaign.system) {
    await page.selectOption('#campaign-system', campaign.system);
  }

  if (campaign.description) {
    await page.fill('#campaign-description', campaign.description);
  }

  if (campaign.setting) {
    await page.fill('#campaign-setting', campaign.setting);
  }

  // Submit — button text is "Create Campaign"
  await page.getByRole('button', { name: 'Create Campaign' }).click();

  // Wait for modal to close (campaign list refreshes via query invalidation)
  await expect(page.locator('#campaign-name')).toBeHidden({ timeout: 10_000 });

  // Verify campaign appears in the list
  await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 5_000 });

  // Click on the campaign card to open the workspace
  await page.getByText(campaign.name).click();

  // Wait for the campaign workspace to load — prep sidebar button should be visible
  await expect(
    page.getByRole('button', { name: 'Overview' }),
  ).toBeVisible({ timeout: 10_000 });

  // Extract campaign ID from the URL
  const url = page.url();
  const match = url.match(/\/campaigns\/([a-f0-9]+)/);
  if (!match) throw new Error(`Cannot extract campaign ID from URL: ${url}`);

  return match[1];
}

/**
 * Navigate to a campaign workspace.
 */
export async function navigateToCampaign(page: Page, campaignId: string): Promise<void> {
  await page.goto(`/app/campaigns/${campaignId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Get the invite share-link from the campaign's invite panel.
 * Assumes the page is on the campaign detail/settings page.
 */
export async function getInviteLink(page: Page): Promise<string> {
  // The InvitePanel shows a readonly input with the share link
  const shareInput = page.locator('input[readonly]').first();
  await shareInput.waitFor({ timeout: 5_000 });
  const link = await shareInput.inputValue();
  if (!link) throw new Error('Invite link input is empty');
  return link;
}

/**
 * Join a campaign via invite code URL.
 * The /join/:inviteCode page auto-processes on mount and redirects to the campaign workspace.
 */
export async function joinCampaignByCode(page: Page, inviteCode: string): Promise<void> {
  await page.goto(`/join/${inviteCode}`);
  // Wait for the join page to process and redirect to a campaign workspace
  await page.waitForURL(/\/app\/campaigns\/[a-f0-9]+/, { timeout: 15_000 });
}

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

/**
 * Generate an invite code for a campaign via the API.
 * Uses the page's browser context cookies for authentication.
 * This bypasses the UI (InvitePanel is not yet integrated into the workspace).
 */
export async function generateInviteCode(page: Page, campaignId: string): Promise<string> {
  const response = await page.request.post(`${API_BASE}/campaigns/${campaignId}/invite-code`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const code = body.inviteCode;
  expect(code).toBeTruthy();
  return code;
}
