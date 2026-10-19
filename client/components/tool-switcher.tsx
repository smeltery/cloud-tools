'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  RefreshCcw,
  Minimize2,
  Image,
  FileAudio,
  FileVideo,
  BookOpen,
  FileImage,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const converters = [
  { name: 'Image Converter', href: '/tools/converters/image', icon: Image },
  { name: 'Audio Converter', href: '/tools/converters/audio', icon: FileAudio },
  { name: 'Video Converter', href: '/tools/converters/video', icon: FileVideo },
  { name: 'eBook Converter', href: '/tools/converters/ebooks', icon: BookOpen },
];

const compressionTools = [
  {
    name: 'Image Compression',
    href: '/tools/compression/image',
    icon: FileImage,
  },
  { name: 'PDF Compression', href: '/tools/compression/pdf', icon: FileText },
];

export function ToolSwitcher() {
  const pathname = usePathname();

  const isConverterTool = pathname.startsWith('/tools/converters');
  const currentTool = pathname.split('/').pop();

  // Filter out the current category tools
  const filteredTools = (isConverterTool ? converters : compressionTools).filter(tool => {
    const toolName = tool.href.split('/').pop();
    return toolName !== currentTool;
  });

  // Determine the other category
  const otherCategory = isConverterTool ? 'Compression Tools' : 'Converter Tools';
  const otherCategoryHref = isConverterTool ? '/tools/compression' : '/tools/converters';
  const OtherCategoryIcon = isConverterTool ? Minimize2 : RefreshCcw;

  return (
    <div className="mt-8 p-6 bg-background rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-primary">Other Tools</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {filteredTools.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            aria-label={`Navigate to ${tool.name}`}
            className={cn(
              'transform transition-all hover:scale-105',
              pathname === tool.href ? 'ring-2 ring-primary' : ''
            )}
          >
            <Card
              className={cn(
                'overflow-hidden',
                pathname === tool.href
                  ? 'bg-gradient-to-br from-primary/10 to-primary/5'
                  : 'hover:bg-accent/50'
              )}
            >
              <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                <tool.icon
                  className={cn(
                    'h-10 w-10 mb-3 transition-all',
                    pathname === tool.href
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-primary'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium text-center',
                    pathname === tool.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {tool.name}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
        <Link
          href={otherCategoryHref}
          aria-label={`Navigate to ${otherCategory}`}
          className="transform transition-all hover:scale-105"
        >
          <Card className="hover:bg-accent/50 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center p-4 h-full">
              <OtherCategoryIcon className="h-10 w-10 mb-3 text-muted-foreground group-hover:text-primary transition-all" />
              <span className="text-sm font-medium text-center text-muted-foreground">
                {otherCategory}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
