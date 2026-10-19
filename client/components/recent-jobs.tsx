'use client';
import { useEffect, useState } from 'react';
import { FileClock } from 'lucide-react';
import Link from 'next/link';

type RecentJob = { jobId: string; originalName: string; date: string };
const keys = [
  'imageConversionHistory',
  'audioConversionHistory',
  'videoConversionHistory',
  'ebookConversionHistory',
  'imageCompressionHistory',
  'pdfCompressionHistory',
];
export function RecentJobs({
  onSelect,
  selected,
}: {
  onSelect: (id: string) => void;
  selected?: string;
}) {
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [warning, setWarning] = useState(false);
  useEffect(() => {
    const read = () => {
      const found = new Map<string, RecentJob>();
      let unreadable = false;
      for (const key of keys) {
        try {
          const records: unknown = JSON.parse(localStorage.getItem(key) || '[]');
          if (!Array.isArray(records)) throw new Error('Invalid history');
          for (const record of records) {
            if (
              !record ||
              typeof record.jobId !== 'string' ||
              !record.jobId.trim() ||
              typeof record.originalName !== 'string' ||
              typeof record.date !== 'string'
            ) {
              unreadable = true;
              continue;
            }
            found.set(record.jobId, record);
          }
        } catch {
          unreadable = true;
        }
      }
      setJobs([...found.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10));
      setWarning(unreadable);
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);
  return (
    <aside className="jobs-recent" aria-labelledby="recent-jobs-title">
      <p className="eyebrow">SAVED ON THIS DEVICE</p>
      <h2 id="recent-jobs-title">Recent jobs</h2>
      <p>Shortcuts from your tool history. Select a file to check its latest status.</p>
      {warning && (
        <p role="status">
          Some browser history couldn’t be read. You can still look up a job by ID.
        </p>
      )}
      {jobs.length ? (
        <ul>
          {jobs.map(job => (
            <li key={job.jobId}>
              <button
                type="button"
                aria-pressed={selected === job.jobId}
                onClick={() => {
                  onSelect(job.jobId);
                  document.getElementById('lookup-title')?.focus();
                }}
              >
                <FileClock size={20} aria-hidden="true" />
                <span>
                  <strong>{job.originalName}</strong>
                  <small>{job.jobId}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="jobs-empty">
          <FileClock size={30} aria-hidden="true" />
          <h3>No saved jobs yet</h3>
          <p>Start with a file, or use a job ID you already have.</p>
          <Link href="/#tools" className="text-link">
            Find a tool
          </Link>
        </div>
      )}
    </aside>
  );
}
