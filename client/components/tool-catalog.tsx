import Link from 'next/link';
import { tools } from '@/lib/catalog';
export function ToolCatalog({ category }: { category: 'Convert' | 'Compress' }) {
  return (
    <section className="wrap tools-section">
      <p className="eyebrow">THE SMELTERY FILE TOOLBOX</p>
      <h1 className="text-4xl md:text-5xl my-6">
        {category === 'Convert' ? 'A new format for your next step.' : 'A little less weight.'}
      </h1>
      <p className="text-muted-foreground mb-10">Choose the tool that matches your file.</p>
      <div className="tool-grid">
        {tools
          .filter(t => t.category === category)
          .map(tool => (
            <Link key={tool.href} href={tool.href} className="tool-card">
              <tool.icon size={28} />
              <h2 className="text-2xl my-6">{tool.title}</h2>
              <p>{tool.description}</p>
              <div className="tool-card-bottom">
                <small>{tool.formats}</small>
                <span className="tool-open">Open tool</span>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
