import Link from 'next/link';
import { Cloud } from 'lucide-react';
export default function Logo() {
  return (
    <Link href="/" className="brand" aria-label="Cloud Tools home">
      <Cloud size={32} strokeWidth={1.7} aria-hidden="true" />
      <span>
        smeltery<span className="brand-sub"> / cloud tools</span>
      </span>
    </Link>
  );
}
