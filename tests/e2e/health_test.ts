import { assertEquals, assertMatch } from "../../dev_deps.ts";
import { describe, it } from "../../dev_deps.ts";

describe("Health Check E2E Tests", () => {
  const TEST_PORT = 8000; // Use the same port as the running server
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  it("should be accessible and return correct response", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assertEquals(res.status, 200);
    
    const data = await res.json(); // This consumes the stream
    assertEquals(data.status, "healthy");
    assertEquals(typeof data.version, "string");
    assertMatch(data.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should include X-Response-Time header", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const responseTime = res.headers.get("X-Response-Time");
    assertEquals(typeof responseTime, "string");
    assertEquals(responseTime?.endsWith("ms"), true);
    
    await res.text(); // Consume the stream
  });
}); 