// Page: 1) Get GitHub data (token or CLI), 2) Paste/upload evidence JSON, 3) Generate → themes, bullets, stories, self-eval.
import React, { useState } from "react";
import "./Generate.css";

const GITHUB_TOKEN_URL = "https://github.com/settings/tokens/new?scopes=repo&description=AnnualReview.dev";
const REPO_URL = "https://github.com/Skeyelab/annualreview.com";

function getDefaultDateRange() {
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  return { start: from.toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) };
}

export default function Generate() {
  // Evidence textarea and generate-result state
  const [evidenceText, setEvidenceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  // "Fetch from GitHub" form: token + date range (default last 12 months)
  const [collectToken, setCollectToken] = useState("");
  const [collectStart, setCollectStart] = useState(() => getDefaultDateRange().start);
  const [collectEnd, setCollectEnd] = useState(() => getDefaultDateRange().end);
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectError, setCollectError] = useState(null);

  const handleGenerate = async () => {
    let evidence;
    try {
      evidence = JSON.parse(evidenceText);
    } catch {
      const looksTruncated =
        /[\{\[,]\s*$/.test(evidenceText.trim()) || !evidenceText.includes('"contributions"');
      setError(
        looksTruncated
          ? "Invalid JSON—looks truncated (e.g. missing contributions or closing brackets). Try “Upload evidence.json” instead of pasting, or paste the full file again."
          : "Invalid JSON. Paste or upload a valid evidence.json."
      );
      return;
    }
    if (!evidence.timeframe?.start_date || !evidence.timeframe?.end_date || !Array.isArray(evidence.contributions)) {
      setError("Evidence must have timeframe.start_date, timeframe.end_date, and contributions array.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evidence),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generate failed");
      setResult(data);
    } catch (e) {
      setError(e.message || "Pipeline failed. Is OPENAI_API_KEY set?");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { setEvidenceText(r.result); setError(null); };
    r.readAsText(file);
  };

  const loadSample = async () => {
    try {
      const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
      const res = await fetch(`${base}sample-evidence.json`);
      if (!res.ok) throw new Error(`Sample not found (${res.status})`);
      const data = await res.json();
      setEvidenceText(JSON.stringify(data, null, 2));
      setError(null);
    } catch (e) {
      setError(e.message || "Could not load sample.");
    }
  };

  const handleFetchGitHub = async () => {
    if (!collectToken.trim()) {
      setCollectError("Paste your GitHub token above.");
      return;
    }
    setCollectError(null);
    setCollectLoading(true);
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: collectToken.trim(),
          start_date: collectStart,
          end_date: collectEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      setEvidenceText(JSON.stringify(data, null, 2));
      setError(null);
    } catch (e) {
      setCollectError(e.message || "Could not fetch from GitHub.");
    } finally {
      setCollectLoading(false);
    }
  };

  return (
    <div className="generate">
      <header className="generate-header">
        <a href="/" className="generate-logo">
          <span className="generate-logo-icon">⟡</span>
          AnnualReview.dev
        </a>
        <a href="/" className="generate-back">← Back</a>
      </header>

      <main className="generate-main">
        <h1 className="generate-title">Generate review</h1>

        <section className="generate-get-data" aria-labelledby="get-data-heading">
          <h2 id="get-data-heading" className="generate-get-data-title">1. Get your GitHub data</h2>

          <div className="generate-get-data-options">
            <div className="generate-option-card">
              <h3 className="generate-option-heading">Connect GitHub (easiest)</h3>
              <p className="generate-option-desc">
                Use a Personal Access Token. We fetch your PRs and reviews for the date range and never store your token.
              </p>
              <a href={GITHUB_TOKEN_URL} target="_blank" rel="noopener noreferrer" className="generate-token-link">
                Create a token (repo scope) →
              </a>
              <div className="generate-collect-form">
                <input
                  type="password"
                  placeholder="Paste your GitHub token (ghp_... or gho_...)"
                  value={collectToken}
                  onChange={(e) => { setCollectToken(e.target.value); setCollectError(null); }}
                  className="generate-collect-input"
                  autoComplete="off"
                />
                <div className="generate-collect-dates">
                  <label className="generate-collect-label">
                    From <input type="date" value={collectStart} onChange={(e) => setCollectStart(e.target.value)} className="generate-collect-date" />
                  </label>
                  <label className="generate-collect-label">
                    To <input type="date" value={collectEnd} onChange={(e) => setCollectEnd(e.target.value)} className="generate-collect-date" />
                  </label>
                </div>
                {collectError && <p className="generate-error">{collectError}</p>}
                <button type="button" className="generate-collect-btn" onClick={handleFetchGitHub} disabled={collectLoading}>
                  {collectLoading ? "Fetching…" : "Fetch my data"}
                </button>
              </div>
            </div>

            <div className="generate-option-card">
              <h3 className="generate-option-heading">Use the terminal</h3>
              <p className="generate-option-desc">
                Run two commands. Your token stays on your machine.
              </p>
              <ol className="generate-steps-list">
                <li>Create a token at <a href={GITHUB_TOKEN_URL} target="_blank" rel="noopener noreferrer">github.com/settings/tokens</a> with <strong>repo</strong> scope.</li>
                <li>From this repo (<a href={REPO_URL} target="_blank" rel="noopener noreferrer">clone it</a>), run:
                  <pre className="generate-cmd">
{`GITHUB_TOKEN=ghp_your_token yarn collect --start ${collectStart} --end ${collectEnd} --output raw.json
yarn normalize --input raw.json --output evidence.json`}
                  </pre>
                </li>
                <li>Upload <code>evidence.json</code> below or paste its contents.</li>
              </ol>
            </div>
          </div>
        </section>

        <h2 className="generate-step-title">2. Paste or upload evidence</h2>
        <p className="generate-lead">
          Evidence JSON must include <code>timeframe</code> and <code>contributions</code>. After fetching above or from the CLI, paste or upload it here.
        </p>

        <div className="generate-input-row">
          <label className="generate-file-label">
            Upload evidence.json
            <input type="file" accept=".json,application/json" onChange={handleFile} className="generate-file-input" />
          </label>
          <button type="button" className="generate-sample-btn" onClick={loadSample}>Try sample</button>
        </div>
        <textarea
          className="generate-textarea"
          placeholder='{"timeframe": {"start_date": "2025-01-01", "end_date": "2025-12-31"}, "contributions": [...]}'
          value={evidenceText}
          onChange={(e) => { setEvidenceText(e.target.value); setError(null); }}
          rows={8}
          spellCheck={false}
        />
        <p className="generate-hint">On mobile, pasting long JSON can be cut off—use “Upload evidence.json” for large data.</p>

        {error && <p className="generate-error">{error}</p>}

        <button type="button" className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : "3. Generate review"}
        </button>

        {result && (
          <div className="generate-result">
            <h2>Your review</h2>
            <ResultSection title="Themes" data={result.themes} />
            <ResultSection title="Bullets" data={result.bullets} />
            <ResultSection title="STAR stories" data={result.stories} />
            <ResultSection title="Self-eval sections" data={result.self_eval} />
          </div>
        )}
      </main>
    </div>
  );
}

/** One pipeline output section: title, copy button, pretty-printed JSON. */
function ResultSection({ title, data }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <section className="generate-section">
      <div className="generate-section-head">
        <h3>{title}</h3>
        <button type="button" className="generate-copy" onClick={() => navigator.clipboard.writeText(text)}>Copy</button>
      </div>
      <pre className="generate-pre">{text}</pre>
    </section>
  );
}
