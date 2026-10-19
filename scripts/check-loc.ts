import { Glob } from "bun";
import { readFile } from "node:fs/promises";
import budget from "./loc-budget.json";
let total = 0;
const failures: string[] = [];
for await (const file of new Glob(
  "**/*.{ts,tsx,js,mjs,css,sh,yml,yaml,tf}",
).scan({ dot: true })) {
  if (
    /(^|\/)(node_modules|\.next|\.terraform|\.website-studio|\.flox|coverage|dist|\.git|playwright-report|test-results)\//.test(
      file,
    ) ||
    file.endsWith("next-env.d.ts")
  )
    continue;
  const lines = (await readFile(file, "utf8")).trimEnd().split("\n").length;
  total += lines;
  const limit = (budget.legacy as Record<string, number>)[file] ?? budget.file;
  if (lines > limit) failures.push(`${file}: ${lines} > ${limit}`);
}
if (total > budget.total) failures.push(`Total: ${total} > ${budget.total}`);
if (failures.length)
  throw new Error(`LOC budget exceeded:\n${failures.join("\n")}`);
console.log(
  `LOC budget: ${total}/${budget.total}; new files ≤ ${budget.file} lines.`,
);
