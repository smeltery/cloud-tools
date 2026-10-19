import Link from 'next/link';
import FileUploader from './file-uploader';
import ConversionHistory from './conversion-history';
import { ToolSwitcher } from './tool-switcher';

type Props = {
  title: string;
  fileType: 'image' | 'video' | 'audio' | 'ebook' | 'pdf';
  formats: string[];
  storageKey: string;
  isCompression?: boolean;
};
export function ToolPage({ title, ...props }: Props) {
  return (
    <section className="wrap tools-section">
      <p className="eyebrow">THE SMELTERY FILE TOOLBOX</p>
      <h1 className="text-4xl md:text-5xl mt-5 mb-5">{title}</h1>
      <p className="text-muted-foreground mb-10">
        Choose your file. Make it work for you.{' '}
        <Link className="text-link" href="/docs/conversion">
          Read the guide
        </Link>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <FileUploader {...props} />
          <ToolSwitcher />
        </div>
        <section aria-label="Recent conversions">
          <h2 className="text-2xl mb-5">Recent files</h2>
          <ConversionHistory storageKey={props.storageKey} />
        </section>
      </div>
    </section>
  );
}
