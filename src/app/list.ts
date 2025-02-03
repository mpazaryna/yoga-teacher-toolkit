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
  string: ["status"],
  default: {
    status: "draft"
  },
});

if (!["draft", "approved"].includes(flags.status)) {
  console.error("Status must be either 'draft' or 'approved'");
  Deno.exit(1);
}

async function extractMetadata(filePath: string): Promise<SequenceMetadata | null> {
  try {
    const content = await Deno.readTextFile(filePath);
    const match = content.match(/^---([\s\S]*?)---/);
    if (!match) return null;
    
    const metadata = parseYaml(match[1]) as SequenceMetadata;
    return metadata;
  } catch {
    return null;
  }
}

async function listSequences(status: "draft" | "approved") {
  const baseDir = dirname(fromFileUrl(import.meta.url));
  const searchDir = status === "draft" 
    ? join(baseDir, "../../data/output")
    : join(baseDir, "../../data/setlists");

  try {
    const sequences: Array<SequenceMetadata & { path: string }> = [];
    
    for await (const entry of Deno.readDir(searchDir)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      
      const filePath = join(searchDir, entry.name);
      const metadata = await extractMetadata(filePath);
      
      if (metadata && metadata.status === status) {
        sequences.push({ ...metadata, path: filePath });
      }
    }

    // Sort by date, most recent first
    sequences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sequences.length === 0) {
      console.log(`No ${status} sequences found.`);
      return;
    }

    console.log(`\nFound ${sequences.length} ${status} sequences:\n`);
    
    for (const seq of sequences) {
      console.log(`ID: ${seq.id}`);
      console.log(`Date: ${new Date(seq.date).toLocaleString()}`);
      console.log(`Template: ${seq.template}`);
      console.log(`Provider: ${seq.provider}`);
      console.log(`Level: ${seq.level}`);
      console.log(`Duration: ${seq.duration}`);
      console.log(`Focus: ${seq.focus}`);
      console.log(`File: ${seq.path}`);
      console.log("---");
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Directory not found: ${searchDir}`);
    } else {
      throw error;
    }
  }
}

if (import.meta.main) {
  await listSequences(flags.status as "draft" | "approved");
} 