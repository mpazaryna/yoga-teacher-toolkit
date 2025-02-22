import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { loadConfig, generateShortId } from "../../src/practices.ts";
import { stub } from "https://deno.land/std/testing/mock.ts";

Deno.test("generateShortId should create 5 character string", () => {
  const id = generateShortId();
  assertEquals(id.length, 5);
  assertEquals(/^[A-Z0-9]+$/.test(id), true);
});

Deno.test("loadConfig should parse JSON config file", async () => {
  // Mock config data
  const mockConfig = {
    provider: "test-provider",
    template: "test-template.txt",
    sequences: []
  };
  
  // Create stub for Deno.readTextFile
  const readFileStub = stub(Deno, "readTextFile", () => 
    Promise.resolve(JSON.stringify(mockConfig))
  );

  try {
    const config = await loadConfig("fake/path/config.json");
    assertEquals(config, mockConfig);
    assertEquals(readFileStub.calls.length, 1);
  } finally {
    // Clean up stub
    readFileStub.restore();
  }
}); 