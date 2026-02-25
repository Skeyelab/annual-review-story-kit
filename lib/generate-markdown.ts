/**
 * Pure function: {themes, bullets, stories, self_eval} → markdown string.
 * No LLM calls; pure templating.
 */

import type { Timeframe } from "../types/evidence.js";

interface EvidenceRef {
  id?: string;
  title?: string;
  url?: string;
}

interface ThemeEntry {
  theme_id?: string;
  theme_name?: string;
  one_liner?: string;
  why_it_matters?: string;
  confidence?: string;
  notes_or_assumptions?: string;
  anchor_evidence?: EvidenceRef[];
}

interface Bullet {
  text?: string;
  evidence?: EvidenceRef[];
  theme_id?: string;
}

interface BulletsByTheme {
  theme_id?: string;
  bullets?: Bullet[];
}

interface Story {
  title?: string;
  situation?: string;
  task?: string;
  actions?: string[];
  results?: string[];
  evidence?: EvidenceRef[];
  confidence?: string;
  theme_id?: string;
}

interface SelfEvalSection {
  text?: string;
  evidence?: EvidenceRef[];
}

interface SelfEvalSections {
  summary?: SelfEvalSection;
  key_accomplishments?: (Bullet & { evidence?: EvidenceRef[] })[];
  how_i_worked?: SelfEvalSection;
  growth?: SelfEvalSection;
  next_year_goals?: Bullet[];
}

interface ThemesOutput {
  themes?: ThemeEntry[];
}

interface BulletsOutput {
  top_10_bullets_overall?: Bullet[];
  bullets_by_theme?: BulletsByTheme[];
}

interface StoriesOutput {
  stories?: Story[];
}

interface SelfEvalOutput {
  sections?: SelfEvalSections;
}

interface GenerateMarkdownInput {
  themes?: ThemesOutput;
  bullets?: BulletsOutput;
  stories?: StoriesOutput;
  self_eval?: SelfEvalOutput;
}

interface GenerateMarkdownOptions {
  timeframe?: Timeframe;
}

function evidenceLinks(evidence: EvidenceRef[] = []): string {
  if (!evidence.length) return "";
  return evidence.map((e) => `[${e.id || e.title || "ref"}](${e.url})`).join(", ");
}

