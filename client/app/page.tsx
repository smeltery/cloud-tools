import Link from 'next/link';
import Image from 'next/image';
import { Cloud, Upload, SlidersHorizontal, Download, Check } from 'lucide-react';
import { tools } from '@/lib/catalog';
export default function Home() {
  return (
    <>
      <section className="wrap home-hero">
        <div>
          <p className="eyebrow">
            <span className="blue-dot" /> THE SMELTERY FILE TOOLBOX
          </p>
          <h1>
            A new format.
            <br />
            <em>A lighter file.</em>
            <br />
            Back to your day.
          </h1>
          <p className="hero-intro">
            Convert, compress, and carry on.
            <br />
            Your everyday file tools, together in one place.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="#tools">
              Find your tool <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/docs/quick-start">
              How it works
            </Link>
          </div>
          <p className="hero-meta">
            6 focused tools <span>·</span> Built to self-host <span>·</span> Yours to adapt
          </p>
        </div>
        <div className="hero-art">
          <div className="art-caption">
            <Cloud size={18} />
            <span>A LITTLE UTILITY. A LOT LESS FRICTION.</span>
          </div>
          <Image
            src="/conversion.svg"
            alt="Illustration of an original PNG image and its WebP conversion in a file workspace"
            width={600}
            height={420}
            priority
          />
          <div className="art-note">
            <Check size={15} /> New format. New possibilities.
          </div>
        </div>
      </section>
      <div className="wrap utility-strip">
        <p>
          Small changes.
          <br />
          <strong>More useful files.</strong>
        </p>
        <span>
          <Upload /> Upload your file
        </span>
        <span>
          <SlidersHorizontal /> Make it work for you
        </span>
        <span>
          <Download /> Take it with you
        </span>
      </div>
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
    </>
  );
}
