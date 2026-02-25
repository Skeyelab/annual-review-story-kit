// Dev server: serves the React app and two API routes.
// POST /api/generate — body: evidence JSON → run pipeline → themes, bullets, stories, self_eval.
// POST /api/collect — body: { token, start_date, end_date } → fetch GitHub + normalize → evidence JSON.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { runPipeline } from "./lib/run-pipeline.js";
import { collectAndNormalize } from "./lib/collect-and-normalize.js";

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function respondJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function apiRoutesPlugin() {
  return {
    name: "api-routes",
    configureServer(server) {
      server.middlewares.use("/api/generate", async (req, res) => {
        if (req.method !== "POST") {
          respondJson(res, 405, { error: "Method not allowed" });
          return;
        }
        try {
          const evidence = await readJsonBody(req);
          const result = await runPipeline(evidence);
          respondJson(res, 200, result);
        } catch (e) {
          respondJson(res, 500, { error: e.message || "Pipeline failed" });
        }
      });

      server.middlewares.use("/api/collect", async (req, res) => {
        if (req.method !== "POST") {
          respondJson(res, 405, { error: "Method not allowed" });
          return;
        }
        try {
          const { token, start_date, end_date } = await readJsonBody(req);
          if (!token || typeof token !== "string") {
            respondJson(res, 400, { error: "token required" });
            return;
          }
          if (!DATE_YYYY_MM_DD.test(start_date) || !DATE_YYYY_MM_DD.test(end_date)) {
            respondJson(res, 400, { error: "start_date and end_date must be YYYY-MM-DD" });
            return;
          }
          const evidence = await collectAndNormalize({ token, start_date, end_date });
          respondJson(res, 200, evidence);
        } catch (e) {
          const status = (e.message || "").includes("401") || (e.message || "").includes("403") ? 401 : 500;
          respondJson(res, status, { error: e.message || "Fetch failed" });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiRoutesPlugin()],
});
