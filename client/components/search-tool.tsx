'use client';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { tools, guides } from '@/lib/catalog';
const entries = [
  ...tools.map(t => ({ ...t, kind: 'Tools' })),
  ...guides.map(g => ({
    title: g.title,
    href: `/docs/${g.slug}`,
    description: `${g.group} · ${g.title} for Cloud Tools.`,
    kind: 'Guides',
  })),
  {
    title: 'Brand & assets',
    href: '/brand',
    description: 'Logos, colors, typography, and downloads.',
    kind: 'Pages',
  },
  {
    title: 'About Cloud Tools',
    href: '/about',
    description: 'A small toolbox for everyday file work.',
    kind: 'Pages',
  },
  {
    title: 'Jobs',
    href: '/jobs',
    description: 'Check progress and download your converted files.',
    kind: 'Pages',
  },
  {
    title: 'Service status',
    href: '/status',
    description: 'Check the health of your conversion services.',
    kind: 'Pages',
  },
];
export function SearchTool({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Everything');
  const [active, setActive] = useState(-1);
  const matches = entries.filter(
    item =>
      (category === 'Everything' || item.kind === category) &&
      `${item.title} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  function open() {
    setQuery('');
    setCategory('Everything');
    setActive(-1);
    dialog.current?.showModal();
    input.current?.focus();
  }
  useEffect(() => {
    if (mobile) return;
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobile]);
  return (
    <>
      <button
        className={mobile ? 'mobile-search-trigger' : 'header-search-trigger'}
        onClick={open}
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
        onKeyDown={event => {
          if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !matches.length) return;
          event.preventDefault();
          const next =
            event.key === 'ArrowDown'
              ? (active + 1) % matches.length
              : active <= 0
                ? matches.length - 1
                : active - 1;
          setActive(next);
          dialog.current?.querySelectorAll<HTMLAnchorElement>('.search-results a')[next]?.focus();
        }}
      >
        <div className="search-header">
          <div>
            <p className="eyebrow">A little less looking</p>
            <h2>Find your next step.</h2>
          </div>
          <button
            className="close-overlay"
            aria-label="Close search"
            onClick={() => dialog.current?.close()}
          >
            <X size={24} />
          </button>
        </div>
        <div className="search-field">
          <label htmlFor={id}>Search tools, guides, and pages</label>
          <input
            ref={input}
            id={id}
            aria-label="Search tools and documentation"
            placeholder="Search tools, guides, or pages…"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActive(-1);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' && matches.length) {
                event.preventDefault();
                dialog.current?.querySelector<HTMLAnchorElement>('.search-results a')?.click();
              }
            }}
          />
        </div>
        <div className="search-filters" aria-label="Filter search results">
          {['Everything', 'Tools', 'Guides', 'Pages'].map(value => (
            <button
              key={value}
              aria-pressed={category === value}
              onClick={() => {
                setCategory(value);
                setActive(-1);
              }}
            >
              {value}
            </button>
          ))}
        </div>
        <nav className="search-results" aria-label="Search results">
          {matches.map((item, index) => (
            <Link
              href={item.href}
              key={item.href}
              onFocus={() => setActive(index)}
              onClick={() => {
                dialog.current?.close();
                onNavigate?.();
              }}
            >
              <span className="result-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <span className="result-category">{item.kind}</span>
            </Link>
          ))}
          {!matches.length && <p>No matches. Try “image”, “jobs”, or “API”.</p>}
        </nav>
        <div className="search-footer">
          <span role="status">{matches.length} results</span>
          <div className="keyboard-hints">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> Move
            </span>
            <span>
              <kbd>↵</kbd> Open
            </span>
            <span>
              <kbd>esc</kbd> Close
            </span>
          </div>
          <a className="all-repositories" href="https://github.com/smeltery">
            All repositories
          </a>
        </div>
      </dialog>
    </>
  );
}
