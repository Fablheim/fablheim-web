import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { generateTestUser } from './test-users';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Multi-user fixture: provides separate browser contexts for DM and Player,
 * each with their own auth state.
 */

type MultiUserFixtures = {
  dmContext: BrowserContext;
  dmPage: Page;
  playerContext: BrowserContext;
  playerPage: Page;
  dmUser: { username: string; email: string; password: string };
  playerUser: { username: string; email: string; password: string };
};

export const test = base.extend<MultiUserFixtures>({
  dmUser: async ({}, use) => {
    await use(generateTestUser('dm'));
  },

  playerUser: async ({}, use) => {
    await use(generateTestUser('player'));
  },

  dmContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  playerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  dmPage: async ({ dmContext, dmUser }, use) => {
    const page = await dmContext.newPage();
    const auth = new AuthHelper(page);
    await auth.register(dmUser.username, dmUser.email, dmUser.password);
    await use(page);
  },

  playerPage: async ({ playerContext, playerUser }, use) => {
    const page = await playerContext.newPage();
    const auth = new AuthHelper(page);
    await auth.register(playerUser.username, playerUser.email, playerUser.password);
    await use(page);
  },
});

export { expect } from '@playwright/test';
