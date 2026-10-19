import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';
for (const [name, language] of Object.entries({ bash, json, typescript, yaml }))
  hljs.registerLanguage(name, language);
const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export function renderCode({ text, lang }: { text: string; lang?: string }) {
  const language = lang?.split(/\s/)[0] || 'text';
  if (language === 'mermaid')
    return `<pre><code class="language-mermaid">${escape(text)}</code></pre>`;
  const code = hljs.getLanguage(language) ? hljs.highlight(text, { language }).value : escape(text);
  const label = ['sh', 'bash', 'shell'].includes(language)
    ? 'Terminal'
    : language === 'ts'
      ? 'TypeScript'
      : language.toUpperCase();
  const lines = text
    .split('\n')
    .map((_, index) => index + 1)
    .join('\n');
  return `<div class="docs-code"><div class="docs-code-heading"><span>${escape(label)}</span><button type="button" data-copy-code aria-label="Copy code" aria-live="polite">Copy</button></div><pre class="highlighted-code" tabindex="0" aria-label="${escape(label)} code"><span class="code-gutter" aria-hidden="true">${lines}</span><code>${code}</code></pre></div>`;
}
