import Link from 'next/link';
export const metadata = { title: 'About Cloud Tools' };
export default function Page() {
  return (
    <article className="wrap tools-section">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow">About Cloud Tools</p>
        <h1 className="text-4xl md:text-5xl my-8">Small tools. Useful outcomes.</h1>
        <section key="0" className="border-t py-8">
          <h2 className="text-2xl mb-4">A toolbox for everyday files</h2>
          <p className="text-muted-foreground leading-8">
            Cloud Tools brings image, audio, video, and eBook conversion together with image and PDF
            compression. Choose a file, request a format, and follow the processing job to its
            result.
          </p>
        </section>
        <section key="1" className="border-t py-8">
          <h2 className="text-2xl mb-4">Built to run on your infrastructure</h2>
          <p className="text-muted-foreground leading-8">
            The project combines a Next.js interface, TypeScript worker, AWS-compatible storage and
            queues, and Terraform. Run the interface locally, connect LocalStack for development, or
            configure your own AWS deployment.
          </p>
        </section>
        <section key="2" className="border-t py-8">
          <h2 className="text-2xl mb-4">A Smeltery project</h2>
          <p className="text-muted-foreground leading-8">
            Explore the source, report an issue, or adapt the tools under the PolyForm Shield
            license. The documentation describes current behavior and the limits to account for when
            self-hosting.
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
