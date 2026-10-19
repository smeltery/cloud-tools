import Link from 'next/link';
import { FileText, ShieldCheck, HelpCircle } from 'lucide-react';
import { NextStep } from './next-step';
export function PolicyPage({
  kind,
  title,
  intro,
  sections,
}: {
  kind: 'Privacy' | 'Terms';
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
}) {
  const privacy = kind === 'Privacy';
  return (
    <div className="wrap policy-page">
      <header className="editorial-hero">
        <p className="eyebrow">A CLEARER PICTURE / {kind.toUpperCase()}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <div className="policy-note">
          <ShieldCheck size={20} />
          <span>
            {privacy
              ? 'Files leave your browser. Use an installation you trust.'
              : 'Keep your original. Check the result before relying on it.'}
          </span>
        </div>
      </header>
      <div className="policy-layout">
        <nav className="policy-nav" aria-label={`${kind} sections`}>
          <p className="eyebrow">ON THIS PAGE</p>
          {sections.map((section, i) => (
            <a key={section.title} href={`#section-${i + 1}`}>
              <span>0{i + 1}</span>
              {section.title}
            </a>
          ))}
          <Link className="policy-related" href={privacy ? '/terms-of-service' : '/privacy-policy'}>
            <FileText size={16} />
            {privacy ? 'Terms of use' : 'Privacy & your files'}
          </Link>
        </nav>
        <article className="policy-content">
          {sections.map((section, i) => (
            <section id={`section-${i + 1}`} key={section.title}>
              <p className="eyebrow">0{i + 1}</p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {!privacy && i === 0 && (
                <a
                  className="text-link"
                  href="https://github.com/smeltery/cloud-tools/blob/master/LICENSE"
                >
                  Read the full license
                </a>
              )}
            </section>
          ))}
          <div className="policy-help">
            <HelpCircle size={24} />
            <div>
              <h2>Need a little more detail?</h2>
              <p>
                {privacy
                  ? 'Your installation’s operator can explain its storage, access, and deletion policies.'
                  : 'The documentation explains supported formats, processing, and known limitations.'}
              </p>
              <Link className="text-link" href="/docs">
                Read the documentation
              </Link>
            </div>
          </div>
        </article>
      </div>
      <NextStep />
    </div>
  );
}
