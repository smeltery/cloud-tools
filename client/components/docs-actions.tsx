'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Copy, ArrowUp, MessageSquare, ChevronDown, ExternalLink } from 'lucide-react';
const providers = [
  ['ChatGPT', 'chatgpt', 'https://chatgpt.com/?prompt='],
  ['Claude', 'claude', 'https://claude.ai/new?q='],
  ['v0', 'v0', 'https://v0.app/?q='],
  ['t3.chat', 't3', 'https://t3.chat/new?q='],
  ['Scira', 'scira', 'https://scira.ai/?q='],
  ['Cursor', 'cursor', 'https://cursor.com/link/prompt?text='],
];
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
      <button onClick={copy} aria-label="Copy as Markdown">
        <Copy size={18} />
        <span role="status">{status}</span>
      </button>
      <details className="docs-chat">
        <summary>
          <MessageSquare size={19} /> Open in chat{' '}
          <ChevronDown className="action-chevron" size={14} />
        </summary>
        <div className="chat-providers">
          {providers.map(([name, icon, url]) => (
            <a
              key={name}
              href={`${url}${encodeURIComponent(`Help me use Cloud Tools based on this documentation:\n\n${markdown}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Image src={`/brands/chat/${icon}.svg`} alt="" width={19} height={19} />
              <span>{name}</span>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
        <p className="chat-note">Opens with this page’s documentation in the prompt.</p>
      </details>
    </>
  );
}
