export const BILLING_CONFIG = {
  freeMonthlyCredits: 0,
  tiers: {
    hobbyist: {
      label: 'Hobbyist',
      price: '$5.99',
      monthlyCredits: 200,
    },
    gamemaster: {
      label: 'Game Master',
      price: '$9.99',
      monthlyCredits: 500,
    },
    pro: {
      label: 'Pro',
      price: '$19.99',
      monthlyCredits: 1200,
    },
  },
  creditPack: {
    price: '$4.99',
    credits: 100,
    bonusCreditsByTier: {
      wanderer: 100,
      hobbyist: 120,
      gamemaster: 140,
      pro: 160,
    },
  },
  aiActionCosts: {
    rule_questions: 1,
    plot_hooks: 2,
    npc_generation: 3,
    character_creation: 3,
    backstory: 3,
    world_building: 3,
    session_summary: 5,
    encounter_building: 5,
  },
  aiActionLabels: {
    rule_questions: 'Rule Question',
    plot_hooks: 'Plot Hooks',
    npc_generation: 'NPC Generation',
    character_creation: 'Character Suggestions',
    backstory: 'Backstory',
    world_building: 'World Building',
    session_summary: 'Session Summary',
    encounter_building: 'Encounter Builder',
  },
} as const;
