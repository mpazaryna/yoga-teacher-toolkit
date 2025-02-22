import { join } from "@std/path";

// Get the project root directory - remove the trailing slash
export const PROJECT_ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

// Configuration for various paths in the application
export const PATHS = {
  data: {
    config: join(PROJECT_ROOT, "data", "config"),
    templates: join(PROJECT_ROOT, "data", "templates"),
    output: join(PROJECT_ROOT, "data", "output")
  },
  src: join(PROJECT_ROOT, "src"),
  tests: join(PROJECT_ROOT, "tests"),
};

// Debug logging after PATHS is defined
console.log("Project root:", PROJECT_ROOT);
console.log("Config path:", PATHS.data.config);

// Helper function to get config file path
export function getConfigPath(configName: string): string {
  // Remove any leading 'data/config/' since we'll add the full path
  const cleanName = configName.replace(/^data\/config\//, '');
  
  // Just use the filename with the config path
  const fullPath = join(PATHS.data.config, cleanName);
  console.log("Full config path:", fullPath);
  return fullPath;
}

// Helper function to ensure required directories exist
export async function ensureDirectories() {
  for (const path of Object.values(PATHS.data)) {
    try {
      await Deno.mkdir(path, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
  }
} 