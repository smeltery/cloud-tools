import Link from 'next/link';
export const metadata = { title: 'Tools & services' };
export default function Page() {
  return (
    <article className="wrap tools-section">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow">Tools & services</p>
        <h1 className="text-4xl md:text-5xl my-8">Find the right tool for your file.</h1>
        <section key="0" className="border-t py-8">
          <h2 className="text-2xl mb-4">Conversion</h2>
          <p className="text-muted-foreground leading-8">
            Images use Sharp, audio and video use FFmpeg, and eBooks use Calibre. The browser
            exposes a focused set of output formats for each category.
          </p>
        </section>
        <section key="1" className="border-t py-8">
          <h2 className="text-2xl mb-4">Compression</h2>
          <p className="text-muted-foreground leading-8">
            Use the image compressor for lighter image files or the PDF tool for structure and
            metadata optimization. Savings vary with the input; inspect the output and retain your
            original.
          </p>
        </section>
        <section key="2" className="border-t py-8">
          <h2 className="text-2xl mb-4">Your own installation</h2>
          <p className="text-muted-foreground leading-8">
            Cloud Tools is a self-hostable application. Processing needs a configured worker,
            storage, queue, and jobs database. The documentation explains how these fit together.
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
