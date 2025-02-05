# Yoga Sequence Generation Workflow

This document outlines the complete workflow for generating, managing, and approving yoga sequences using the CLI tools.

## Directory Structure

```ascii
yoga-sequence-generator/
├── data/
│   ├── templates/    # Yoga sequence templates
│   ├── output/       # Generated draft sequences
│   └── setlists/     # Approved sequences ready for use
└── src/
    └── app/
        ├── approve.ts    # Content approval script
        ├── practices.ts  # Practice type implementations
        └── list.ts      # Content listing script
├── content/
│   ├── generator-template.ts   # Content generation template method
│   ├── retry.ts     # Retry logic for generation
│   ├── template.ts  # Template loading and processing
│   └── types.ts     # Shared type definitions
└── llm/
    ├── factory.ts   # LLM provider factory
    └── types.ts     # LLM-related type definitions
```

## Generating Sequences

### Quick Generation with Default Templates

The following commands use Claude as the default provider:

```bash
# Generate using Aileen's template
deno task generate:aileen

# Generate using Hatha template
deno task generate:hatha

# Generate using Vinyasa template
deno task generate:vinyasa
```

### Custom Generation

For more control over the generation process:

```bash
# Basic generation with custom parameters
deno task generate \
  --provider=claude \
  --template=aileen \
  --level=beginner \
  --duration="45 minutes" \
  --focus="flexibility and balance"

# Using different providers
deno task generate --provider=openai --template=hatha
deno task generate --provider=gemini --template=vinyasa
deno task generate --provider=groq --template=aileen
```

### Generation Parameters

- `--provider`: AI model provider (default: claude)
  - Options: claude, openai, gemini, groq
- `--template`: Template to use (default: aileen)
  - Options: any .txt file in data/templates (without extension)
- `--level`: Difficulty level (default: intermediate)
  - Suggested: beginner, intermediate, advanced
- `--duration`: Session length (default: "60 minutes")
- `--focus`: Practice focus (default: "strength and flexibility")

## Managing Sequences

### Listing Sequences

View available sequences in both draft and approved states:

```bash
# List draft sequences (in data/output)
deno task list:drafts

# List approved sequences (in data/setlists)
deno task list:approved
```

The listing includes:
- Unique sequence ID
- Generation date and time
- Template used
- Provider
- Level
- Duration
- Focus area
- File location

### Sequence File Structure

Each sequence file includes:

```markdown
---
id: XY12Z
date: 2024-03-20T15:30:00.000Z
provider: claude
template: aileen
level: intermediate
duration: 60 minutes
focus: strength and flexibility
status: draft
---

[Sequence content here]
```

## Approving Sequences

### Basic Approval

Move a sequence from drafts to approved setlists:

```bash
# Approve using sequence ID
deno task approve --id=XY12Z
```

### Force Approval

Override an existing approved sequence:

```bash
# Force approve and overwrite if exists
deno task approve --id=XY12Z --force
```

## Workflow Examples

### 1. Basic Sequence Generation

```bash
# Generate a new sequence
deno task generate:aileen

# Check the generated sequence
deno task list:drafts

# Approve if satisfied
deno task approve --id=ABC12
```

### 2. Custom Sequence Generation

```bash
# Generate with specific parameters
deno task generate \
  --provider=claude \
  --template=vinyasa \
  --level=advanced \
  --duration="90 minutes" \
  --focus="strength and inversions"

# Review drafts
deno task list:drafts

# Approve the sequence
deno task approve --id=XY12Z
```

### 3. Batch Generation and Review

```bash
# Generate multiple variations
deno task generate:aileen --level=beginner
deno task generate:aileen --level=intermediate
deno task generate:aileen --level=advanced

# List all drafts
deno task list:drafts

# Approve the best ones
deno task approve --id=ABC12
deno task approve --id=DEF34
```

## File Naming Convention

Generated sequences follow this naming pattern:
```
{ID}-{DATE}-{PROVIDER}-{TEMPLATE}.md

Example: XY12Z-2024-03-20-claude-aileen.md
```

Where:
- `ID`: 5-character alphanumeric unique identifier
- `DATE`: Generation date in YYYY-MM-DD format
- `PROVIDER`: AI provider used
- `TEMPLATE`: Template name used

## Status Workflow

1. **Draft Status**
   - New sequences are generated in `data/output/`
   - Marked with `status: draft` in metadata
   - Available for review and testing

2. **Approved Status**
   - Approved sequences move to `data/setlists/`
   - Marked with `status: approved` in metadata
   - Ready for production use
   - Original draft is removed from output directory

## Best Practices

1. **Template Selection**
   - Use `aileen` template for balanced sequences
   - Use `hatha` template for traditional approaches
   - Use `vinyasa` template for flow-based sequences

2. **Review Process**
   - Generate multiple variations
   - Review drafts using `list:drafts`
   - Test sequences personally
   - Approve only validated sequences

3. **Version Control**
   - Keep approved sequences in version control
   - Document any modifications in commit messages
   - Use force approval sparingly

4. **Provider Selection**
   - Claude: Best for detailed instructions
   - OpenAI: Good for creative variations
   - Gemini: Balanced approach
   - Groq: Fast generation, good for iterations
