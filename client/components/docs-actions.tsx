'use client';
import { useState } from 'react';
import { Copy, ArrowUp, MessageSquare } from 'lucide-react';
export function DocsActions({ markdown }: { markdown: string }) {
  const [status, setStatus] = useState('Copy as Markdown');
  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setStatus('Copied Markdown');
    } catch {
      setStatus('Copy failed. Use the source link above.');
    }
  }
  return (
    <>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <ArrowUp size={18} /> Scroll to top
      </button>
      <button onClick={copy}>
        <Copy size={18} />
        <span role="status">{status}</span>
      </button>
      <details className="docs-chat">
        <summary>
          <MessageSquare size={18} /> Open in chat
        </summary>
        <a
          href={`https://chatgpt.com/?q=${encodeURIComponent(`Help me understand this Cloud Tools documentation:
${markdown}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          ChatGPT
        </a>
        <a
          href={`https://claude.ai/new?q=${encodeURIComponent(`Help me understand this Cloud Tools documentation:
${markdown}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          Claude
        </a>
      </details>
    </>
  );
}
