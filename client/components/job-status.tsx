'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Job } from '@/app/api/jobs/route';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'processing':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export default function JobStatus() {
  const [jobId, setJobId] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkJobStatus = async () => {
    if (!jobId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a job ID',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs?jobId=${encodeURIComponent(jobId.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job status');
      }

      setJob(data.data);
      toast({
        title: 'Success',
        description: 'Job status retrieved successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Job Status Checker</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your job ID to check the status of your file processing
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="jobId" className="sr-only">
                Job ID
              </Label>
              <Input
                id="jobId"
                placeholder="Enter job ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button onClick={checkJobStatus} disabled={isLoading || !jobId.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-md"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {job && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Job Details</CardTitle>
                    <Badge className={getStatusColor(job.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Job ID</Label>
                      <p className="text-sm font-mono break-all">{job.jobId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">File Name</Label>
                      <p className="text-sm">{job.fileName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Operation</Label>
                      <p className="text-sm capitalize">{job.operation}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">File Size</Label>
                      <p className="text-sm">{(job.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {job.targetFormat && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Target Format
                        </Label>
                        <p className="text-sm uppercase">{job.targetFormat}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <p className="text-sm">{new Date(job.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {job.progress !== undefined && job.progress > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
                      <Progress value={job.progress} className="w-full" />
                      <p className="text-sm text-center text-muted-foreground">{job.progress}%</p>
                    </div>
                  )}

                  {job.errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <Label className="text-sm font-medium text-red-700">Error Message</Label>
                      <p className="text-sm text-red-600 mt-1">{job.errorMessage}</p>
                    </div>
                  )}

                  {job.downloadUrl && (
                    <div className="pt-2">
                      <Button asChild className="w-full">
                        <a href={job.downloadUrl} target="_blank" rel="noopener noreferrer">
                          Download Processed File
                        </a>
                      </Button>
                    </div>
                  )}

                  {job.completedAt && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Completed</Label>
                      <p className="text-sm">{new Date(job.completedAt).toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
