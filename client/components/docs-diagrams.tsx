'use client';
import { useEffect } from 'react';
export function DocsDiagrams({ slug }: { slug: string }) {
  useEffect(() => {
    let cancelled = false;
    async function render() {
      const blocks = [
        ...document.querySelectorAll<HTMLElement>('.docs-article pre:has(code.language-mermaid)'),
      ];
      if (!blocks.length) return;
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          primaryColor: '#e8f3ff',
          primaryTextColor: '#172b43',
          primaryBorderColor: '#9fbedc',
          lineColor: '#527fa8',
          fontFamily: 'inherit',
        },
      });
      for (const [index, block] of blocks.entries()) {
        if (cancelled) return;
        try {
          const { svg } = await mermaid.render(
            `diagram-${slug || 'overview'}-${index}`,
            block.textContent || ''
          );
          if (!cancelled && block.isConnected) {
            const figure = document.createElement('figure');
            figure.className = 'docs-diagram';
            figure.tabIndex = 0;
            figure.setAttribute('aria-label', 'Workflow diagram');
            figure.innerHTML = svg;
            block.replaceWith(figure);
          }
        } catch (error) {
          console.error('Unable to render documentation diagram', error);
        }
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return null;
}
