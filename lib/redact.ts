/**
 * Redaction utilities: filter excluded repos/PRs from evidence and replace
 * repo names with "internal repo" in generated output objects.
 */

/** Escape special regex characters for literal string matching. */
function escapeRegex(s: string): string {
  return s.replace(/[-.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursively replace all occurrences of each repo name in every string value
 * of `obj` with "internal repo".
 */
export function redactRepoNames<T>(obj: T, repoNames: string[]): T {
  if (!repoNames.length) return obj;
  if (typeof obj === "string") {
    let s = obj as string;
    for (const repo of repoNames) {
      s = s.replace(new RegExp(escapeRegex(repo), "g"), "internal repo");
    }
    return s as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => redactRepoNames(item, repoNames)) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = redactRepoNames(value, repoNames);
    }
    return result as T;
  }
  return obj;
}

/**
 * Extract all unique repo names from evidence contributions.
 */
export function extractRepoNames(evidence: {
  contributions?: Array<{ repo?: string }>;
}): string[] {
  const repos = new Set<string>();
  for (const c of evidence.contributions ?? []) {
    if (c.repo) repos.add(c.repo);
  }
  return Array.from(repos);
}

/**
 * Filter contributions from excluded repos or IDs.
 * `excludedRepos`: ["org/repo", ...] – removes all contributions in those repos.
 * `excludedIds`: ["org/repo#123", ...] – removes specific contribution IDs.
 */
export function filterExcludedContributions<
  T extends { contributions?: Array<{ repo?: string; id?: string }> },
>(evidence: T, excludedRepos: string[], excludedIds: string[]): T {
  if (!excludedRepos.length && !excludedIds.length) return evidence;
  const excludedRepoSet = new Set(excludedRepos);
  const excludedIdSet = new Set(excludedIds);
  return {
    ...evidence,
    contributions: (evidence.contributions ?? []).filter((c) => {
      if (c.repo && excludedRepoSet.has(c.repo)) return false;
      if (c.id && excludedIdSet.has(c.id)) return false;
      return true;
    }),
  };
}
