'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './logo';
import { MobileNav } from './mobile-nav';
import { SearchTool } from './search-tool';
import { GitHubIcon } from './github-icon';
export default function Header() {
  const pathname = usePathname();
  const docs = pathname.startsWith('/docs');
  return (
    <header className={docs ? 'docs-header' : 'site-header'}>
      <div className={docs ? 'docs-header-inner' : 'wrap header-inner'}>
        <Logo />
        {docs && <span className="docs-label">Documentation</span>}
        <nav className="desktop-nav" aria-label="Main navigation">
          {(docs
            ? [
                ['/docs/api', 'API reference'],
                ['/docs/quick-start', 'Quick start'],
              ]
            : [
                ['/', 'Explore tools'],
                ['/docs/quick-start', 'Getting started'],
                ['/docs', 'Documentation'],
              ]
          ).map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <SearchTool />
        <a className="github-link" href="https://github.com/smeltery/cloud-tools">
          <GitHubIcon />
          <span>GitHub</span>
        </a>
        <MobileNav />
      </div>
    </header>
  );
}
