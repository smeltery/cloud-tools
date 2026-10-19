import { ToolPage } from '@/components/tool-page';
export const metadata = {
  title: 'eBook Converter',
  description: 'Use Cloud Tools to convert ebook files and track the result.',
};
export default function Page() {
  return (
    <ToolPage
      title="eBook Converter"
      fileType="ebook"
      formats={['epub', 'mobi', 'pdf', 'azw3']}
      storageKey="ebookConversionHistory"
    />
  );
}
