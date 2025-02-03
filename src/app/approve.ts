import { join, dirname, fromFileUrl } from "@std/path";
import { parse } from "@std/flags";
import { parse as parseYaml } from "@std/yaml";

interface SequenceMetadata {
  id: string;
  date: string;
  provider: string;
  template: string;
  level: string;
  duration: string;
  focus: string;
  status: "draft" | "approved";
}

// Parse command line arguments
const flags = parse(Deno.args, {
  string: ["id"],
  boolean: ["force"],
  default: {
    force: false
  },
});

if (!flags.id) {
  console.error("Please provide a sequence ID to approve");
  console.error("\nUsage:");
  console.error("  deno task approve --id=XY12Z [options]");
  console.error("\nOptions:");
  console.error("  --force    Overwrite if sequence already exists in setlists");
  Deno.exit(1);
}

async function findSequence(id: string): Promise<string | null> {
  const baseDir = dirname(fromFileUrl(import.meta.url));
  const outputDir = join(baseDir, "../../data/output");

  try {
    for await (const entry of Deno.readDir(outputDir)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      
      const filePath = join(outputDir, entry.name);
      const content = await Deno.readTextFile(filePath);
      const match = content.match(/^---([\s\S]*?)---/);
      
      if (match) {
        const metadata = parseYaml(match[1]) as SequenceMetadata;
        if (metadata.id === id) {
          return filePath;
        }
      }
    }
  } catch {
    // Ignore errors and return null
  }
  
  return null;
}

async function approveSequence(id: string, force = false) {
  const sequencePath = await findSequence(id);
  
  if (!sequencePath) {
    console.error(`No draft sequence found with ID: ${id}`);
    console.error("Use 'deno task list:drafts' to see available sequences");
    Deno.exit(1);
  }

  try {
    // Read the sequence content
    const content = await Deno.readTextFile(sequencePath);
    
    // Update the status in the metadata
    const updatedContent = content.replace(
      /status: draft/,
      "status: approved"
    );

    // Prepare the setlists directory
    const baseDir = dirname(fromFileUrl(import.meta.url));
    const setlistsDir = join(baseDir, "../../data/setlists");
    
    try {
      await Deno.stat(setlistsDir);
    } catch {
      await Deno.mkdir(setlistsDir, { recursive: true });
    }

    // Create the new filename in setlists
    const originalName = sequencePath.split("/").pop()!;
    const setlistPath = join(setlistsDir, originalName);

    // Check if file already exists in setlists
    try {
      await Deno.stat(setlistPath);
      if (!force) {
        console.error(`Sequence already exists in setlists: ${setlistPath}`);
        console.error("Use --force to overwrite");
        Deno.exit(1);
      }
    } catch {
      // File doesn't exist, we can proceed
    }

    // Move the file to setlists with updated content
    await Deno.writeTextFile(setlistPath, updatedContent);
    await Deno.remove(sequencePath);

    console.log(`\nSequence ${id} approved and moved to setlists:`);
    console.log(setlistPath);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error approving sequence:", error.message);
    } else {
      console.error("Error approving sequence:", String(error));
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await approveSequence(flags.id, flags.force);
} 