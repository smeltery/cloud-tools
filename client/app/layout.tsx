import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import '@/styles/globals.css';
import '@/styles/site.css';
const geist = localFont({ src: './fonts/GeistVF.woff', display: 'swap' });
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: { default: 'Cloud Tools — A new format. A lighter file.', template: '%s · Cloud Tools' },
  description:
    'Convert images, audio, video and eBooks. Compress images and PDFs. A practical, self-hostable file toolbox from Smeltery.',
  openGraph: {
    title: 'Cloud Tools — A new format. A lighter file.',
    description: 'Six practical file tools. One place to get things done.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Cloud Tools: a new format, a lighter file',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
  },
  icons: { icon: '/logo.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={geist.className} id="top">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main" className="site-main">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
