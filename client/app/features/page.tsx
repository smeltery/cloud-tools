import Link from 'next/link';
export const metadata = { title: 'Features' };
export default function Page() {
  return (
    <article className="wrap tools-section">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow">Features</p>
        <h1 className="text-4xl md:text-5xl my-8">The practical parts, together.</h1>
        <section key="0" className="border-t py-8">
          <h2 className="text-2xl mb-4">Six focused tools</h2>
          <p className="text-muted-foreground leading-8">
            Convert images, audio, video, and eBooks. Optimize images and PDF documents. Available
            output formats depend on the tool and the engines installed on the worker.
          </p>
        </section>
        <section key="1" className="border-t py-8">
          <h2 className="text-2xl mb-4">A job you can follow</h2>
          <p className="text-muted-foreground leading-8">
            Each upload receives a job ID. The worker updates progress and stores a result URL when
            processing completes. View server-side jobs or revisit recent conversions stored in your
            browser.
          </p>
        </section>
        <section key="2" className="border-t py-8">
          <h2 className="text-2xl mb-4">A stack you can adapt</h2>
          <p className="text-muted-foreground leading-8">
            TypeScript source, Terraform infrastructure, a locked Bun workspace, and a Flox
            environment make the project inspectable and reproducible. Guides explain setup, the
            API, and operational limits.
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
