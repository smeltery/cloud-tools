import { ToolPage } from '@/components/tool-page';
export const metadata = {
  title: 'Image Converter',
  description: 'Use Cloud Tools to convert image files and track the result.',
};
export default function Page() {
  return (
    <ToolPage
      title="Image Converter"
      fileType="image"
      formats={['jpg', 'png', 'webp', 'gif']}
      storageKey="imageConversionHistory"
    />
  );
}
