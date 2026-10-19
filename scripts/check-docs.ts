import { Glob } from "bun";
import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { JSDOM } from "jsdom";

const dom = new JSDOM("");
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
});
const { default: mermaid } = await import("mermaid");
mermaid.initialize({ startOnLoad: false });
let diagrams = 0;
for await (const file of new Glob("**/*.md").scan(".")) {
  if (
    /(^|\/)(node_modules|\.next|\.terraform|\.website-studio|\.flox|coverage|dist|playwright-report|test-results)\//.test(
      file,
    )
  )
    continue;
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)) {
    try {
      await mermaid.parse(match[1]);
      diagrams++;
    } catch (error) {
      throw new Error(`${file}: invalid Mermaid diagram`, { cause: error });
    }
  }
  // Check authored documentation links without requiring external sites online.
  if (file.startsWith("docs/") || file === "README.md") {
    for (const [, target] of text.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const path = target.split("#")[0];
      if (path) await access(resolve(dirname(file), decodeURIComponent(path)));
    }
  }
}
console.log(`Markdown links and ${diagrams} Mermaid diagrams validated.`);
