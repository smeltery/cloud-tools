import Link from 'next/link';
import { tools } from '@/lib/catalog';
export function ToolCards({ category }: { category?: 'Convert' | 'Compress' }) {
  return (
    <div className={`tool-grid${category ? ' catalog-grid' : ''}`}>
      {tools
        .filter(tool => !category || tool.category === category)
        .map((tool, index) => (
          <Link className="tool-card" key={tool.href} href={tool.href}>
            <div className="tool-card-top">
              <tool.icon size={27} strokeWidth={1.5} aria-hidden="true" />
              <span>
                {!category && `0${index + 1} / `}
                {tool.category}
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
  );
}
