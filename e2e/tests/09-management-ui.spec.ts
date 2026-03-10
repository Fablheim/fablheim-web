import { test, expect, BrowserContext, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData, uniqueId } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import {
  createCampaign,
  navigateToCampaign,
} from './helpers/campaign-helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000';

// ==========================================================================
// 1. Campaign Arcs (ArcsPanel via prep sidebar)
// ==========================================================================

test.describe.serial('Campaign Arcs management UI', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  const arcName = `Test Arc ${uniqueId()}`;
  const arcDescription = 'An epic storyline about ancient ruins';

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();

    // Sign up DM and create campaign
    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Enable arcs feature via API
    const res = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { arcs: true } },
    });
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('navigate to Arcs panel via sidebar', async () => {
    await navigateToCampaign(dmPage, campaignId);
    await dmPage.getByRole('button', { name: 'Arcs' }).click();
    await dmPage.waitForTimeout(1_500);

    // Verify the Arcs panel header is visible
    await expect(dmPage.getByText('Story Arcs')).toBeVisible({ timeout: 10_000 });
  });

  test('create an arc with milestones', async () => {
    // Click "New Arc" button
    await dmPage.getByRole('button', { name: /New Arc/i }).click();
    await dmPage.waitForTimeout(500);

    // Fill in arc name
    const nameInput = dmPage.locator('input[placeholder="Arc name..."]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill(arcName);

    // Fill in description
    const descTextarea = dmPage.locator('textarea[placeholder="Describe this story arc..."]');
    await descTextarea.fill(arcDescription);

    // Set status to active
    const statusSelect = dmPage.locator('select').first();
    await statusSelect.selectOption('active');

    // Add initial milestones (one per line)
    const milestonesTextarea = dmPage.locator('textarea[placeholder*="Discover the ancient ruins"]');
    await milestonesTextarea.fill('Discover the ancient ruins\nDefeat the guardian\nClaim the artifact');

    // Submit the form
    await dmPage.getByRole('button', { name: 'Create', exact: true }).click();
    await dmPage.waitForTimeout(1_500);

    // Verify arc appears in the list with active badge
    await expect(dmPage.getByText(arcName)).toBeVisible({ timeout: 10_000 });
    await expect(dmPage.getByText('Active')).toBeVisible({ timeout: 10_000 });
  });

  test('expand arc and verify milestones', async () => {
    // Click on the arc card to expand it
    await dmPage.getByText(arcName).click();
    await dmPage.waitForTimeout(500);

    // Verify milestones are visible
    await expect(dmPage.getByText('Discover the ancient ruins')).toBeVisible({ timeout: 10_000 });
    await expect(dmPage.getByText('Defeat the guardian')).toBeVisible({ timeout: 10_000 });
    await expect(dmPage.getByText('Claim the artifact')).toBeVisible({ timeout: 10_000 });

    // Verify milestone count (0 of 3)
    await expect(dmPage.getByText('0 of 3')).toBeVisible({ timeout: 5_000 });
  });

  test('toggle milestone completion', async () => {
    // Click the circle icon next to the first milestone to toggle it
    // The toggle button is the first circle/check button inside the milestones list
    const milestoneToggle = dmPage.locator('li').filter({ hasText: 'Discover the ancient ruins' }).locator('button').first();
    await milestoneToggle.click();
    await dmPage.waitForTimeout(1_500);

    // Verify milestone count updated (1 of 3)
    await expect(dmPage.getByText('1 of 3')).toBeVisible({ timeout: 10_000 });
  });

  test('add a new milestone to the arc', async () => {
    // Find the add milestone input
    const milestoneInput = dmPage.locator('input[placeholder="Add milestone... (Enter to submit)"]');
    await expect(milestoneInput).toBeVisible({ timeout: 5_000 });
    await milestoneInput.fill('Escape the collapsing temple');
    await milestoneInput.press('Enter');
    await dmPage.waitForTimeout(1_500);

    // Verify the new milestone appears
    await expect(dmPage.getByText('Escape the collapsing temple')).toBeVisible({ timeout: 10_000 });

    // Milestone count should now be 1 of 4
    await expect(dmPage.getByText('1 of 4')).toBeVisible({ timeout: 10_000 });
  });

  test('delete the arc', async () => {
    // Click "Delete Arc" button
    await dmPage.getByRole('button', { name: /Delete Arc/i }).click();
    await dmPage.waitForTimeout(500);

    // Confirm deletion in the dialog
    await dmPage.getByRole('button', { name: 'Delete', exact: true }).click();
    await dmPage.waitForTimeout(1_500);

    // Verify arc is gone - the empty state should show
    await expect(dmPage.getByText('No story arcs yet')).toBeVisible({ timeout: 10_000 });
  });
});

// ==========================================================================
// 2. World State Trackers (TrackersPanel via prep sidebar)
// ==========================================================================

