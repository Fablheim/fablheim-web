import { type Page, expect } from '@playwright/test';

/**
 * Start a live session from the campaign workspace.
 * Clicks the "Start Session" button in the WorkspaceNav.
 * The app navigates to /app/campaigns/:id/session when the stage becomes 'live'.
 */
export async function startSession(page: Page): Promise<void> {
  await page.getByRole('button', { name: /start session/i }).click();

  // Wait for the session shell header to appear (confirms live session loaded)
  await expect(page.locator('header.session-top-bar')).toBeVisible({ timeout: 15_000 });
}

/**
 * Navigate directly to the session runner page.
 */
export async function goToSession(page: Page, campaignId: string): Promise<void> {
  await page.goto(`/app/campaigns/${campaignId}/session`);
  // Wait for the session shell header to appear
  await expect(page.locator('header.session-top-bar')).toBeVisible({ timeout: 15_000 });
}

/**
 * End a live session (DM only).
 * Clicks "End Session" in the session top bar, confirms the dialog,
 * then clicks "Leave Now" to return to the campaign workspace.
 */
export async function endSession(page: Page): Promise<void> {
  // Click End Session in the header — opens confirmation dialog
  await page.getByRole('button', { name: /end session/i }).first().click();

  // Wait for confirmation dialog to appear (has "End Session?" heading)
  const confirmDialog = page.locator('.fixed.inset-0.z-50');
  await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
  await confirmDialog.getByRole('button', { name: /end session/i }).click();

  // After session ends, a "Leave Now" or auto-redirect takes us back
  // Wait for either the "Leave Now" button or redirect to campaign workspace
  const leaveBtn = page.getByRole('button', { name: /leave now/i });
  if (await leaveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await leaveBtn.click();
  }

  // Wait for navigation back to campaign workspace
  await page.waitForURL(/\/app\/campaigns\/[a-f0-9]+(?!\/session)/, { timeout: 15_000 });
}

/**
 * Click "Return to Prep" from recap stage.
 * Waits for the "Start Session" button to confirm we're back in prep.
 */
export async function returnToPrep(page: Page): Promise<void> {
  await page.getByRole('button', { name: /return to prep/i }).click();
  await expect(
    page.getByRole('button', { name: /start session/i }),
  ).toBeVisible({ timeout: 10_000 });
}

// ─── Initiative / Combat ──────────────────────────────────

/**
 * Roll initiative for all entries (DM only).
 */
export async function rollAllInitiative(page: Page): Promise<void> {
  await page.getByRole('button', { name: /roll all/i }).first().click();
  await page.waitForTimeout(1_000);
}

/**
 * Start combat (DM only).
 */
export async function startCombat(page: Page): Promise<void> {
  await page.getByRole('button', { name: /start combat/i }).first().click();
  await page.waitForTimeout(1_000);
}

/**
 * Advance to next turn (DM only).
 */
export async function nextTurn(page: Page): Promise<void> {
  await page.getByRole('button', { name: /next turn/i }).first().click();
  await page.waitForTimeout(500);
}

/**
 * End combat (DM only).
 */
export async function endCombat(page: Page): Promise<void> {
  await page.getByRole('button', { name: /end combat/i }).first().click();
  await page.waitForTimeout(1_000);
}

// ─── Chat ─────────────────────────────────────────────────

/**
 * Send a chat message in the current channel.
 */
export async function sendChatMessage(page: Page, message: string): Promise<void> {
  const input = page.locator('input[placeholder*="message"], input[placeholder*="character"], input[placeholder*="Whisper"]').first();
  await input.fill(message);
  await input.press('Enter');
  await page.waitForTimeout(500);
}

/**
 * Switch the chat mode.
 */
export async function setChatMode(page: Page, mode: 'ic' | 'ooc' | 'whisper'): Promise<void> {
  const labels: Record<string, RegExp> = {
    ic: /in-character/i,
    ooc: /out-of-character/i,
    whisper: /whisper/i,
  };
  await page.getByRole('button', { name: labels[mode] }).click();
  await page.waitForTimeout(300);
}

// ─── DM Sidebar ───────────────────────────────────────────

/**
 * Click a DM sidebar tab by name.
 * The session DMMainContent uses Cinzel uppercase tab buttons.
 */
export async function clickDMTab(
  page: Page,
  tab: 'world' | 'encounters' | 'initiative' | 'notes' | 'party' | 'ai',
): Promise<void> {
  const labels: Record<string, string> = {
    world: 'World',
    encounters: 'Encounters',
    initiative: 'Initiative',
    notes: 'Notes',
    party: 'Party',
    ai: 'AI Tools',
  };
  await page.getByRole('button', { name: labels[tab], exact: false }).first().click();
  await page.waitForTimeout(300);
}

