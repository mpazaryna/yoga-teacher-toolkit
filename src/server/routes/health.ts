import { Hono } from "../../deps.ts";

const app = new Hono();

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

export function createHealthResponse(): HealthResponse {
  return {
    status: "healthy",
    version: globalThis.Deno?.env.get("APP_VERSION") || "0.1.0",
    timestamp: new Date().toISOString()
  };
}

app.get("/", (c) => {
  return c.json(createHealthResponse());
});

export { app as healthRoutes }; 