import Link from 'next/link';
import JobStatus from '@/components/job-status';
import { NextStep, Questions } from '@/components/next-step';

export const metadata = {
  title: 'Your jobs',
  description: 'Find a file job, check its progress, and download the finished result.',
};
export default function JobsPage() {
  return (
    <div className="wrap jobs-page">
      <header className="editorial-hero">
        <p className="eyebrow">FROM UPLOAD TO ALL DONE</p>
        <h1>
          Your files. <em>A little further along.</em>
        </h1>
        <p>
          Pick up where you left off. Find a job, check how it’s doing, and collect your finished
          file.
        </p>
      </header>
      <JobStatus />
      <section className="editorial-section jobs-help">
        <div>
          <p className="eyebrow">A LITTLE GUIDANCE</p>
          <h2>Waiting on a file?</h2>
          <p>Processing time depends on the file and the installation running your job.</p>
          <Link className="text-link" href="/docs/jobs">
            Read about jobs and downloads
          </Link>
          <Link className="text-link" href="/status">
            Check system status
          </Link>
        </div>
        <Questions
          items={[
            [
              'Where can I find my job ID?',
              'The tool’s recent history shows the ID after you submit a file. Jobs saved in this browser also appear here. You can paste an ID from another browser into the lookup.',
            ],
            [
              'Why is my job still queued?',
              'The job has been accepted but has not reported progress yet. Check again shortly. If it stays queued, contact the person running this installation.',
            ],
            [
              'Can I come back later?',
              'Recent history is stored in this browser. Clearing browser data removes those shortcuts, so keep the job ID if you need it later. Download links and file retention depend on this installation.',
            ],
          ]}
        />
      </section>
      <NextStep title="Another file in mind?" />
    </div>
  );
}
