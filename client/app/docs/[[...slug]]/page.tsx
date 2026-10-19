import { notFound } from 'next/navigation';
import Link from 'next/link';
import { guides } from '@/lib/catalog';
import { readGuide } from '@/lib/docs';
import { DocsCodeCopy } from '@/components/docs-code-copy';
import '@/styles/docs-code.css';
import { DocsActions } from '@/components/docs-actions';
import { DocsDiagrams } from '@/components/docs-diagrams';
import { GitHubIcon } from '@/components/github-icon';
import '@/styles/docs.css';
type Props = { params: Promise<{ slug?: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return guides.map(guide => ({ slug: guide.slug ? [guide.slug] : [] }));
}
export async function generateMetadata({ params }: Props) {
  const guide = await readGuide((await params).slug?.join('/') || '');
  return { title: guide?.title || 'Documentation', description: guide?.markdown.split('\n\n')[1] };
}
export default async function DocsPage({ params }: Props) {
  const slug = (await params).slug?.join('/') || '';
  const guide = await readGuide(slug);
  if (!guide) notFound();
  const nav = (
    <nav aria-label="Documentation pages">
      <Link className="docs-api-link" href="/docs/api">
        API overview
      </Link>
      {[...new Set(guides.map(g => g.group))].map(group => (
        <section key={group}>
          <h2>{group}</h2>
          {guides
            .filter(g => g.group === group)
            .map(g => (
              <Link
                key={g.slug}
                href={`/docs/${g.slug}`}
                aria-current={g.slug === slug ? 'page' : undefined}
              >
                {g.title}
              </Link>
            ))}
        </section>
      ))}
    </nav>
  );
  const index = guides.findIndex(g => g.slug === slug);
  return (
    <div className="docs-layout">
      <aside className="docs-sidebar" aria-label="Documentation navigation">
        {nav}
      </aside>
      <details className="docs-mobile-nav">
        <summary>Documentation · {guide.title}</summary>
        {nav}
      </details>
      <article className="docs-article">
        <p className="docs-group">{slug === 'api' ? 'DEVELOPER DOCUMENTATION' : guide.group}</p>
        <h1>
          {slug === 'api' ? (
            <>
              Files in.
              <br />
              <em>Possibilities out.</em>
            </>
          ) : (
            guide.title
          )}
        </h1>
        <details className="docs-mobile-toc">
          <summary>On this page</summary>
          <nav aria-label="Article sections">
            {guide.headings.map(h => (
              <a key={h.id} href={`#${h.id}`}>
                {h.title}
              </a>
            ))}
          </nav>
        </details>
        <div dangerouslySetInnerHTML={{ __html: guide.html }} />
        <DocsDiagrams slug={slug} />
        <DocsCodeCopy />
        <nav className="docs-pagination" aria-label="Adjacent pages">
          {index > 0 && (
            <Link href={`/docs/${guides[index - 1].slug}`}>
              <small>Previous</small>
              {guides[index - 1].title}
            </Link>
          )}
          {index < guides.length - 1 && (
            <Link href={`/docs/${guides[index + 1].slug}`}>
              <small>Next</small>
              {guides[index + 1].title}
            </Link>
          )}
        </nav>
      </article>
      <aside className="docs-toc" aria-label="Article contents and actions">
        <p>ON THIS PAGE</p>
        <nav aria-label="On this page">
          {guide.headings.map(h => (
            <a key={h.id} href={`#${h.id}`}>
              {h.title}
            </a>
          ))}
        </nav>
        <div className="docs-actions">
          <a href={`https://github.com/smeltery/cloud-tools/edit/master/docs/${guide.file}.md`}>
            <GitHubIcon /> Edit on GitHub
          </a>
          <DocsActions markdown={guide.markdown} />
        </div>
      </aside>
    </div>
  );
}
