/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Generate from "../src/Generate.jsx";

describe("Generate", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders title and evidence textarea", () => {
    render(<Generate />);
    expect(screen.getByRole("heading", { name: /generate review/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/timeframe.*contributions/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate review/i })).toBeInTheDocument();
  });

  it("Try sample loads sample JSON into textarea", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          timeframe: { start_date: "2025-01-01", end_date: "2025-12-31" },
          contributions: [],
        }),
    });
    render(<Generate />);
    fireEvent.click(screen.getByRole("button", { name: /try sample/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue(/"start_date": "2025-01-01"/)).toBeInTheDocument();
    });
  });

  it("shows error on invalid JSON when clicking Generate", async () => {
    render(<Generate />);
    const textarea = screen.getByPlaceholderText(/timeframe.*contributions/);
    fireEvent.change(textarea, { target: { value: "not json" } });
    fireEvent.click(screen.getByRole("button", { name: /generate review/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
    });
  });

  it("shows error when evidence missing timeframe or contributions", async () => {
    render(<Generate />);
    fireEvent.change(screen.getByPlaceholderText(/timeframe.*contributions/), {
      target: { value: "{}" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate review/i }));
    await waitFor(() => {
      expect(screen.getByText(/timeframe.*contributions/i)).toBeInTheDocument();
    });
  });

  it("Fetch my data: prompts for token when empty", async () => {
    render(<Generate />);
    fireEvent.click(screen.getByRole("button", { name: /fetch my data/i }));
    await waitFor(() => {
      expect(screen.getByText(/paste your github token above/i)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("Fetch my data: on success fills evidence textarea", async () => {
    const evidence = {
      timeframe: { start_date: "2025-01-01", end_date: "2025-12-31" },
      contributions: [{ id: "org/repo#1", type: "pull_request", title: "Fix", url: "https://github.com/org/repo/pull/1", repo: "org/repo" }],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(evidence),
    });
    render(<Generate />);
    const tokenInput = screen.getByPlaceholderText(/paste your github token/i);
    fireEvent.change(tokenInput, { target: { value: "ghp_test" } });
    fireEvent.click(screen.getByRole("button", { name: /fetch my data/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue(/"start_date": "2025-01-01"/)).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/collect",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("ghp_test"),
      })
    );
  });

  it("Fetch my data: on API error shows message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid token" }),
    });
    render(<Generate />);
    fireEvent.change(screen.getByPlaceholderText(/paste your github token/i), { target: { value: "ghp_bad" } });
    fireEvent.click(screen.getByRole("button", { name: /fetch my data/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
    });
  });
});
