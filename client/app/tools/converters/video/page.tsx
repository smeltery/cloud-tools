import { ToolPage } from '@/components/tool-page';
export const metadata = {
  title: 'Video Converter',
  description: 'Use Cloud Tools to convert video files and track the result.',
};
export default function Page() {
  return (
    <ToolPage
      title="Video Converter"
      fileType="video"
      formats={['mp4', 'mov', 'avi', 'webm']}
      storageKey="videoConversionHistory"
    />
  );
}
