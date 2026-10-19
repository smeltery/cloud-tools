import Link from 'next/link';
export const metadata = { title: 'Terms' };
export default function Page() {
  return (
    <article className="wrap tools-section">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow">Terms</p>
        <h1 className="text-4xl md:text-5xl my-8">Using Cloud Tools.</h1>
        <section key="0" className="border-t py-8">
          <h2 className="text-2xl mb-4">Software license</h2>
          <p className="text-muted-foreground leading-8">
            Use, modification, and distribution of the software are governed by the PolyForm Shield
            1.0.0 license included in the repository. Review the full license for its conditions and
            warranty disclaimer.
          </p>
        </section>
        <section key="1" className="border-t py-8">
          <h2 className="text-2xl mb-4">Your files</h2>
          <p className="text-muted-foreground leading-8">
            Only upload files you are entitled to process. Keep a copy of your original and check
            converted output before relying on it. Formats, codecs, input validity, and engine
            availability can affect results.
          </p>
        </section>
        <section key="2" className="border-t py-8">
          <h2 className="text-2xl mb-4">An operator-managed service</h2>
          <p className="text-muted-foreground leading-8">
            These project pages describe the software. Individual installations may have their own
            access rules, limits, retention policies, and operating terms. The project does not
            promise service availability or compatibility with every file.
          </p>
        </section>
        <section key="3" className="border-t py-8">
          <h2 className="text-2xl mb-4">Report a problem</h2>
          <p className="text-muted-foreground leading-8">
            Use the repository issue tracker for reproducible software defects. Include the tool,
            output format, and a non-sensitive reproduction where possible.
          </p>
        </section>
        <div className="hero-actions">
          <Link className="primary-link" href="/#tools">
            Explore tools
          </Link>
          <Link className="text-link" href="/docs">
            Read the documentation
          </Link>
        </div>
      </div>
    </article>
  );
}
