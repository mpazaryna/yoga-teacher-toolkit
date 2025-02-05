# yoga-sequence-generator

The Yoga Sequence Generator is a Deno based application designed to assist senior yoga teachers in creating, analyzing, and customizing yoga sequences for their classes.

```bash
deno run --allow-net --allow-env --allow-read --allow-write cli_generator.ts 1
deno run --allow-net --allow-env --allow-read --allow-write cli_generator.ts 2
```

## Reload

```bash
deno cache --reload cli_generators.ts
deno run --reload=jsr:@paz/lexikon --allow-net --allow-env cli_generators.ts 3
```

```bash
deno run --allow-read --allow-write src/app/content-strategy.ts --provider=claude --level=beginner --duration="45 minutes" --focus="flexibility"
deno run --allow-read --allow-write improve.ts --provider=claude --iterations=2
```
