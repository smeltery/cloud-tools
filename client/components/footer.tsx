import Link from 'next/link';
import Logo from './logo';
import { GitHubIcon } from './github-icon';
const columns = [
  {
    title: 'The toolbox',
    links: [
      ['All tools', '/#tools'],
      ['Converters', '/tools/converters'],
      ['Compression', '/tools/compression'],
      ['Job status', '/jobs'],
    ],
  },
  {
    title: 'Resources',
    links: [
      ['Brand & assets', '/brand'],
      ['Getting started', '/docs/quick-start'],
      ['Documentation', '/docs'],
      ['Self-hosting', '/docs/deployment'],
      ['Contributing', '/docs/development'],
    ],
  },
  {
    title: 'In the open',
    links: [
      ['About Cloud Tools', '/about'],
      ['Privacy', '/privacy-policy'],
      ['Terms', '/terms-of-service'],
      ['GitHub repository', 'https://github.com/smeltery/cloud-tools'],
      ['Feedback & issues', 'https://github.com/smeltery/cloud-tools/issues'],
      ['System status', '/status'],
    ],
  },
];
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>
              A little utility.
              <br />A lot less friction.
            </p>
            <span>File tools for thoughtful builders.</span>
          </div>
          {columns.map(column => (
            <nav key={column.title} aria-label={column.title}>
              <h2>{column.title}</h2>
              {column.links.map(([label, href]) => (
                <Link
                  href={href}
                  key={href}
                  className={label === 'GitHub repository' ? 'icon-link' : undefined}
                >
                  {label === 'GitHub repository' && <GitHubIcon />}
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Smeltery</span>
          <a href="https://github.com/smeltery/cloud-tools/blob/master/LICENSE">
            PolyForm Shield license
          </a>
          <span className="footer-note">Built for the way you work.</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
