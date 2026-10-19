import Link from 'next/link';
import { FileStack, Server, Code2 } from 'lucide-react';
import { NextStep, Questions } from '@/components/next-step';
export const metadata = {
  title: 'About Cloud Tools',
  description:
    'Six focused file tools from Smeltery. Convert, compress, or run the toolbox on your own infrastructure.',
};
export default function AboutPage() {
  return (
    <div className="wrap">
      <header className="editorial-hero">
        <p className="eyebrow">A SMELTERY PROJECT</p>
        <h1>
          Less file friction.
          <br />
          <em>More useful files.</em>
        </h1>
        <p>
          Cloud Tools brings six everyday file tasks into one place: image, audio, video, and eBook
          conversion, plus image and PDF compression.
        </p>
        <nav className="hero-actions" aria-label="Start using Cloud Tools">
          <Link className="primary-link" href="/">
            Choose a tool
          </Link>
          <Link className="text-link" href="/docs/quick-start">
            See how it works
          </Link>
        </nav>
      </header>
      <section className="editorial-section" aria-labelledby="about-paths">
        <p className="eyebrow">MAKE IT USEFUL TO YOU</p>
        <h2 id="about-paths">One toolbox. Your way in.</h2>
        <div className="guide-grid">
          {[
            {
              icon: FileStack,
              title: 'For your next file',
              text: 'Choose a format or compression tool, upload a file, and follow its job to the finished download. Keep the original while you check the result.',
              href: '/docs/formats',
              label: 'Find the right format',
            },
            {
              icon: Server,
              title: 'For your own setup',
              text: 'Run the interface locally, develop with LocalStack, or configure an AWS deployment. Storage, workers, access, and retention belong to your installation.',
              href: '/docs/deployment',
              label: 'Explore self-hosting',
            },
            {
              icon: Code2,
              title: 'For a better toolbox',
              text: 'Read the source, report an issue, or contribute an improvement. Bun and Flox provide the development environment, with shared checks before changes ship.',
              href: '/docs/development',
              label: 'Start contributing',
            },
          ].map(({ icon: Icon, title, text, href, label }) => (
            <article key={href}>
              <Icon size={27} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
              <Link className="text-link" href={href}>
                {label}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="editorial-section faq-section" aria-labelledby="about-details">
        <div>
          <p className="eyebrow">CLEAR ABOUT THE DETAILS</p>
          <h2 id="about-details">Know the tools you use.</h2>
          <p>
            A Next.js interface, a TypeScript worker, AWS-compatible storage and queues, and
            Terraform connect the upload to its result.
          </p>
          <div className="hero-actions">
            <a className="text-link" href="https://github.com/smeltery/cloud-tools">
              Explore the source
            </a>
            <Link className="text-link" href="/docs/architecture">
              How it’s built
            </Link>
          </div>
        </div>
        <div>
          <Questions
            items={[
              [
                'Where are my files processed?',
                'Files are uploaded to this installation’s storage and processed by a worker, not entirely in your browser. Ask the operator about access and retention before uploading sensitive files.',
              ],
              [
                'What should I expect from a result?',
                'Format support depends on the engines available on your installation. Compression savings vary; PDF optimization focuses on structure and metadata. Compare the result with your original.',
              ],
              [
                'How is Cloud Tools licensed?',
                'Cloud Tools is a Smeltery project under the PolyForm Shield license. Review the full license before adapting or distributing it; its permissions and restrictions apply.',
              ],
            ]}
          />
          <nav className="hero-actions" aria-label="Project policies">
            <Link className="text-link" href="/privacy-policy">
              File privacy
            </Link>
            <a
              className="text-link"
              href="https://github.com/smeltery/cloud-tools/blob/master/LICENSE"
            >
              Read the license
            </a>
          </nav>
        </div>
      </section>
      <NextStep
        title="Let’s make that file useful."
        description="Pick a conversion or compression tool. Your next step is one click away."
        href="/"
        label="Choose your tool"
      />
    </div>
  );
}
