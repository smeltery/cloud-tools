import { ToolPage } from '@/components/tool-page';
export const metadata = {
  title: 'Image Compression',
  description: 'Use Cloud Tools to compress image files and track the result.',
};
export default function Page() {
  return (
    <ToolPage
      title="Image Compression"
      fileType="image"
      formats={['jpg', 'png', 'webp', 'gif']}
      storageKey="imageCompressionHistory"
      isCompression
    />
  );
}
