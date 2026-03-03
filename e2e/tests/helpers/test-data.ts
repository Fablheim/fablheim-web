/**
 * Test data constants for E2E tests.
 * Uses timestamps to ensure unique data per test run.
 */

const timestamp = Date.now();
let counter = 0;

/** Generate a short unique ID for test data isolation. */
export function uniqueId(): string {
  return `${timestamp.toString(36)}${(counter++).toString(36)}`;
}

export const TEST_ACCOUNTS = {
  dm: {
    username: `e2edm${timestamp}`,
    email: `e2e-dm-${timestamp}@test.com`,
    password: 'TestPass123!',
  },
  player1: {
    username: `e2eplayer1${timestamp}`,
    email: `e2e-player1-${timestamp}@test.com`,
    password: 'TestPass123!',
  },
  player2: {
    username: `e2eplayer2${timestamp}`,
    email: `e2e-player2-${timestamp}@test.com`,
    password: 'TestPass123!',
  },
};

/** Generate a unique set of test accounts (for tests needing separate registrations). */
export function generateAccounts() {
  const id = uniqueId();
  return {
    dm: {
      username: `e2edm${id}`,
      email: `e2e-dm-${id}@test.com`,
      password: 'TestPass123!',
    },
    player1: {
      username: `e2ep1${id}`,
      email: `e2e-p1-${id}@test.com`,
      password: 'TestPass123!',
    },
    player2: {
      username: `e2ep2${id}`,
      email: `e2e-p2-${id}@test.com`,
      password: 'TestPass123!',
    },
  };
}

/** Generate a unique campaign object. */
export function generateCampaignData() {
  const id = uniqueId();
  return {
    name: `E2E Campaign ${id}`,
    description: 'High fantasy adventure in the Forgotten Realms',
    system: 'dnd5e' as const,
  };
}

export const TEST_CAMPAIGN = {
  name: `E2E Campaign ${timestamp}`,
  description: 'High fantasy adventure in the Forgotten Realms',
  system: 'dnd5e' as const,
};

export const TEST_NPC = {
  name: 'Gundren Rockseeker',
  description: 'A dwarf merchant who hires the party',
};

export const TEST_LOCATION = {
  name: 'Phandalin',
  description: 'A small frontier town',
};

export const TEST_ENCOUNTER = {
  name: 'Goblin Ambush',
  difficulty: 'easy' as const,
  description: 'The party is ambushed by goblins on the road to Phandalin',
  tactics: 'Goblins use hit-and-run tactics from range',
  terrain: 'Forest road with dense trees providing cover',
  treasure: '15 sp, 2 healing potions',
};

export const TEST_CHARACTER = {
  name: 'Thalia Brightwood',
  class: 'ranger',
  race: 'elf',
  level: 5,
  stats: { str: 10, dex: 18, con: 14, int: 12, wis: 16, cha: 8 },
  hp: { current: 42, max: 42 },
  ac: 16,
  speed: 35,
};

export const TEST_MID_SESSION_ENCOUNTER = {
  name: 'Unexpected Bandits',
  difficulty: 'medium' as const,
  description: 'Bandits block the road demanding toll',
};
