import { assertEquals } from "../../dev_deps.ts";
import { createHealthResponse } from "@/server/routes/health.ts";
import { describe, it } from "../../dev_deps.ts";

describe("Health Check Unit Tests", () => {
  it("should create a valid health response", () => {
    const response = createHealthResponse();
    
    assertEquals(typeof response.status, "string");
    assertEquals(response.status, "healthy");
    assertEquals(typeof response.version, "string");
    assertEquals(typeof response.timestamp, "string");    
  });
    
  it("should have a valid ISO timestamp", () => {
    const response = createHealthResponse();
    assertEquals(new Date(response.timestamp).toISOString(), response.timestamp);
  });
});
