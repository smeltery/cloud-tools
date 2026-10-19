'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SelectedFile } from '@/components/selected-file';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

interface FileUploaderProps {
  fileType: 'image' | 'video' | 'audio' | 'ebook' | 'pdf';
  formats: string[];
  apiEndpoint?: string;
  storageKey: string;
  isCompression?: boolean;
}

export default function FileUploader({
  fileType,
  formats,
  storageKey,
  isCompression = false,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [currentFileType, setCurrentFileType] = useState<string | null>(null);
  const [convertTo, setConvertTo] = useState<string>('');
  const [availableFormats, setAvailableFormats] = useState<string[]>(formats);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      // Extract file extension from filename
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      setCurrentFileType(extension);

      // Handle common extension variations
      const getExtensionVariations = (ext: string): string[] => {
        const variations: { [key: string]: string[] } = {
          jpg: ['jpg', 'jpeg'],
          jpeg: ['jpg', 'jpeg'],
          tif: ['tif', 'tiff'],
          tiff: ['tif', 'tiff'],
          htm: ['htm', 'html'],
          html: ['htm', 'html'],
        };
        return variations[ext] || [ext];
      };

      const extensionVariations = getExtensionVariations(extension);
      setAvailableFormats(
        formats.filter(format => !extensionVariations.includes(format.toLowerCase()))
      );
      setConvertTo('');
    } else {
      setCurrentFileType(null);
      setAvailableFormats(formats);
    }
  }, [file, formats]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  };

  const clearSelection = () => {
    setFile(null);
    setCurrentFileType(null);
    setConvertTo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || (!isCompression && !convertTo)) {
      toast({
        title: 'Error',
        description: `Please select a ${fileType} ${!isCompression ? 'and conversion format' : ''}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // Step 1: Upload file to S3
      setProgress(25);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('operation', isCompression ? 'compress' : 'convert');
      if (!isCompression && convertTo) {
        uploadFormData.append('targetFormat', convertTo);
      }

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      const { jobId } = uploadData.data;

      // Step 2: Queue job for processing
      setProgress(75);
      const processResponse = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          operation: isCompression ? 'compress' : 'convert',
          targetFormat: convertTo,
          quality: isCompression ? 80 : undefined,
        }),
      });

      const processData = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(processData.error || 'Failed to queue job for processing');
      }

      setProgress(100);

      toast({
        title: 'Upload Complete',
        description: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} queued for ${isCompression ? 'compression' : 'conversion'}! Job ID: ${jobId}`,
      });

      // Add to history with job info
      const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
      history.unshift({
        jobId,
        originalName: file.name,
        processedTo: isCompression
          ? `Compressed ${fileType.toUpperCase()}`
          : convertTo?.toUpperCase(),
        date: new Date().toISOString(),
        status: 'processing',
        operation: isCompression ? 'compress' : 'convert',
      });
      localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 10)));

      clearSelection();
      router.refresh();

      // Show job tracking info
      toast({
        title: 'Processing Started',
        description: `Your ${fileType} is being processed. You can check the status using Job ID: ${jobId}`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <p className="text-sm text-muted-foreground">
            Upload {fileType === 'ebook' ? 'an' : 'a'} {fileType} to{' '}
            {isCompression ? 'compress' : 'convert'}
            {!isCompression && ' and select the format you want to convert it to'}.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <motion.div
                className="flex flex-col space-y-1.5"
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="file">Upload {fileType}</Label>
                <div className="flex h-fit items-center space-x-2">
                  <Input
                    id="file"
                    type="file"
                    accept={
                      fileType === 'pdf'
                        ? '.pdf'
                        : fileType === 'ebook'
                          ? '.epub,.mobi,.azw3,.pdf,.txt,.docx,.rtf'
                          : `${fileType}/*`
                    }
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="flex-grow h-fit cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    ref={fileInputRef}
                  />
                  {file && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSelection}
                      disabled={isLoading}
                      className="h-fit"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </motion.div>
              {file && (
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.3 }}
                >
                  <SelectedFile file={file} fileType={currentFileType} />
                </motion.div>
              )}
              {!isCompression && (
                <motion.div
                  className="flex flex-col space-y-1.5"
                  variants={fadeInUp}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="format">Convert to</Label>
                  <Select
                    value={convertTo}
                    onValueChange={setConvertTo}
                    disabled={isLoading || !file}
                  >
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {availableFormats.map(format => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch space-y-4">
          {isLoading && (
            <motion.div
              className="w-full space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">{progress}% complete</p>
            </motion.div>
          )}
          <motion.div variants={fadeInUp} transition={{ delay: 0.5 }}>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !file || (!isCompression && !convertTo)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCompression ? 'Compressing...' : 'Converting...'}
                </>
              ) : (
                `${isCompression ? 'Compress' : 'Convert'} ${fileType}`
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
