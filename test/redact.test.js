import { describe, it, expect } from "vitest";
import { redactRepoNames, extractRepoNames, filterExcludedContributions } from "../lib/redact.js";

describe("redactRepoNames", () => {
  it("replaces repo names in strings", () => {
    expect(redactRepoNames("org/repo#10", ["org/repo"])).toBe("internal repo#10");
  });

  it("replaces repo name in full URL strings", () => {
    expect(redactRepoNames("https://github.com/org/repo/pull/10", ["org/repo"])).toBe(
      "https://github.com/internal repo/pull/10"
    );
  });

  it("replaces repo names in objects recursively", () => {
    const obj = { id: "org/repo#1", repo: "org/repo", url: "https://github.com/org/repo/pull/1" };
    const result = redactRepoNames(obj, ["org/repo"]);
    expect(result).toEqual({
      id: "internal repo#1",
      repo: "internal repo",
      url: "https://github.com/internal repo/pull/1",
    });
  });

  it("replaces repo names in arrays", () => {
    const arr = ["org/repo#1", "org/repo#2"];
    expect(redactRepoNames(arr, ["org/repo"])).toEqual(["internal repo#1", "internal repo#2"]);
  });

  it("handles multiple repo names", () => {
    const obj = { a: "foo/bar#1", b: "baz/qux#2" };
    const result = redactRepoNames(obj, ["foo/bar", "baz/qux"]);
    expect(result).toEqual({ a: "internal repo#1", b: "internal repo#2" });
  });

  it("is a no-op when repoNames is empty", () => {
    const obj = { id: "org/repo#1" };
    expect(redactRepoNames(obj, [])).toEqual({ id: "org/repo#1" });
  });

  it("passes through non-string primitives unchanged", () => {
    expect(redactRepoNames(42, ["org/repo"])).toBe(42);
    expect(redactRepoNames(null, ["org/repo"])).toBe(null);
    expect(redactRepoNames(true, ["org/repo"])).toBe(true);
  });
});

describe("extractRepoNames", () => {
  it("extracts unique repo names from contributions", () => {
    const evidence = {
      contributions: [
        { repo: "org/a", id: "org/a#1" },
        { repo: "org/b", id: "org/b#2" },
        { repo: "org/a", id: "org/a#3" },
      ],
    };
    const repos = extractRepoNames(evidence);
    expect(repos).toHaveLength(2);
    expect(repos).toContain("org/a");
    expect(repos).toContain("org/b");
  });

  it("returns empty array when no contributions", () => {
    expect(extractRepoNames({})).toEqual([]);
    expect(extractRepoNames({ contributions: [] })).toEqual([]);
  });
});

describe("filterExcludedContributions", () => {
  const evidence = {
    timeframe: { start_date: "2025-01-01", end_date: "2025-12-31" },
    contributions: [
      { id: "org/a#1", repo: "org/a" },
      { id: "org/b#2", repo: "org/b" },
      { id: "org/a#3", repo: "org/a" },
    ],
  };

  it("filters contributions by excluded repo", () => {
    const result = filterExcludedContributions(evidence, ["org/a"], []);
    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0].id).toBe("org/b#2");
  });

  it("filters contributions by excluded ID", () => {
    const result = filterExcludedContributions(evidence, [], ["org/a#1"]);
    expect(result.contributions).toHaveLength(2);
    expect(result.contributions.map((c) => c.id)).not.toContain("org/a#1");
  });

  it("preserves other evidence fields", () => {
    const result = filterExcludedContributions(evidence, ["org/a"], []);
    expect(result.timeframe).toEqual(evidence.timeframe);
  });

  it("is a no-op when both lists are empty", () => {
    const result = filterExcludedContributions(evidence, [], []);
    expect(result).toBe(evidence);
  });
});
