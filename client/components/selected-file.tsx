import { useState, useEffect } from 'react';
import Image from 'next/image';
import { File, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SelectedFileProps {
  file: File;
  fileType: string | null;
}

export function SelectedFile({ file, fileType }: SelectedFileProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Helper function to check if file is an image
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Generate preview URL for images
  useEffect(() => {
    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Cleanup URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  return (
    <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex-shrink-0">
        {previewUrl && !imageLoadError ? (
          <div className="relative">
            <Image
              src={previewUrl}
              alt={`Preview of ${file.name}`}
              width={48}
              height={48}
              className="h-12 w-12 object-cover rounded-md border bg-muted"
              onError={() => setImageLoadError(true)}
              unoptimized
            />
          </div>
        ) : isImageFile(file) ? (
          <div className="h-12 w-12 flex items-center justify-center rounded-md border bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        ) : (
          <File className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          {isImageFile(file) && previewUrl && !imageLoadError && <span>• Image preview</span>}
        </div>
      </div>
      {fileType && (
        <div className="flex-shrink-0">
          <Badge variant="secondary" className="uppercase">
            {fileType}
          </Badge>
        </div>
      )}
    </div>
  );
}
