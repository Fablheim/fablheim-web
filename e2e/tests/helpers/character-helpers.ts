import { type Page, expect } from '@playwright/test';

/**
 * Navigate to the character creation wizard for a campaign.
 */
export async function goToCharacterCreation(
  page: Page,
  campaignId: string,
): Promise<void> {
  await page.goto(`/app/campaigns/${campaignId}/characters/create`);
  await page.waitForTimeout(1_000);
}

/**
 * Fill the character creation wizard and submit.
 * The wizard has multiple steps; this helper advances through them.
 */
export async function createCharacter(
  page: Page,
  character: {
    name: string;
    race?: string;
    class?: string;
    level?: number;
    stats?: Record<string, number>;
    hp?: { current: number; max: number };
    ac?: number;
    speed?: number;
  },
): Promise<void> {
  // Step 1: Identity – name is always on the first step
  const nameInput = page.locator('input[placeholder*="name" i], input[id*="name" i]').first();
  await nameInput.waitFor({ timeout: 5_000 });
  await nameInput.fill(character.name);

  // Race and class may be selects or text inputs
  if (character.race) {
    const raceInput = page.locator('select, input').filter({ hasText: /race|ancestry/i }).first();
    if (await raceInput.count()) {
      const tag = await raceInput.evaluate((el) => el.tagName);
      if (tag === 'SELECT') {
        await raceInput.selectOption({ label: new RegExp(character.race, 'i') });
      } else {
        await raceInput.fill(character.race);
      }
    }
  }

  if (character.class) {
    const classInput = page.locator('select, input').filter({ hasText: /class/i }).first();
    if (await classInput.count()) {
      const tag = await classInput.evaluate((el) => el.tagName);
      if (tag === 'SELECT') {
        await classInput.selectOption({ label: new RegExp(character.class, 'i') });
      } else {
        await classInput.fill(character.class);
      }
    }
  }

  if (character.level) {
    const levelInput = page.locator('input[type="number"]').filter({ hasText: /level/i }).first();
    if (await levelInput.count()) {
      await levelInput.fill(character.level.toString());
    }
  }

  // Click Next to advance through steps
  const nextBtn = page.getByRole('button', { name: /next/i });
  while (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  // Final step: Create Character
  const createBtn = page.getByRole('button', { name: /create character/i });
  await createBtn.waitFor({ timeout: 5_000 });
  await createBtn.click();

  await page.waitForTimeout(2_000);
}

/**
 * Verify a character exists on the current page by name.
 */
export async function expectCharacterVisible(
  page: Page,
  characterName: string,
): Promise<void> {
  await expect(page.getByText(characterName).first()).toBeVisible({ timeout: 10_000 });
}

/**
 * Verify character combat stats (HP, AC, Speed) are persisted and visible.
 * The app renders HP as "{current} / {max}", AC and Speed as stat blocks.
 */
export async function verifyCharacterPersisted(
  page: Page,
  characterName: string,
  stats: {
    hp?: { current: number; max: number };
    ac?: number;
    speed?: number;
  },
): Promise<void> {
  // Character name should be visible
  await expect(page.getByText(characterName).first()).toBeVisible({ timeout: 10_000 });

  // HP displays as "{current} / {max}"
  if (stats.hp) {
    await expect(
      page.getByText(`${stats.hp.current} / ${stats.hp.max}`).first(),
    ).toBeVisible({ timeout: 5_000 });
  }

  // AC displays as a StatBlock with label "AC" and the value
  if (stats.ac) {
    await expect(page.getByText(stats.ac.toString()).first()).toBeVisible({ timeout: 5_000 });
  }

  // Speed displays as "{value} ft"
  if (stats.speed) {
    await expect(
      page.getByText(`${stats.speed} ft`).first(),
    ).toBeVisible({ timeout: 5_000 });
  }
}
