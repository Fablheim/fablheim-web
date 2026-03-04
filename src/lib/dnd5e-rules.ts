import type {
  DamagePreviewInput,
  DamagePreviewResult,
  HealPreviewResult,
  TempHpPreviewResult,
} from '@/types/combat-rules';

export function computeDamagePreview(params: DamagePreviewInput): DamagePreviewResult {
  const inputDamage = Math.max(0, Math.floor(params.amount));
  const resistances = params.resistances ?? [];
  const vulnerabilities = params.vulnerabilities ?? [];
  const immunities = params.immunities ?? [];

  const isImmune = !!params.damageType && immunities.includes(params.damageType);
  if (isImmune) {
    return {
      inputDamage,
      adjustedDamage: 0,
      finalDamage: 0,
      tempHpAbsorbed: 0,
      remainingTempHp: Math.max(0, params.tempHp),
      resultingHp: Math.max(0, Math.min(params.currentHp, params.maxHp)),
      wasResisted: false,
      wasVulnerable: false,
      wasImmune: true,
      concentrationCheckDC: null,
      triggersDeathState: false,
    };
  }

  let adjustedDamage = inputDamage;
  let wasResisted = false;
  let wasVulnerable = false;

  if (params.damageType && vulnerabilities.includes(params.damageType)) {
    adjustedDamage = inputDamage * 2;
    wasVulnerable = true;
  } else if (params.damageType && resistances.includes(params.damageType)) {
    adjustedDamage = Math.floor(inputDamage / 2);
    wasResisted = true;
  }

  const tempHpAbsorbed = Math.min(Math.max(0, params.tempHp), adjustedDamage);
  const finalDamage = Math.max(0, adjustedDamage - tempHpAbsorbed);
  const remainingTempHp = Math.max(0, params.tempHp - tempHpAbsorbed);
  const resultingHp = Math.max(0, params.currentHp - finalDamage);
  const concentrationCheckDC =
    params.isConcentrating && adjustedDamage > 0
      ? Math.max(10, Math.floor(adjustedDamage / 2))
      : null;
  const triggersDeathState = params.currentHp > 0 && resultingHp === 0;

  return {
    inputDamage,
    adjustedDamage,
    finalDamage,
    tempHpAbsorbed,
    remainingTempHp,
    resultingHp,
    wasResisted,
    wasVulnerable,
    wasImmune: false,
    concentrationCheckDC,
    triggersDeathState,
  };
}

export function computeHealPreview(params: {
  amount: number;
  currentHp: number;
  maxHp: number;
}): HealPreviewResult {
  const healAmount = Math.max(0, Math.floor(params.amount));
  const safeCurrent = Math.max(0, params.currentHp);
  const safeMax = Math.max(0, params.maxHp);
  const resultingHp = Math.min(safeMax, safeCurrent + healAmount);
  return {
    healAmount,
    resultingHp,
    overheal: Math.max(0, safeCurrent + healAmount - safeMax),
  };
}

export function computeTempHpPreview(params: {
  amount: number;
  existingTempHp: number;
}): TempHpPreviewResult {
  const inputTempHp = Math.max(0, Math.floor(params.amount));
  const existingTempHp = Math.max(0, Math.floor(params.existingTempHp));
  const newTempHp = Math.max(existingTempHp, inputTempHp);
  return {
    inputTempHp,
    existingTempHp,
    newTempHp,
    replaced: inputTempHp > existingTempHp,
  };
}
