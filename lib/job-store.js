/**
 * In-memory job store for long-running collect/generate. Single-instance only.
 * POST /api/collect or /api/generate starts a job and returns job_id; client polls GET /api/jobs/:id.
 */

const jobs = new Map();

const STATUS = { PENDING: "pending", RUNNING: "running", DONE: "done", FAILED: "failed" };

/**
 * @param {string} type
 * @param {string} [sessionId]
 * @returns {string} job id
 */
export function createJob(type, sessionId) {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const record = {
    type,
    status: STATUS.PENDING,
    created_at: new Date().toISOString(),
    progress: null,
    result: null,
    error: null,
  };
  if (sessionId != null) record.created_by = sessionId;
  jobs.set(id, record);
  return id;
}

/**
 * @typedef {{ type: string, status: string, created_at: string, created_by?: string, progress?: string | null, result?: unknown, error?: string | null }} Job
 * @returns {Job | undefined}
 */
export function getJob(id) {
  return jobs.get(id);
}

/**
 * @param {string} sessionId
 * @returns {(Job & { id: string }) | null}
 */
export function getLatestJob(sessionId) {
  const candidates = [];
  for (const [id, job] of jobs) {
    if (job.created_by !== sessionId) continue;
    candidates.push({ id, ...job });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const c = (b.created_at || "").localeCompare(a.created_at || "");
    return c !== 0 ? c : (b.id || "").localeCompare(a.id || "");
  });
  return candidates[0];
}

/** @param {string} id @param {Partial<Job>} update */
export function updateJob(id, update) {
  const job = jobs.get(id);
  if (job) Object.assign(job, update);
}

/**
 * Run fn in the background; update job to running, then done/result or failed/error.
 * @param {string} id job id
 * @param {(report: (p: { progress?: string }) => void) => Promise<unknown>} fn async work; call report({ progress }) to update
 */
export function runInBackground(id, fn) {
  updateJob(id, { status: STATUS.RUNNING });
  const report = (update) => updateJob(id, update);
  fn(report)
    .then((result) => updateJob(id, { status: STATUS.DONE, result, progress: null }))
    .catch((err) =>
      updateJob(id, {
        status: STATUS.FAILED,
        error: err.message || "Job failed",
        progress: null,
      })
    );
}
