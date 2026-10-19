import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { marked, Renderer } from 'marked';
import { guides } from './catalog';
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export async function readGuide(slug: string) {
  const guide = guides.find(item => item.slug === slug);
  if (!guide) return null;
  const markdown = await readFile(resolve(process.cwd(), '../docs', `${guide.file}.md`), 'utf8');
  const headings = [...markdown.matchAll(/^## (.+)$/gm)].map(match => ({
    title: match[1],
    id: headingId(match[1]),
  }));
  const renderer = new Renderer();
  renderer.heading = ({ text, depth, tokens }) =>
    `<h${depth} id="${headingId(text)}">${renderer.parser.parseInline(tokens)}</h${depth}>`;
  renderer.link = ({ href, tokens }) => {
    const target = guides.find(item => `${item.file}.md` === href);
    return `<a href="${target ? `/docs/${target.slug}` : href}">${renderer.parser.parseInline(tokens)}</a>`;
  };
  // Only repository-authored Markdown is rendered; visitor input is never parsed.
  const html = await marked.parse(markdown.replace(/^# .+\n/, ''), { renderer });
  return { ...guide, markdown, headings, html };
}
