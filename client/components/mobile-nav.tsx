'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Menu, X, BookOpen, Compass, LayoutGrid } from 'lucide-react';
import Logo from './logo';
import { tools } from '@/lib/catalog';
import { GitHubIcon } from './github-icon';
import { SearchTool } from './search-tool';
export function MobileNav() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  function close() {
    dialog.current?.close();
    setOpen(false);
  }
  return (
    <>
      <button
        className="menu-toggle"
        aria-haspopup="dialog"
        aria-controls="mobile-menu"
        aria-expanded={open}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        Menu <Menu size={17} />
      </button>
      <dialog
        ref={dialog}
        id="mobile-menu"
        className="mobile-dialog"
        aria-labelledby="mobile-title"
        onClose={() => setOpen(false)}
      >
        <div className="mobile-panel-heading">
          <Logo />
          <button className="close-overlay" aria-label="Close navigation" onClick={close}>
            <X />
          </button>
        </div>
        <div className="mobile-panel-body">
          <p className="eyebrow">A little utility goes a long way</p>
          <h2 id="mobile-title">What’s next?</h2>
          <SearchTool mobile onNavigate={close} />
          <nav
            className="mobile-primary"
            aria-label="Mobile navigation"
            onClick={e => {
              if ((e.target as HTMLElement).closest('a')) close();
            }}
          >
            <Link className="mobile-feature-card" href="/#tools">
              <LayoutGrid />
              <span>
                <strong>Explore tools</strong>
                <small>Find the right tool for your next file.</small>
              </span>
              <span className="nav-count">6</span>
            </Link>
            <div className="mobile-resource-grid">
              <Link href="/docs/quick-start">
                <BookOpen />
                <strong>Getting started</strong>
                <small>From upload to your first download.</small>
              </Link>
              <Link href="/docs">
                <Compass />
                <strong>Documentation</strong>
                <small>Good workflows, written down.</small>
              </Link>
            </div>
          </nav>
          <section className="mobile-tasks">
            <div className="mobile-section-label">
              <h3>Browse by task</h3>
              <span>Start with a file</span>
            </div>
            <nav aria-label="File tools">
              {tools.map(tool => (
                <Link key={tool.href} href={tool.href} onClick={close}>
                  <tool.icon size={20} />
                  <span>{tool.title}</span>
                  <small>{tool.category}</small>
                </Link>
              ))}
            </nav>
          </section>
          <aside className="mobile-starter">
            <p className="eyebrow">Not sure where to begin?</p>
            <h3>A lighter image is a good start.</h3>
            <p>Choose your image, select a format, and track the result.</p>
            <Link href="/tools/converters/image" onClick={close}>
              Explore image conversion
            </Link>
          </aside>
        </div>
        <div className="mobile-panel-footer">
          <a href="https://github.com/smeltery/cloud-tools" className="icon-link">
            <GitHubIcon /> GitHub
          </a>
          <a href="https://github.com/smeltery/cloud-tools/issues">Feedback &amp; issues</a>
        </div>
      </dialog>
    </>
  );
}
