# Module Management

## Lexikon Module Configuration

The project uses Deno's import maps to manage the `@paz/lexikon` module dependency. This allows for flexible switching between local development and the published package versions.

### Current Import Map Configuration

The import map is defined in `deno.json`:

```json
{
  "imports": {
    "@paz/lexikon": "./src/lexikon/mod.ts",
    "@paz/lexikon/*": "./src/lexikon/*"
  }
}
```

### Switching Between Local and Published Versions

#### Local Development (Default)

For local development, use relative paths to the local lexikon module:

```json
{
  "imports": {
    "@paz/lexikon": "./src/lexikon/mod.ts",
    "@paz/lexikon/*": "./src/lexikon/*"
  }
}
```

This configuration:

- Points directly to the local lexikon module in the `src` directory
- Allows immediate testing of changes to the lexikon module
- Enables rapid development cycles without publishing
- Supports wildcard imports for accessing specific module files

#### Published Package

To use the published JSR package version:

```json
{
  "imports": {
    "@paz/lexikon": "jsr:@paz/lexikon",
    "@paz/lexikon/*": "jsr:@paz/lexikon/*"
  }
}
```

This configuration:

- Uses the latest published version from JSR
- Ensures you're testing against the actual published package
- Useful for verifying the published package works as expected

### Usage in Code

The import statements in your code remain the same regardless of which version you're using:

```typescript
import { generateYogaSequence, usageTracker } from "@paz/lexikon";
```

### Best Practices

1. **Local Development**
   - Use local imports during active development
   - Test changes immediately without publishing
   - Keep the local version in sync with your main lexikon repository

2. **Testing Published Versions**
   - Switch to the published version before releasing your app
   - Verify everything works with the published package
   - Test with specific versions by using version tags: `jsr:@paz/lexikon@1.0.0`

3. **Version Control**
   - Commit the `deno.json` with local paths for development
   - Document any specific version requirements in README.md
   - Consider using environment variables or build scripts to switch between versions automatically

### Troubleshooting

If you encounter import issues:

1. Clear the Deno cache:

   ```bash
   deno cache --reload
   ```

2. Verify the import map in `deno.json` points to the correct location

3. For local development, ensure the lexikon module exists in the specified path

4. For published versions, check that you have the correct permissions:

   ```bash
   deno run --allow-net --allow-read
   ```

### Module Update Process

1. **Making Changes to Lexikon**
   - Make changes in the local lexikon module
   - Test using the local import configuration
   - Publish updates to JSR when ready

2. **Testing Published Updates**
   - Switch import map to JSR version
   - Run full test suite
   - Switch back to local version for further development

### Command Reference

#### Development Commands

```bash
# Run with local version
deno task dev --provider=claude

# Run with specific published version
deno run --allow-read --allow-write --reload=jsr:@paz/lexikon src/app/generate.ts --provider=claude
```

#### Cache Management

```bash
# Clear module cache
deno cache --reload

# Update specific module
deno cache --reload=jsr:@paz/lexikon
```
