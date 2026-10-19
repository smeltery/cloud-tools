import Link from 'next/link';
export function NextStep({
  title = 'One file. A fresh start.',
  description = 'Find the tool for your next task and make a little more room in your day.',
  href = '/#tools',
  label = 'Find your tool',
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="next-step">
      <div>
        <p className="eyebrow">READY WHEN YOU ARE</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="next-step-actions">
        <Link className="primary-link" href={href}>
          {label}
        </Link>
        <Link className="text-link" href="/docs/quick-start">
          A little guidance first
        </Link>
      </div>
    </section>
  );
}
export function Questions({ items }: { items: [string, string][] }) {
  return (
    <div className="questions">
      {items.map(([question, answer]) => (
        <details key={question}>
          <summary>
            {question}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}
