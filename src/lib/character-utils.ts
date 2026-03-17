export function formatCharacterClass(character: {
  classes?: Array<{ className: string; level: number; subclassName?: string | null }>;
}): string {
  if (character.classes?.length) {
    return character.classes
      .map((c) => c.subclassName ? `${c.className} (${c.subclassName}) ${c.level}` : `${c.className} ${c.level}`)
      .join(' / ');
  }
  return '';
}

export function totalCharacterLevel(character: {
  level: number;
  classes?: Array<{ level: number }>;
}): number {
  if (character.classes?.length) {
    return character.classes.reduce((sum, c) => sum + c.level, 0);
  }
  return character.level;
}
