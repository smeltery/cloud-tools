'use client';
import { useEffect } from 'react';
export function DocsCodeCopy() {
  useEffect(() => {
    async function copy(event: MouseEvent) {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-copy-code]');
      if (!button) return;
      const code = button.closest('.docs-code')?.querySelector('code')?.textContent;
      if (code === undefined || code === null) return;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed';
      }
    }
    document.addEventListener('click', copy);
    return () => document.removeEventListener('click', copy);
  }, []);
  return null;
}
