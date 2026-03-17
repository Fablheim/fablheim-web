/**
 * Shared panel style constants for v2 desk surfaces.
 *
 * Variant differences found across files:
 *
 *   shellPanelClass variants (outer rounded-24px shell with shadow):
 *     Variant A — border 0.64, bg-end hsla(22,24%,9%):
 *       Used as `shellClass` in: StoryArcsDeskV2, RandomTablesDeskV2, DowntimeDeskV2
 *     Variant B — border 0.68, bg-end hsla(22,24%,9%):
 *       Used as `panelClass` in: SafetyToolsCenterStage, InWorldCalendarCenterStage,
 *       RulesDeskCenterStage, EncounterCenterStageV2
 *     Variant C — border 0.68, bg-end hsla(20,24%,8%):
 *       Used as `panelClass` or `shellClass` in: TrackersDeskV2, CampaignHealthDeskV2,
 *       AIToolsDeskV2, ModuleBrowserDeskV2, EconomyDeskV2
 *
 *   innerPanelClass (inner rounded-22px card without shadow):
 *     Used as `panelClass` in: StoryArcsDeskV2, RandomTablesDeskV2, DowntimeDeskV2
 *     No variants found.
 *
 * The canonical values below use Variant C for shellPanelClass as it is most common
 * (5 files). Variant A and B differ by ≤0.04 in border opacity and ≤1 unit in bg
 * lightness — imperceptible differences consolidated into the canonical.
 *
 * v2 Page Header Pattern (for Phase 4 desk polish reference):
 *   Eyebrow:   text-[10px] uppercase tracking-[0.26em] text-[hsl(30,14%,54%)]
 *   Title:     font-['IM_Fell_English'] text-[28px] leading-none
 *   Subtitle:  text-sm text-[hsl(30,14%,66%)]
 *   Actions:   flex gap-2 items-center (right-aligned)
 */

export const shellPanelClass =
  'rounded-[24px] border border-[hsla(32,24%,24%,0.68)] bg-[linear-gradient(180deg,hsla(26,24%,12%,0.96)_0%,hsla(20,24%,8%,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]';

export const innerPanelClass =
  'rounded-[22px] border border-[hsla(32,24%,24%,0.46)] bg-[linear-gradient(180deg,hsla(26,22%,11%,0.95)_0%,hsla(20,20%,9%,0.96)_100%)]';