// ─── Encounter Loading ───────────────────────────────────

/**
 * Load an encounter into the active session from the Encounters DM tab.
 * Clicks Load on the encounter card, then confirms the dialog.
 */
export async function loadEncounter(page: Page, encounterName: string): Promise<void> {
  await clickDMTab(page, 'encounters');

  // Find the encounter row and click its Load button
  const encounterRow = page.locator('div').filter({ hasText: encounterName }).first();
  await encounterRow.getByRole('button', { name: /load/i }).click();

  // Confirm the "Load Encounter?" dialog
  const confirmBtn = page.getByRole('button', { name: /^load$/i }).last();
  await confirmBtn.waitFor({ timeout: 5_000 });
  await confirmBtn.click();

  await page.waitForTimeout(2_000);
}

// ─── Notes ───────────────────────────────────────────────

/**
 * Create a quick note in the session Notes tab.
 */
export async function createNoteInSession(
  page: Page,
  title: string,
  content?: string,
): Promise<void> {
  await clickDMTab(page, 'notes');

  const newNoteBtn = page.getByRole('button', { name: /new note/i });
  await newNoteBtn.waitFor({ timeout: 5_000 });
  await newNoteBtn.click();

  const titleInput = page.locator('input[placeholder*="Note title"]');
  await titleInput.waitFor({ timeout: 5_000 });
  await titleInput.fill(title);

  if (content) {
    await page.locator('textarea[placeholder*="Write your notes"]').fill(content);
  }

  // Click Save and wait for the form to close (indicating success)
  const saveBtn = page.getByRole('button', { name: /^save$/i });
  await saveBtn.click();

  // Wait for the note title to appear in the list (form closes on success)
  await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
}

// ─── AI Generation ───────────────────────────────────────

/**
 * Generate an AI NPC using the NPC Generator in the AI Tools tab.
 * Returns the name of the generated NPC.
 */
export async function generateAINPC(
  page: Page,
  description = 'A mysterious traveler',
): Promise<string> {
  await clickDMTab(page, 'ai');

  // Click the NPC sub-tab within AI Tools
  const npcSubTab = page.getByRole('button', { name: 'NPC', exact: true });
  await npcSubTab.waitFor({ timeout: 5_000 });
  await npcSubTab.click();
  await page.waitForTimeout(500);

  // Fill the NPC description
  const descInput = page.locator('textarea').first();
  await descInput.waitFor({ timeout: 5_000 });
  await descInput.fill(description);

  // Click Generate
  await page.getByRole('button', { name: /generate npc/i }).click();

  // Wait for generation to complete — the "Generate Another" button appears in the result view
  // NPC is auto-persisted to the campaign world server-side
  await page.getByRole('button', { name: /generate another/i }).waitFor({ timeout: 90_000 });

  // Extract the generated NPC name from the result heading
  const npcNameEl = page.locator('h4').first();
  const npcName = await npcNameEl.textContent() ?? 'Unknown NPC';

  return npcName.trim();
}

/**
 * Save the most recently generated AI entity to the campaign world.
 * Clicks the "Add to Campaign" button that appears after AI generation.
 */
export async function saveAIEntityToWorld(page: Page): Promise<void> {
  await page.getByRole('button', { name: /add to campaign/i }).click();
  await page.waitForTimeout(1_000);
}

// ─── HP Management ───────────────────────────────────────

/**
 * Update HP for a creature in the initiative tracker.
 * Applies damage or healing to reduce/increase current HP.
 */
export async function updateHP(
  page: Page,
  creatureName: string,
  newHP: number,
): Promise<void> {
  // Click on the creature in initiative to select it
  await page.getByText(creatureName).first().click();
  await page.waitForTimeout(500);

  // Find the damage input and apply the difference
  const damageInput = page.locator('input[placeholder="Dmg"]').first();
  if (await damageInput.isVisible()) {
    // We use damage to reduce HP; get current HP first
    const hpText = await page.locator(`text=/${creatureName}/`).locator('..').getByText(/\d+\s*\/\s*\d+/).first().textContent();
    const currentHP = parseInt(hpText?.split('/')[0].trim() ?? '0', 10);
    const damage = currentHP - newHP;
    if (damage > 0) {
      await damageInput.fill(damage.toString());
      await page.getByRole('button', { name: /^damage$/i }).first().click();
    }
  }

  await page.waitForTimeout(500);
}