export function generateMarkdown(
  { themes, bullets, stories, self_eval }: GenerateMarkdownInput,
  { timeframe }: GenerateMarkdownOptions = {}
): string {
  const lines = [];

  // ── Header ──────────────────────────────────────────────────────────────────
  lines.push("# Annual Review Report");
  if (timeframe?.start_date && timeframe?.end_date) {
    lines.push(`*${timeframe.start_date} – ${timeframe.end_date}*`);
  }
  lines.push("");

  // ── Summary ─────────────────────────────────────────────────────────────────
  const summary = self_eval?.sections?.summary;
  if (summary?.text) {
    lines.push("---", "", "## Summary", "", summary.text);
    if (summary.evidence?.length) lines.push("", `*Sources: ${evidenceLinks(summary.evidence)}*`);
    lines.push("");
  }

  // ── Themes ──────────────────────────────────────────────────────────────────
  const themeList = themes?.themes ?? [];
  if (themeList.length) {
    lines.push("---", "", "## Themes", "");
    themeList.forEach((t, i) => {
      lines.push(`### ${i + 1}. ${t.theme_name}`);
      if (t.one_liner) lines.push("", `> ${t.one_liner}`);
      if (t.why_it_matters) lines.push("", `**Why it matters:** ${t.why_it_matters}`);
      if (t.confidence) lines.push("", `*Confidence: ${t.confidence}*`);
      if (t.notes_or_assumptions) lines.push("", `*Notes: ${t.notes_or_assumptions}*`);
      if (t.anchor_evidence?.length) {
        lines.push("", `*Evidence: ${t.anchor_evidence.map((e) => `[${e.title || e.id}](${e.url})`).join(", ")}*`);
      }
      lines.push("");
    });
  }

  // ── Impact Bullets ──────────────────────────────────────────────────────────
  const top10 = bullets?.top_10_bullets_overall ?? [];
  const byTheme = bullets?.bullets_by_theme ?? [];
  if (top10.length || byTheme.length) {
    lines.push("---", "", "## Impact Bullets", "");
    if (top10.length) {
      lines.push("### Top 10 Bullets", "");
      top10.forEach((b) => {
        const refs = b.evidence?.length ? ` (${evidenceLinks(b.evidence)})` : "";
        lines.push(`- ${b.text}${refs}`);
      });
      lines.push("");
    }
    if (byTheme.length) {
      const themeNameMap = Object.fromEntries(themeList.map((t) => [t.theme_id, t.theme_name]));
      byTheme.forEach((bt) => {
        const name = themeNameMap[bt.theme_id ?? ""] || bt.theme_id;
        lines.push(`### ${name}`, "");
        (bt.bullets ?? []).forEach((b) => {
          const refs = b.evidence?.length ? ` (${evidenceLinks(b.evidence)})` : "";
          lines.push(`- ${b.text}${refs}`);
        });
        lines.push("");
      });
    }
  }

  // ── STAR Stories ────────────────────────────────────────────────────────────
  const storyList = stories?.stories ?? [];
  if (storyList.length) {
    lines.push("---", "", "## STAR Stories", "");
    storyList.forEach((s) => {
      lines.push(`### ${s.title}`);
      if (s.situation) lines.push("", `**Situation:** ${s.situation}`);
      if (s.task) lines.push("", `**Task:** ${s.task}`);
      if (s.actions?.length) {
        lines.push("", "**Actions:**");
        s.actions.forEach((a) => lines.push(`- ${a}`));
      }
      if (s.results?.length) {
        lines.push("", "**Results:**");
        s.results.forEach((r) => lines.push(`- ${r}`));
      }
      if (s.evidence?.length) {
        lines.push("", `*Evidence: ${s.evidence.map((e) => `[${e.title || e.id}](${e.url})`).join(", ")}*`);
      }
      if (s.confidence) lines.push("", `*Confidence: ${s.confidence}*`);
      lines.push("");
    });
  }

  // ── Self-Evaluation ─────────────────────────────────────────────────────────
  const sections = self_eval?.sections ?? {};
  const hasAnySection = sections.summary || sections.key_accomplishments?.length ||
    sections.how_i_worked || sections.growth || sections.next_year_goals?.length;

  if (hasAnySection) {
    lines.push("---", "", "## Self-Evaluation", "");

    if (sections.key_accomplishments?.length) {
      lines.push("### Key Accomplishments", "");
      sections.key_accomplishments.forEach((item) => {
        const refs = item.evidence?.length ? ` (${evidenceLinks(item.evidence)})` : "";
        lines.push(`- ${item.text}${refs}`);
      });
      lines.push("");
    }

    if (sections.how_i_worked?.text) {
      lines.push("### How I Worked", "", sections.how_i_worked.text);
      if (sections.how_i_worked.evidence?.length) {
        lines.push("", `*Sources: ${evidenceLinks(sections.how_i_worked.evidence)}*`);
      }
      lines.push("");
    }

    if (sections.growth?.text) {
      lines.push("### Growth", "", sections.growth.text);
      if (sections.growth.evidence?.length) {
        lines.push("", `*Sources: ${evidenceLinks(sections.growth.evidence)}*`);
      }
      lines.push("");
    }

    if (sections.next_year_goals?.length) {
      lines.push("### Next Year Goals", "");
      sections.next_year_goals.forEach((g) => {
        const refs = g.evidence?.length ? ` (${evidenceLinks(g.evidence)})` : "";
        lines.push(`- ${g.text}${refs}`);
      });
      lines.push("");
    }
  }

  // ── Evidence Appendix (grouped by theme) ────────────────────────────────────
  // Group evidence by theme_id; unthemed evidence falls into a "General" group.
  type ThemeGroup = { name: string; refs: EvidenceRef[] };
  const themeGroups: { id: string; group: ThemeGroup }[] = [];
  const themeGroupMap = new Map<string, ThemeGroup>();

  themeList.forEach((t) => {
    if (t.theme_id) {
      const group: ThemeGroup = { name: t.theme_name || t.theme_id, refs: [] };
      themeGroups.push({ id: t.theme_id, group });
      themeGroupMap.set(t.theme_id, group);
    }
  });

  // Initialize the General group upfront for unthemed evidence
  const generalGroup: ThemeGroup = { name: "General", refs: [] };
  themeGroups.push({ id: "__general__", group: generalGroup });
  themeGroupMap.set("__general__", generalGroup);

  const globalSeen = new Set<string>();

  function addToGroup(themeId: string | undefined, ev: EvidenceRef[] | undefined = []) {
    const targetId = themeId && themeGroupMap.has(themeId) ? themeId : "__general__";
    const group = themeGroupMap.get(targetId)!;
    for (const e of ev) {
      const key = e.url || e.id;
      if (key && !globalSeen.has(key)) {
        globalSeen.add(key);
        group.refs.push(e);
      }
    }
  }

  themeList.forEach((t) => addToGroup(t.theme_id, t.anchor_evidence));
  byTheme.forEach((bt) => (bt.bullets ?? []).forEach((b) => addToGroup(bt.theme_id, b.evidence)));
  storyList.forEach((s) => addToGroup(s.theme_id, s.evidence));
  top10.forEach((b) => addToGroup(b.theme_id, b.evidence));
  if (summary?.evidence) addToGroup(undefined, summary.evidence);
  if (sections.key_accomplishments) sections.key_accomplishments.forEach((i) => addToGroup(undefined, i.evidence));
  if (sections.how_i_worked) addToGroup(undefined, sections.how_i_worked.evidence);
  if (sections.growth) addToGroup(undefined, sections.growth.evidence);
  if (sections.next_year_goals) sections.next_year_goals.forEach((i) => addToGroup(undefined, i.evidence));

  const hasAnyEvidence = themeGroups.some(({ group }) => group.refs.length > 0);
  if (hasAnyEvidence) {
    lines.push("---", "", "## Evidence Appendix", "");
    for (const { group } of themeGroups) {
      if (!group.refs.length) continue;
      lines.push(`### ${group.name}`, "");
      lines.push("| ID | Title | URL |");
      lines.push("|----|-------|-----|");
      group.refs.forEach((e) => {
        const id = e.id || "";
        const title = (e.title || "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
        const url = e.url || "";
        lines.push(`| ${id} | ${title} | ${url} |`);
      });
      lines.push("");
    }
  }

  return lines.join("\n");
}
