import { readdirSync } from "node:fs";
import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { resolve } from "node:path";

// The advisory has no upstream release. Verify the locked patch before
// accepting this one version-only finding; all other high findings fail.
const require = createRequire(import.meta.url);
let copies = 0;
const paths = readdirSync("node_modules/.bun")
  .filter((name) => name.startsWith("braces@"))
  .map((name) => `node_modules/.bun/${name}/node_modules/braces/package.json`);

for (const path of paths) {
  const braces = require(resolve(path, "../index.js"));
  assert.deepEqual(braces.expand("file.{png,webp}"), ["file.png", "file.webp"]);
  for (const [open, close] of [
    ["{", "}"],
    ["(", ")"],
  ]) {
    for (const operation of ["compile", "expand", "stringify"]) {
      assert.throws(
        () => braces[operation](open.repeat(4000) + "a,b" + close.repeat(4000)),
        {
          name: "SyntaxError",
          message: "Brace pattern nesting exceeds 128 levels",
        },
      );
    }
  }
  copies++;
}
assert(copies > 0, "No patched braces installation found");
const audit = Bun.spawnSync(["bun", "audit", "--json"], {
  stdout: "pipe",
  stderr: "inherit",
});
const findings = JSON.parse(audit.stdout.toString());
assert(
  audit.exitCode === 0 || audit.exitCode === 1,
  "Dependency audit could not complete",
);
const unresolved = Object.entries(findings).flatMap(([name, advisories]) =>
  (advisories as { url: string; severity: string; title: string }[])
    .filter(
      (advisory) =>
        ["high", "critical"].includes(advisory.severity) &&
        !(
          name === "braces" &&
          advisory.url === "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm"
        ),
    )
    .map((advisory) => `${name}: ${advisory.title} (${advisory.url})`),
);
assert.equal(unresolved.length, 0, unresolved.join("\n"));
console.log(
  `No unresolved high/critical findings. Verified depth guard in ${copies} braces installations.`,
);
