import { ToolPage } from '@/components/tool-page';
export const metadata = {
  title: 'Audio Converter',
  description: 'Use Cloud Tools to convert audio files and track the result.',
};
export default function Page() {
  return (
    <ToolPage
      title="Audio Converter"
      fileType="audio"
      formats={['mp3', 'wav', 'ogg', 'flac']}
      storageKey="audioConversionHistory"
    />
  );
}
