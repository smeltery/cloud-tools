import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="wrap tools-section">
      <p className="eyebrow">404 / FILE NOT FOUND</p>
      <h1 className="text-4xl my-6">That page isn’t here.</h1>
      <p className="mb-8">Find a tool or return to the documentation.</p>
      <div className="hero-actions">
        <Link href="/" className="primary-link">
          Explore tools
        </Link>
        <Link href="/docs" className="text-link">
          Documentation
        </Link>
      </div>
    </section>
  );
}
