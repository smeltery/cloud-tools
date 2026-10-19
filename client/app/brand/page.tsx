import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { BrandPalette } from '@/components/brand-palette';
import '@/styles/brand.css';
export const metadata = {
  title: 'Brand & assets',
  description: 'Cloud Tools logos, colors, typography, and downloadable assets.',
};
export default function Brand() {
  return (
    <div className="wrap brand-page">
      <header className="intro">
        <p className="eyebrow">Cloud Tools / Brand &amp; assets</p>
        <h1>
          A little utility.
          <br />
          <em>A clear identity.</em>
        </h1>
        <p className="lede">
          The pieces that make our tools feel at home. For your next README, project mention, or
          introduction to Cloud Tools.
        </p>
        <a className="btn btn-primary" href="#downloads">
          Get the assets <ArrowDown size={16} />
        </a>
      </header>
      <section aria-labelledby="mark-title">
        <p className="eyebrow">01 / The mark</p>
        <h2 id="mark-title">
          A simple cloud. <em>Room to make.</em>
        </h2>
        <p className="lede">
          Our cloud mark gives everyday file work a familiar home. Keep its original colors and
          proportions, with plenty of space around it.
        </p>
        <div className="marks">
          <figure className="mark-preview">
            <Image src="/logo.svg" alt="Cloud Tools cloud mark" width={150} height={150} />
            <figcaption>Original mark</figcaption>
          </figure>
          <figure className="signature-preview">
            <div className="signature">
              <Image src="/logo.svg" alt="" width={56} height={56} />
              <span>
                smeltery <span className="labs">/ cloud tools</span>
              </span>
            </div>
            <figcaption>The project signature</figcaption>
          </figure>
        </div>
      </section>
      <section aria-labelledby="social-title">
        <p className="eyebrow">02 / The first impression</p>
        <h2 id="social-title">
          Less friction. <em>Worth sharing.</em>
        </h2>
        <p className="lede">
          Our social preview brings the toolbox together in one image. Use the original PNG for link
          previews and project introductions.
        </p>
        <figure className="social">
          <Image
            src="/og.png"
            alt="Cloud Tools: a new format, a little less friction. File conversion on a light blue background."
            width={1200}
            height={630}
          />
        </figure>
      </section>
      <section aria-labelledby="color-title">
        <p className="eyebrow">03 / Color</p>
        <h2 id="color-title">
          Quiet colors. <em>Clear intent.</em>
        </h2>
        <p className="lede">
          Paper, ink, and a touch of blue. Keep text dark on light surfaces and use white for text
          on ink or blue. Select a color to copy its hex value.
        </p>
        <BrandPalette />
      </section>
      <section aria-labelledby="type-title">
        <p className="eyebrow">04 / Typography</p>
        <h2 id="type-title">
          A useful voice. <em>A human touch.</em>
        </h2>
        <div className="type-list">
          <article>
            <p className="eyebrow">Geist / Interface</p>
            <p className="sample">Less friction. More making.</p>
            <p className="fine">
              Our everyday voice for headings, navigation, and comfortable reading.
            </p>
          </article>
          <article>
            <p className="eyebrow">Georgia / Emphasis</p>
            <p className="sample">
              <em>With room to breathe.</em>
            </p>
            <p className="fine">A softer accent for a few well-chosen words.</p>
          </article>
          <article>
            <p className="eyebrow">System monospace / Code</p>
            <p className="sample mono">bun run dev</p>
            <p className="fine">Commands and technical details, set clearly.</p>
          </article>
        </div>
      </section>
      <section id="downloads" aria-labelledby="downloads-title">
        <p className="eyebrow">05 / The toolkit</p>
        <h2 id="downloads-title">
          Ready for <em>your next mention.</em>
        </h2>
        <p className="lede">
          Download the original files, individually. Use them to identify Cloud Tools and link back
          to the project.
        </p>
        <ul className="downloads">
          {[
            ['Vector mark', 'SVG · original colors · scalable', '/logo.svg'],
            ['Social preview', 'PNG · 1200 × 630', '/og.png'],
            ['Browser icon', 'SVG · scalable', '/icon.svg'],
          ].map(([title, description, href]) => (
            <li key={href}>
              <div>
                <h3>{title}</h3>
                <p className="fine">{description}</p>
              </div>
              <a
                className="btn btn-outline"
                href={href}
                download
                aria-label={`Download ${title.toLowerCase()}`}
              >
                Download <ArrowDown size={16} />
              </a>
            </li>
          ))}
        </ul>
        <div className="guidance">
          <h3>A little care goes a long way.</h3>
          <p>
            Use “Cloud Tools” in prose and keep the mark intact. Leave clear space around it, avoid
            stretching or recoloring, and choose a simple background. These assets identify the
            project; they don’t imply endorsement.
          </p>
        </div>
      </section>
    </div>
  );
}
