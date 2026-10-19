'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversionRecord {
  jobId: string;
  originalName: string;
  processedTo?: string;
  date: string;
  status: string;
  operation: 'convert' | 'compress';
  url?: string;
  // Compression savings tracking
  originalFileSize?: number;
  processedFileSize?: number;
  compressionSavings?: number;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

interface ConversionHistoryProps {
  storageKey: string;
}

export default function ConversionHistory({ storageKey }: ConversionHistoryProps) {
  const [history, setHistory] = useState<ConversionRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to check if a file is an image based on filename
  const isImageFile = useCallback((filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
    return imageExtensions.some(ext => filename.toLowerCase().includes(ext.toLowerCase()));
  }, []);

  // Function to load history from localStorage
  const loadHistory = useCallback(() => {
    const storedHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setHistory(storedHistory);
  }, [storageKey]);

  // Function to update job status from API
  const updateJobStatuses = useCallback(async () => {
    const storedHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let hasUpdates = false;

    const updatedHistory = await Promise.all(
      storedHistory.map(async (record: ConversionRecord) => {
        // Only update jobs that are still processing
        if (record.status === 'processing' || record.status === 'pending') {
          try {
            const response = await fetch(`/api/jobs?jobId=${record.jobId}`);
            if (response.ok) {
              const jobData = await response.json();
              const updatedRecord = {
                ...record,
                status: jobData.data?.status || record.status,
                // Add download URL if job is completed
                url:
                  jobData.data?.status === 'completed' && jobData.data?.downloadUrl
                    ? jobData.data.downloadUrl
                    : record.url,
                // Add compression data if available
                originalFileSize: jobData.data?.originalFileSize || record.originalFileSize,
                processedFileSize: jobData.data?.processedFileSize || record.processedFileSize,
                compressionSavings: jobData.data?.compressionSavings || record.compressionSavings,
              };

              // Check if anything changed
              if (updatedRecord.status !== record.status || updatedRecord.url !== record.url) {
                hasUpdates = true;
              }

              return updatedRecord;
            }
          } catch (error) {
            console.error(`Failed to update job status for ${record.jobId}:`, error);
          }
        }
        return record;
      })
    );

    // Update localStorage and state if there were changes
    if (hasUpdates) {
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    }
  }, [storageKey]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await updateJobStatuses();
    setTimeout(() => setIsRefreshing(false), 500); // Small delay for UX
  }, [updateJobStatuses]);

  // Clear history function
  const handleClearHistory = useCallback(() => {
    if (
      window.confirm(
        'Are you sure you want to clear all conversion history? This action cannot be undone.'
      )
    ) {
      localStorage.removeItem(storageKey);
      setHistory([]);
    }
  }, [storageKey]);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-refresh localStorage changes (for new additions)
  useEffect(() => {
    const handleStorageChange = () => {
      loadHistory();
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Also check for changes periodically (in case of same-tab updates)
    const interval = setInterval(loadHistory, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [loadHistory]);

  // Auto-update job statuses
  useEffect(() => {
    // Update statuses immediately
    updateJobStatuses();

    // Set up interval to check for status updates every 5 seconds
    const interval = setInterval(updateJobStatuses, 5000);

    return () => clearInterval(interval);
  }, [updateJobStatuses]);

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <Card className="w-full h-[600px]">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">Recent Activity</h3>
            {history.some(
              record => record.status === 'processing' || record.status === 'pending'
            ) && (
              <div className="flex items-center text-xs text-blue-600">
                <Clock className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              disabled={history.length === 0}
              title="Clear all history"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            {history.length === 0 ? (
              <motion.p
                className="text-center text-muted-foreground p-4"
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
              >
                No conversion history yet.
              </motion.p>
            ) : (
              <motion.ul
                className="divide-y divide-border"
                variants={fadeInUp}
                transition={{ delay: 0.2, staggerChildren: 0.1 }}
              >
                {history.map((record, index) => (
                  <motion.li
                    key={index}
                    className="p-4 hover:bg-muted/50 transition-colors"
                    variants={fadeInUp}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Image Preview Thumbnail */}
                      {isImageFile(record.originalName) &&
                      record.url &&
                      record.status === 'completed' ? (
                        <div className="flex-shrink-0">
                          <Image
                            src={record.url}
                            alt={`Preview of ${record.originalName}`}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-lg border bg-muted"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLDivElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            unoptimized
                          />
                          <div className="w-16 h-16 hidden items-center justify-center rounded-lg border bg-muted">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </div>
                      ) : isImageFile(record.originalName) ? (
                        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-lg border bg-muted">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : null}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium truncate text-foreground">
                            {record.originalName}
                          </p>
                          {record.status === 'processing' || record.status === 'pending' ? (
                            <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : record.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : record.status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {record.operation === 'compress'
                            ? record.processedTo || 'Compressed file'
                            : `Converted to: ${record.processedTo?.toUpperCase() || 'Unknown format'}`}
                        </p>
                        {record.operation === 'compress' &&
                          record.compressionSavings &&
                          record.originalFileSize &&
                          record.processedFileSize && (
                            <div className="text-xs text-green-600 mt-1 flex items-center space-x-2">
                              <span>✓ {record.compressionSavings.toFixed(1)}% saved</span>
                              <span>•</span>
                              <span>
                                {(
                                  (record.originalFileSize - record.processedFileSize) /
                                  (1024 * 1024)
                                ).toFixed(1)}
                                MB reduced
                              </span>
                            </div>
                          )}
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-muted-foreground">Job ID: {record.jobId}</p>
                          <div className="flex items-center space-x-1">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                record.status === 'processing' || record.status === 'pending'
                                  ? 'bg-blue-500 animate-pulse'
                                  : record.status === 'completed'
                                    ? 'bg-green-500'
                                    : record.status === 'failed'
                                      ? 'bg-red-500'
                                      : 'bg-gray-500'
                              }`}
                            />
                            <p className="text-xs text-muted-foreground capitalize">
                              {record.status}
                            </p>
                          </div>
                        </div>
                      </div>
                      {record.url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(record.url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      ) : record.status === 'failed' ? (
                        <Button variant="outline" size="sm" disabled>
                          <XCircle className="w-4 h-4 mr-2" />
                          Failed
                        </Button>
                      ) : record.status === 'processing' || record.status === 'pending' ? (
                        <Button variant="outline" size="sm" disabled>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Processing
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          <Download className="w-4 h-4 mr-2" />
                          Unavailable
                        </Button>
                      )}
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
