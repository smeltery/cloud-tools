import Link from 'next/link';
import { ToolCards } from './tool-cards';
import { NextStep, Questions } from './next-step';
export function ToolCatalog({ category }: { category: 'Convert' | 'Compress' }) {
  const converting = category === 'Convert';
  return (
    <div className="wrap catalog-page">
      <header className="editorial-hero">
        <p className="eyebrow">THE SMELTERY FILE TOOLBOX</p>
        <h1>
          {converting ? (
            <>
              A new format.
              <br />
              <em>More possibilities.</em>
            </>
          ) : (
            <>
              A little less weight.
              <br />
              <em>Just as useful.</em>
            </>
          )}
        </h1>
        <p>
          {converting
            ? 'For the image that needs a new home, the recording you want to share, and the book on your next device. Start with your file type.'
            : 'Make room for what matters. Optimize an image or PDF for its next destination. Keep your original while you compare the result.'}
        </p>
        <nav className="category-tabs" aria-label="Tool categories">
          <Link href="/tools/converters" aria-current={converting ? 'page' : undefined}>
            Convert files <span>4 tools</span>
          </Link>
          <Link href="/tools/compression" aria-current={!converting ? 'page' : undefined}>
            Compress files <span>2 tools</span>
          </Link>
        </nav>
      </header>
      <section aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PICK YOUR STARTING POINT</p>
            <h2 id="catalog-title">What’s in your file?</h2>
          </div>
          <Link className="text-link" href="/docs/formats">
            Check supported formats
          </Link>
        </div>
        <ToolCards category={category} />
      </section>
      <section className="editorial-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE A GOOD FIRST CHOICE</p>
            <h2>
              {converting ? 'The right format for the job.' : 'Less size. The right expectations.'}
            </h2>
          </div>
        </div>
        <div className="guide-grid">
          {(converting
            ? [
                [
                  'For the web',
                  'WebP is a useful image option. Check your destination’s supported formats before converting.',
                  '/tools/converters/image',
                  'Explore image formats',
                ],
                [
                  'For listening and watching',
                  'Choose the format your player or editor accepts. Codec availability depends on your installation.',
                  '/docs/formats',
                  'Read format guidance',
                ],
                [
                  'For your next chapter',
                  'Check your reader’s accepted eBook formats before choosing an output.',
                  '/tools/converters/ebooks',
                  'Explore eBook formats',
                ],
              ]
            : [
                [
                  'Keep a clean original',
                  'Save a copy before optimizing. Check text, edges, and fine detail in the downloaded result.',
                  '/docs/conversion',
                  'Read the workflow',
                ],
                [
                  'Every file is different',
                  'Already optimized files may not become smaller. PDF optimization focuses on structure and metadata.',
                  '/docs/formats',
                  'See format details',
                ],
                [
                  'Need another format?',
                  'Compression and conversion solve different problems. Use a converter when a destination requires a specific type.',
                  '/tools/converters',
                  'Explore converters',
                ],
              ]
          ).map(([title, body, href, label], i) => (
            <article key={title}>
              <span className="eyebrow">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <Link className="text-link" href={href}>
                {label}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="faq-section editorial-section">
        <div>
          <p className="eyebrow">GOOD TO KNOW</p>
          <h2>Before you upload.</h2>
        </div>
        <Questions
          items={[
            [
              'Where does my file go?',
              'Your file is uploaded to this installation and processed by its worker. Retention and access depend on the operator. Read the privacy page before sending sensitive files.',
            ],
            [
              converting ? 'Will every format work?' : 'Will my file always get smaller?',
              converting
                ? 'Support depends on the input, output, and engines available on your installation. The format guide lists the intended options and limitations.'
                : 'No. Savings depend on the original file and the processing options. Compare the downloaded file with your original before replacing it.',
            ],
            [
              'Where do I check progress?',
              'The tool shows your recent jobs. You can also open the Jobs page to check status and download completed results.',
            ],
          ]}
        />
      </section>
      <NextStep
        title="Already sent a file?"
        description="Pick up where you left off. Check your job and save its result when it’s ready."
        href="/jobs"
        label="Check your jobs"
      />
    </div>
  );
}