test.describe.serial('World State Trackers management UI', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  const trackerName = `Kingdom Stability ${uniqueId()}`;

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();

    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Enable trackers feature via API
    const res = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { worldStateTrackers: true } },
    });
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('navigate to Trackers panel via sidebar', async () => {
    await navigateToCampaign(dmPage, campaignId);
    await dmPage.getByRole('button', { name: 'Trackers' }).click();
    await dmPage.waitForTimeout(1_500);

    // Verify the Trackers panel header is visible
    await expect(dmPage.getByText('World State')).toBeVisible({ timeout: 10_000 });
  });

  test('create a tracker with thresholds', async () => {
    // Click "New Tracker" button
    await dmPage.getByRole('button', { name: /New Tracker/i }).click();
    await dmPage.waitForTimeout(500);

    // Fill in tracker name
    const nameInput = dmPage.locator('input[placeholder="e.g. Kingdom Stability"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill(trackerName);

    // Fill in description
    const descTextarea = dmPage.locator('textarea[placeholder="What does this tracker measure?"]');
    await descTextarea.fill('How stable is the kingdom?');

    // Set min/max/initial values
    // The numeric fields are in a 3-column grid: Min, Max, Initial
    const numericInputs = dmPage.locator('input[type="number"]');
    // Min field (first number input in form)
    await numericInputs.nth(0).fill('0');
    // Max field
    await numericInputs.nth(1).fill('100');
    // Initial field
    await numericInputs.nth(2).fill('50');

    // Add a threshold
    await dmPage.getByText('Add Threshold').click();
    await dmPage.waitForTimeout(300);

    // Fill threshold value, label, effect
    const thresholdValueInput = dmPage.locator('input[placeholder="Value"]');
    await thresholdValueInput.fill('25');

    const thresholdLabelInput = dmPage.locator('input[placeholder="Label"]');
    await thresholdLabelInput.fill('Civil War');

    const thresholdEffectInput = dmPage.locator('input[placeholder="Effect (optional)"]');
    await thresholdEffectInput.fill('Factions turn hostile');

    // Submit the form
    await dmPage.getByRole('button', { name: 'Create', exact: true }).click();
    await dmPage.waitForTimeout(1_500);

    // Verify the tracker appears with its name
    await expect(dmPage.getByText(trackerName)).toBeVisible({ timeout: 10_000 });
  });

  test('verify tracker displays progress bar and value', async () => {
    // Verify the value is displayed
    await expect(dmPage.getByText('50')).toBeVisible({ timeout: 10_000 });

    // Verify the range display
    await expect(dmPage.getByText(/0\s*[–-]\s*100/)).toBeVisible({ timeout: 10_000 });

    // Verify the progress bar exists (role-based approach - the bar container)
    const progressBar = dmPage.locator('.rounded-full.bg-muted').first();
    await expect(progressBar).toBeVisible({ timeout: 5_000 });
  });

  test('adjust tracker value with +/- controls', async () => {
    // Click the + button (Increase by 1)
    const increaseButton = dmPage.locator('button[title="Increase by 1"]');
    await expect(increaseButton).toBeVisible({ timeout: 10_000 });

    // Click + five times to increase by 5
    for (let i = 0; i < 5; i++) {
      await increaseButton.click();
      await dmPage.waitForTimeout(300);
    }
    await dmPage.waitForTimeout(1_000);

    // Verify value updated to 55
    await expect(dmPage.getByText('55')).toBeVisible({ timeout: 10_000 });

    // Click the - button to decrease
    const decreaseButton = dmPage.locator('button[title="Decrease by 1"]');
    await decreaseButton.click();
    await dmPage.waitForTimeout(1_000);

    // Value should be 54
    await expect(dmPage.getByText('54')).toBeVisible({ timeout: 10_000 });
  });

  test('threshold marker is visible on progress bar', async () => {
    // The threshold creates a vertical line marker on the progress bar
    // It has a title attribute with the threshold info
    const thresholdMarker = dmPage.locator('[title*="Civil War"]');
    await expect(thresholdMarker).toBeVisible({ timeout: 10_000 });
  });

  test('delete the tracker', async () => {
    // Click the edit (pencil) button on the tracker card
    const editButton = dmPage.locator('button[title="Edit tracker"]');
    await editButton.click();
    await dmPage.waitForTimeout(500);

    // Click the "Delete" text button in the edit form
    const deleteButton = dmPage.locator('button').filter({ hasText: 'Delete' }).filter({ has: dmPage.locator('svg') }).first();
    await deleteButton.click();
    await dmPage.waitForTimeout(500);

    // Confirm in the dialog
    await dmPage.getByRole('button', { name: 'Delete', exact: true }).click();
    await dmPage.waitForTimeout(1_500);

    // Verify the tracker is gone - empty state should show
    await expect(dmPage.getByText('No world state trackers yet')).toBeVisible({ timeout: 10_000 });
  });
});

// ==========================================================================
// 3. Domains (inside EntityDetailModal for location entities)
// ==========================================================================

