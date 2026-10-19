import Link from 'next/link';
import Image from 'next/image';
import { EverydayTasks, HomeGuidance } from '@/components/home-extras';
import { tools } from '@/lib/catalog';
export default function Home() {
  return (
    <>
      <section className="wrap home-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="blue-dot" /> YOUR EVERYDAY FILE TOOLBOX
          </p>
          <h1 id="hero-title">
            Convert files.
            <br />
            <em>Make them smaller.</em>
          </h1>
          <p className="hero-intro">
            Convert images, audio, videos, and eBooks. Compress images and PDFs. Choose a tool to
            get started.
          </p>
          <div className="hero-brands" aria-label="Built with Next.js, TypeScript, and Bun">
            <span>OPEN SOURCE · BUILT WITH</span>
            {[
              ['nextdotjs', 'Next.js'],
              ['typescript', 'TypeScript'],
              ['bun', 'Bun'],
            ].map(([slug, name]) => (
              <Image
                key={slug}
                src={`/brands/technology/${slug}.svg`}
                alt={name}
                width={22}
                height={22}
              />
            ))}
          </div>
        </div>
        <div className="hero-launcher">
          <h2>What would you like to do?</h2>
          {['Convert', 'Compress'].map(category => (
            <nav key={category} aria-label={`${category} a file`}>
              <div className="hero-group-heading">
                <h3>{category}</h3>
                <span>{category === 'Convert' ? 'Change the format' : 'Reduce the file size'}</span>
              </div>
              <div className="hero-tool-grid">
                {tools
                  .filter(tool => tool.category === category)
                  .map(tool => (
                    <Link
                      className="hero-tool"
                      prefetch={false}
                      key={tool.href}
                      href={tool.href}
                      aria-label={tool.title}
                    >
                      <tool.icon size={22} strokeWidth={1.6} aria-hidden="true" />
                      <span>
                        <strong>
                          {tool.title.replace(' converter', '').replace(' compression', '')}
                        </strong>
                        <small>
                          {tool.category === 'Convert'
                            ? tool.formats
                            : tool.title === 'PDF compression'
                              ? 'Optimize your PDF'
                              : 'Lighter images'}
                        </small>
                      </span>
                    </Link>
                  ))}
              </div>
            </nav>
          ))}
          <p className="hero-help">
            Already uploaded? <Link href="/jobs">Find your job</Link>
            <span>·</span>
            <Link href="/docs/quick-start">How it works</Link>
          </p>
        </div>
      </section>
      <section className="wrap tools-section" id="tools">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE RIGHT TOOL FOR THE NEXT STEP</p>
            <h2>What are you working with?</h2>
          </div>
          <p>
            Start with your file.
            <br />
            We’ll help with the next format.
          </p>
        </div>
        <div className="tool-grid">
          {tools.map((tool, index) => (
            <Link className="tool-card" key={tool.href} href={tool.href}>
              <div className="tool-card-top">
                <tool.icon size={27} strokeWidth={1.5} />
                <span>
                  0{index + 1} / {tool.category}
                </span>
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <div className="tool-card-bottom">
                <small>{tool.formats}</small>
                <span className="tool-open">Open tool</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <EverydayTasks />
      <section className="how-section">
        <div className="wrap how-grid">
          <div>
            <p className="eyebrow">FROM HERE TO DONE</p>
            <h2>
              Three steps.
              <br />
              <em>One less thing.</em>
            </h2>
            <Link className="text-link" href="/docs/conversion">
              Read the conversion guide
            </Link>
          </div>
          <ol>
            {[
              [
                'Choose a file',
                'An image, a video, a recording, a book, or a PDF. Pick the tool that fits.',
              ],
              [
                'Make it yours',
                'Choose your output format or compress the original. The worker handles the processing.',
              ],
              [
                'Pick up the result',
                'Follow your job’s progress and download the finished file when it’s ready.',
              ],
            ].map(([title, body], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="wrap builder-section">
        <div>
          <p className="eyebrow">YOUR FILES. YOUR INFRASTRUCTURE.</p>
          <h2>
            Useful in the browser.
            <br />
            <em>At home in your stack.</em>
          </h2>
          <p>
            A Next.js interface, a queue-backed worker, and Terraform for the infrastructure.
            Explore the code, run it locally, or make it your own.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/docs/deployment">
              Build your own setup
            </Link>
            <a className="text-link" href="https://github.com/smeltery/cloud-tools">
              Explore the source
            </a>
          </div>
        </div>
        <div className="stack-panel">
          <span>BUILT WITH TOOLS YOU KNOW</span>
          {[
            ['Next.js', 'The interface'],
            ['TypeScript', 'The application'],
            ['AWS + Terraform', 'The infrastructure'],
            ['Bun + Flox', 'The development environment'],
          ].map(([name, role]) => (
            <div key={name}>
              <strong>{name}</strong>
              <small>{role}</small>
            </div>
          ))}
        </div>
      </section>
      <HomeGuidance />
    </>
  );
}
