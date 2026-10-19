'use client';

import { PageTransition } from '@/components/page-transition';
import JobStatus from '@/components/job-status';

export default function JobsPage() {
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Job Status</h1>
            <p className="text-muted-foreground">
              Track the progress of your file conversion and compression jobs
            </p>
          </div>

          <JobStatus />

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Job IDs are provided when you upload files for processing. Check your browser
              notifications or local storage for job IDs.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
