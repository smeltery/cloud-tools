import { ToolPage } from '@/components/tool-page';
export const metadata = {
  title: 'PDF Compression',
  description: 'Use Cloud Tools to compress pdf files and track the result.',
};
export default function Page() {
  return (
    <ToolPage
      title="PDF Compression"
      fileType="pdf"
      formats={['pdf']}
      storageKey="pdfCompressionHistory"
      isCompression
    />
  );
}
