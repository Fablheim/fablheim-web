/**
 * Test user data generators.
 * Each call returns unique credentials using timestamps to avoid collisions.
 */

export function generateTestUser(role: 'dm' | 'player' = 'dm') {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    username: `test-${role}-${id}`,
    email: `test-${role}-${id}@fablheim-e2e.test`,
    password: 'Test1234!@#$',
  };
}

export function generateCampaign() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    name: `E2E Campaign ${id}`,
    description: 'Auto-generated campaign for E2E testing',
    system: 'dnd5e',
    setting: 'Forgotten Realms',
  };
}

export function generateEnemyTemplate() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    name: `E2E Goblin ${id}`,
    type: 'monster',
    cr: '1/4',
    hp: 7,
    ac: 15,
    system: 'dnd5e',
  };
}

export function generateEncounter() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    name: `E2E Encounter ${id}`,
    difficulty: 'medium',
    notes: 'Auto-generated encounter for E2E testing',
  };
}
