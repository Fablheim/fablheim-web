export function getRulesBasePath(pathname: string): '/app/rules' | '/srd' {
  return pathname.startsWith('/app/rules') ? '/app/rules' : '/srd';
}

export function rulesIndexPath(pathname: string): string {
  return getRulesBasePath(pathname);
}

export function rulesSystemPath(pathname: string, system: string): string {
  return `${getRulesBasePath(pathname)}/${system}`;
}

export function rulesBrowsePath(pathname: string, system: string, category?: string): string {
  if (!category) return `${getRulesBasePath(pathname)}/${system}/browse`;
  return `${getRulesBasePath(pathname)}/${system}/browse/${encodeURIComponent(category)}`;
}

export function rulesEntryPath(pathname: string, system: string, category: string, entry: string): string {
  return `${getRulesBasePath(pathname)}/${system}/${encodeURIComponent(category)}/${encodeURIComponent(entry)}`;
}
