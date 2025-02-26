import { assertEquals } from "../../dev_deps.ts";
import { createApp } from "@/server/server.ts";
import { describe, it } from "../../dev_deps.ts";

describe("Health Check Integration Tests", () => {
  const app = createApp();

  it("should return 200 and correct response structure", async () => {
    const res = await app.request("/health");
    assertEquals(res.status, 200);
    
    const data = await res.json();
    assertEquals(typeof data.status, "string");
    assertEquals(data.status, "healthy");
    assertEquals(typeof data.version, "string");
    assertEquals(typeof data.timestamp, "string");
  });

  it("should include X-Response-Time header", async () => {
    const res = await app.request("/health");
    const responseTime = res.headers.get("X-Response-Time");
    assertEquals(typeof responseTime, "string");
    assertEquals(responseTime?.endsWith("ms"), true);
  });
}); 