test.describe.serial('Domain management UI via entity detail', () => {
  let dmContext: BrowserContext;
  let dmPage: Page;
  let campaignId: string;
  let locationId: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();
  const locationName = `Thornhaven ${uniqueId()}`;
  const domainName = `Domain of ${locationName}`;

  test.beforeAll(async ({ browser }) => {
    dmContext = await browser.newContext();
    dmPage = await dmContext.newPage();

    await signUp(dmPage, accounts.dm);
    await dmPage.goto('/app/campaigns');
    campaignId = await createCampaign(dmPage, campaign);

    // Enable domains feature via API
    const featureRes = await dmPage.request.patch(`${API_BASE}/campaigns/${campaignId}`, {
      data: { features: { domains: true } },
    });
    expect(featureRes.ok()).toBeTruthy();

    // Create a location entity via API
    const entityRes = await dmPage.request.post(
      `${API_BASE}/campaigns/${campaignId}/world/entities`,
      {
        data: {
          name: locationName,
          type: 'location',
          locationType: 'city',
          description: 'A fortified frontier town',
          visibility: 'public',
        },
      },
    );
    expect(entityRes.ok()).toBeTruthy();
    const body = await entityRes.json();
    locationId = body._id;
    expect(locationId).toBeTruthy();
  });

  test.afterAll(async () => {
    await dmContext?.close();
  });

  test('navigate to World panel and open location detail', async () => {
    await navigateToCampaign(dmPage, campaignId);

    // Click World in sidebar
    await dmPage.getByRole('button', { name: 'World' }).click();
    await dmPage.waitForTimeout(1_500);

    // Find and click on the location entity card
    const entityCard = dmPage.locator('[role="button"][tabindex="0"]').filter({
      has: dmPage.locator('h3', { hasText: locationName }),
    });
    await expect(entityCard).toBeVisible({ timeout: 10_000 });
    await entityCard.click();
    await dmPage.waitForTimeout(1_500);

    // Verify EntityDetailModal opened - the entity name should appear as a heading
    await expect(dmPage.getByText(locationName).first()).toBeVisible({ timeout: 10_000 });
  });

  test('create a domain for the location', async () => {
    // Scroll down to find the DomainPanel create form
    // When no domain exists, the CreateDomainForm is shown
    const createDomainHeading = dmPage.getByText('Create Domain').first();
    await expect(createDomainHeading).toBeVisible({ timeout: 10_000 });

    // Fill in domain name
    const nameInput = dmPage.locator('input[placeholder="e.g. Thornhaven"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill(domainName);

    // Fill in description
    const descTextarea = dmPage.locator('textarea[placeholder="A brief description of the domain..."]');
    await descTextarea.fill('A prosperous frontier domain');

    // Set initial population
    const populationInput = dmPage.locator('input[type="number"][min="0"]');
    await populationInput.fill('75');

    // Submit the create domain form
    const createButton = dmPage.getByRole('button', { name: /Create Domain/i });
    await createButton.click();
    await dmPage.waitForTimeout(1_500);

    // Verify domain overview is now showing (the domain name as heading)
    await expect(dmPage.getByText(domainName)).toBeVisible({ timeout: 10_000 });
  });

  test('verify domain overview shows population and tier info', async () => {
    // Verify population is displayed
    await expect(dmPage.getByText('Population')).toBeVisible({ timeout: 10_000 });
    await expect(dmPage.getByText('75')).toBeVisible({ timeout: 10_000 });

    // Verify tier badge (75 population = Settlement tier based on thresholds: 0=Outpost, 50=Settlement, 200=Village, 500=Town)
    await expect(dmPage.getByText('Settlement')).toBeVisible({ timeout: 10_000 });
  });

  test('adjust population via the population controls', async () => {
    // Find the population adjustment input
    const popDeltaInput = dmPage.locator('input[placeholder="+/- delta"]');
    await expect(popDeltaInput).toBeVisible({ timeout: 10_000 });
    await popDeltaInput.fill('25');

    // Click Apply
    await dmPage.getByRole('button', { name: 'Apply' }).click();
    await dmPage.waitForTimeout(1_500);

    // Population should now be 100
    await expect(dmPage.getByText('100')).toBeVisible({ timeout: 10_000 });
  });

  test('delete the domain', async () => {
    // Click "Delete Domain" button
    const deleteButton = dmPage.getByRole('button', { name: /Delete Domain/i });
    await expect(deleteButton).toBeVisible({ timeout: 10_000 });
    await deleteButton.click();
    await dmPage.waitForTimeout(500);

    // Confirm deletion in the dialog
    await dmPage.getByRole('button', { name: 'Delete', exact: true }).click();
    await dmPage.waitForTimeout(1_500);

    // After deletion, the CreateDomainForm should reappear
    await expect(dmPage.getByText('Create Domain').first()).toBeVisible({ timeout: 10_000 });
  });
});
