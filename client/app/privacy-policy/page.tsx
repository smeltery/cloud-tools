import Link from 'next/link';
export const metadata = { title: 'Privacy' };
export default function Page() {
  return (
    <article className="wrap tools-section">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow">Privacy</p>
        <h1 className="text-4xl md:text-5xl my-8">Know where your files go.</h1>
        <section key="0" className="border-t py-8">
          <h2 className="text-2xl mb-4">Uploads and processing</h2>
          <p className="text-muted-foreground leading-8">
            This application uploads selected files to the storage configured by its operator. A
            worker reads those files and writes processed outputs. It is not a browser-only
            converter.
          </p>
        </section>
        <section key="1" className="border-t py-8">
          <h2 className="text-2xl mb-4">Job records and browser history</h2>
          <p className="text-muted-foreground leading-8">
            Job records include file names, types, sizes, operation, timestamps, and status. Recent
            conversion history is stored in browser local storage. Clearing browser history does not
            delete server-side files or job records.
          </p>
        </section>
        <section key="2" className="border-t py-8">
          <h2 className="text-2xl mb-4">Retention and access</h2>
          <p className="text-muted-foreground leading-8">
            Retention, storage access, logs, and deployment-level analytics depend on the
            installation. This project does not promise a fixed deletion window. The current API has
            no built-in per-user access controls; use a trusted installation and consult its
            operator before sending sensitive files.
          </p>
        </section>
        <section key="3" className="border-t py-8">
          <h2 className="text-2xl mb-4">Questions about your data</h2>
          <p className="text-muted-foreground leading-8">
            Contact the operator of the installation you are using for its retention and deletion
            practices. For software behavior or bugs, use the repository issue tracker without
            attaching private files or credentials.
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
