'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { tools, guides } from '@/lib/catalog';
const entries = [
  ...tools.map(t => ({ title: t.title, href: t.href, kind: 'Tool' })),
  ...guides.map(g => ({ title: g.title, href: `/docs/${g.slug}`, kind: 'Guide' })),
];
export function SearchTool({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const matches = entries.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (mobile) return;
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        dialog.current?.showModal();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobile]);
  return (
    <>
      <button
        className={mobile ? 'mobile-search-trigger' : 'header-search-trigger'}
        onClick={() => dialog.current?.showModal()}
        aria-label="Search tools and documentation"
        aria-haspopup="dialog"
      >
        <Search size={18} />
        <span>{mobile ? 'Search tools & guides' : 'Search'}</span>
        <kbd>⌘ K</kbd>
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-label="Search tools and documentation"
        onClick={event => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="search-heading">
          <Search size={20} />
          <input
            aria-label="Search tools and documentation"
            placeholder="Search tools and guides…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button aria-label="Close search" onClick={() => dialog.current?.close()}>
            <X size={20} />
          </button>
        </div>
        <div className="search-results">
          <p role="status">{matches.length} results</p>
          {matches.map(item => (
            <Link
              href={item.href}
              key={item.href}
              onClick={() => {
                dialog.current?.close();
                onNavigate?.();
              }}
            >
              <span>{item.title}</span>
              <small>{item.kind}</small>
            </Link>
          ))}
          {!matches.length && <p>No matches. Try “image”, “jobs”, or “API”.</p>}
        </div>
      </dialog>
    </>
  );
}
