import Image from 'next/image';
export const metadata = { title: 'Brand & assets' };
export default function Brand() {
  return (
    <section className="wrap tools-section">
      <p className="eyebrow">SMELTERY / CLOUD TOOLS</p>
      <h1 className="text-4xl my-6">A little utility. A clear identity.</h1>
      <p className="mb-8">
        The Cloud Tools mark and social preview, ready to use when linking to this project.
      </p>
      <div className="flex gap-8 items-center mb-10">
        <Image src="/logo.svg" alt="Cloud Tools cloud mark" width={80} height={80} />
        <a href="/logo.svg" download className="text-link">
          Download SVG logo
        </a>
      </div>
      <Image
        src="/og.png"
        alt="Cloud Tools social preview"
        width={1200}
        height={630}
        className="rounded-2xl border"
      />
      <a className="text-link inline-block mt-6" href="/og.png" download>
        Download social image
      </a>
    </section>
  );
}
