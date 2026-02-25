import { describe, it, expect, beforeEach } from "vitest";
import { createJob, getJob, getLatestJob, updateJob, runInBackground } from "../lib/job-store.js";

describe("job-store", () => {
  beforeEach(() => {
    // In-memory store; tests use unique sessionIds to avoid collisions
  });

  it("createJob(type, sessionId) stores created_by", () => {
    const id = createJob("collect", "sess_abc");
    const job = getJob(id);
    expect(job).toBeDefined();
    expect(job.type).toBe("collect");
    expect(job.created_by).toBe("sess_abc");
    expect(job.status).toBe("pending");
  });

  it("createJob(type) without sessionId works for backward compat", () => {
    const id = createJob("generate");
    const job = getJob(id);
    expect(job).toBeDefined();
    expect(job.type).toBe("generate");
    expect(job.created_by).toBeUndefined();
  });

  it("getLatestJob(sessionId) returns most recent job for that session", async () => {
    const sid = "sess_" + Date.now();
    const id1 = createJob("collect", sid);
    await new Promise((r) => setTimeout(r, 2));
    const id2 = createJob("generate", sid);
    const latest = getLatestJob(sid);
    expect(latest).toBeDefined();
    expect(latest?.id).toBe(id2);
    expect(latest?.type).toBe("generate");
  });

  it("getLatestJob(sessionId) returns null when no jobs for session", () => {
    expect(getLatestJob("sess_nonexistent")).toBeNull();
  });

  it("getLatestJob ignores jobs from other sessions", () => {
    createJob("collect", "sess_other");
    const id = createJob("collect", "sess_mine");
    expect(getLatestJob("sess_mine")?.id).toBe(id);
  });

  it("getJob(id) still works", () => {
    const id = createJob("collect", "sess_x");
    const job = getJob(id);
    expect(job?.type).toBe("collect");
    expect(job?.created_by).toBe("sess_x");
  });

  it("runInBackground updates job to done with result", async () => {
    const id = createJob("collect", "sess_y");
    runInBackground(id, () => Promise.resolve({ contributions: [] }));
    await new Promise((r) => setTimeout(r, 50));
    const job = getJob(id);
    expect(job?.status).toBe("done");
    expect(job?.result).toEqual({ contributions: [] });
  });
});
