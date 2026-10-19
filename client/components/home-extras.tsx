import Link from 'next/link';
import { Image, Music, FileText, Server, FolderCheck, BookOpen } from 'lucide-react';
import { Questions, NextStep } from './next-step';
export function EverydayTasks() {
  return (
    <section className="wrap editorial-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A FILE WITH SOMEWHERE TO GO</p>
          <h2>
            Small tasks. <em>Better handoffs.</em>
          </h2>
        </div>
        <p>
          Start with what you need to do.
          <br />
          We’ll point you to the right tool.
        </p>
      </div>
      <div className="task-grid">
        {[
          {
            icon: Image,
            title: 'Get an image web-ready',
            text: 'Convert a PNG or JPG to WebP, or compress an image before you share it.',
            href: '/tools/converters/image',
            label: 'Convert an image',
            sample: 'PNG → WebP',
          },
          {
            icon: Music,
            title: 'Take a recording with you',
            text: 'Choose a format that works with your player, editor, or next project.',
            href: '/tools/converters/audio',
            label: 'Convert audio',
            sample: 'WAV → MP3',
          },
          {
            icon: FileText,
            title: 'Tidy up a document',
            text: 'Optimize a PDF’s structure and metadata. Results depend on the original file.',
            href: '/tools/compression/pdf',
            label: 'Optimize a PDF',
            sample: 'PDF · optimized',
          },
        ].map(item => (
          <article className="task-card" key={item.href}>
            <div className="task-sample">
              <item.icon size={32} strokeWidth={1.5} />
              <span>{item.sample}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <Link className="text-link" href={item.href}>
              {item.label}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
export function HomeGuidance() {
  return (
    <>
      <section className="wrap editorial-section confidence-section">
        <div>
          <p className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p>
          <h2>
            Your files deserve
            <br />
            <em>a clear path.</em>
          </h2>
          <p>Know what happens before you upload, and what to expect when the job is done.</p>
          <Link className="text-link" href="/privacy-policy">
            How your files are handled
          </Link>
        </div>
        <div className="principle-list">
          {[
            {
              icon: Server,
              title: 'Processed on your installation',
              body: 'Files are uploaded to configured storage and processed by a worker, not entirely in your browser.',
            },
            {
              icon: FolderCheck,
              title: 'Keep the original close',
              body: 'Download the result, check it in your destination app, and keep your original until you’re happy.',
            },
            {
              icon: BookOpen,
              title: 'Help at every step',
              body: 'Format guidance, job details, and troubleshooting are a short trip away in the docs.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon size={22} />
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="wrap editorial-section faq-section">
        <div>
          <p className="eyebrow">BEFORE YOU BEGIN</p>
          <h2>A few useful answers.</h2>
          <Link className="text-link" href="/docs">
            Explore the documentation
          </Link>
        </div>
        <Questions
          items={[
            [
              'Convert or compress?',
              'Convert when you need a different file format. Compress when you want to optimize a file for sharing or storage. The best result depends on the original.',
            ],
            [
              'Are files processed in my browser?',
              'No. Files are uploaded to this installation’s storage and processed by its worker. Ask the operator about access and retention before uploading sensitive files.',
            ],
            [
              'Where can I find my result?',
              'Follow the job’s progress in the tool or on the Jobs page. When processing finishes, use its download link to save the result.',
            ],
            [
              'What if a conversion fails?',
              'Keep your original. Check that its format is supported, try again when services are available, and use the troubleshooting guide for common errors.',
            ],
          ]}
        />
      </section>
      <div className="wrap">
        <NextStep />
      </div>
    </>
  );
}
