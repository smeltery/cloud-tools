'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { Job } from '@/app/api/jobs/route';
import { RecentJobs } from '@/components/recent-jobs';

const states = {
  pending: {
    title: 'In the queue',
    detail: 'Your job has been created. You can leave this page and check back later.',
    icon: Clock,
  },
  processing: {
    title: 'Working on your file',
    detail: 'Your job is queued or processing. We’ll show progress when the worker reports it.',
    icon: RefreshCw,
  },
  completed: {
    title: 'Your file is ready',
    detail: 'Processing is complete. Download the result when a link is available.',
    icon: CheckCircle2,
  },
  failed: {
    title: 'This job needs attention',
    detail: 'Processing didn’t finish. Review the message below before submitting your file again.',
    icon: AlertCircle,
  },
};
function downloadLink(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export default function JobStatus() {
  const [jobId, setJobId] = useState('');
  const [selected, setSelected] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState('');
  const [automatic, setAutomatic] = useState(true);
  const request = useRef<AbortController | null>(null);
  const activeId = useRef('');
  const check = useCallback(async (id: string, background = false) => {
    id = id.trim();
    if (!id) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    if (activeId.current !== id) {
      setJob(null);
      setCheckedAt('');
    }
    activeId.current = id;
    setSelected(id);
    if (!background) setJobId(id);
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`/api/jobs?jobId=${encodeURIComponent(id)}`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? 'We couldn’t find that job. Check the ID and make sure you’re on the installation where you uploaded the file.'
            : 'We couldn’t reach your job. Try again, or check system status.'
        );
      const { data } = await response.json();
      if (!data || data.jobId !== id || !Object.hasOwn(states, data.status))
        throw new Error('The server returned an unreadable job. Try checking again.');
      if (request.current !== controller) return;
      setJob(data);
      setCheckedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err) {
      if (request.current !== controller) return;
      setError(
        controller.signal.aborted
          ? 'The check took too long. Please try again.'
          : err instanceof Error
            ? err.message
            : 'We couldn’t check this job. Please try again.'
      );
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);
  useEffect(
    () => () => {
      const current = request.current;
      request.current = null;
      current?.abort();
    },
    []
  );
  const active = job?.status === 'pending' || job?.status === 'processing';
  useEffect(() => {
    if (!automatic || !active || error) return;
    const timer = setInterval(() => {
      if (!document.hidden && !request.current) void check(selected, true);
    }, 10000);
    return () => clearInterval(timer);
  }, [automatic, active, error, selected, check]);
  const state = job ? states[job.status] : null;
  const Icon = state?.icon || Search;
  const progress =
    typeof job?.progress === 'number' && Number.isFinite(job.progress)
      ? Math.max(0, Math.min(100, job.progress))
      : null;
  const download = job?.status === 'completed' && !error ? downloadLink(job.downloadUrl) : null;
  return (
    <div className="jobs-workspace">
      <div className="jobs-tracker">
        <section className="jobs-lookup" aria-labelledby="lookup-title">
          <p className="eyebrow">HAVE A JOB ID?</p>
          <h2 id="lookup-title" tabIndex={-1}>
            Let’s find your file.
          </h2>
          <form
            onSubmit={event => {
              event.preventDefault();
              void check(jobId);
            }}
          >
            <label htmlFor="job-id">Job ID</label>
            <div className="jobs-input-row">
              <input
                id="job-id"
                value={jobId}
                onChange={event => setJobId(event.target.value)}
                placeholder="Paste your job ID"
                required
                autoComplete="off"
                spellCheck={false}
                aria-describedby="job-id-help"
              />
              <button className="primary-link" type="submit" disabled={loading || !jobId.trim()}>
                <Search size={17} aria-hidden="true" />
                {loading ? 'Checking…' : 'Find job'}
              </button>
            </div>
            <p id="job-id-help">You’ll find it in the tool’s recent history after uploading.</p>
          </form>
        </section>
        {error && (
          <div className="jobs-error" role="alert">
            <AlertCircle size={20} aria-hidden="true" />
            <div>
              <strong>We couldn’t update this job.</strong>
              <p>{error}</p>
              {job && <p>The details below are from the last successful check.</p>}
              <button className="text-link" onClick={() => void check(selected)} disabled={loading}>
                Try again
              </button>
              <Link className="text-link" href="/status">
                System status
              </Link>
            </div>
          </div>
        )}
        <div role="status" className="sr-only">
          {loading
            ? 'Checking job status.'
            : job
              ? `${state?.title}${error ? '. Last known status.' : ''}`
              : ''}
        </div>
        {job && state ? (
          <section className="jobs-result" aria-labelledby="job-result-title" aria-busy={loading}>
            <div className={`jobs-state ${job.status}`}>
              <Icon size={24} aria-hidden="true" />
              <div>
                <p className="eyebrow">{error ? 'LAST KNOWN STATUS' : 'YOUR JOB'}</p>
                <h2 id="job-result-title">{state.title}</h2>
              </div>
            </div>
            <p>{state.detail}</p>
            <h3 className="jobs-filename">{job.fileName}</h3>
            {active && progress !== null && (
              <div className="jobs-progress">
                <label htmlFor="job-progress">
                  Reported progress <span>{progress}%</span>
                </label>
                <progress id="job-progress" value={progress} max={100} />
              </div>
            )}
            <dl className="jobs-details">
              <div>
                <dt>Job ID</dt>
                <dd className="jobs-id">{job.jobId}</dd>
              </div>
              <div>
                <dt>Task</dt>
                <dd>
                  {job.operation === 'compress' ? 'Compression' : 'Conversion'}
                  {job.targetFormat ? ` · ${job.targetFormat.toUpperCase()}` : ''}
                </dd>
              </div>
              <div>
                <dt>Original size</dt>
                <dd>
                  {Number.isFinite(job.fileSize)
                    ? `${(job.fileSize / 1024 / 1024).toFixed(2)} MB`
                    : 'Not reported'}
                </dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>
                  {Number.isNaN(Date.parse(job.createdAt))
                    ? 'Not reported'
                    : new Date(job.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
            {job.errorMessage && (
              <div className="jobs-error">
                <p>{job.errorMessage}</p>
              </div>
            )}
            {download && (
              <a
                className="primary-link jobs-download"
                href={download}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={18} aria-hidden="true" />
                Download file <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
            {job.status === 'completed' && !download && !error && (
              <p className="jobs-note">
                The job is complete, but a download link isn’t available. Check again or contact the
                person running this installation.
              </p>
            )}
            {job.status === 'failed' && (
              <Link className="text-link" href="/#tools">
                Return to the tools
              </Link>
            )}
            <div className="jobs-refresh">
              <span>
                {checkedAt && `Last checked ${checkedAt}`}
                {error && ' · results are stale'}
              </span>
              <button
                type="button"
                className="text-link"
                disabled={loading}
                onClick={() => void check(selected)}
              >
                <RefreshCw size={15} aria-hidden="true" />
                Check again
              </button>
              {active && (
                <label>
                  <input
                    type="checkbox"
                    checked={automatic}
                    onChange={event => setAutomatic(event.target.checked)}
                  />
                  Refresh every 10 seconds
                </label>
              )}
              {active && error && <p>Automatic refresh is paused until a check succeeds.</p>}
            </div>
          </section>
        ) : !loading && !error ? (
          <div className="jobs-placeholder">
            <Search size={32} aria-hidden="true" />
            <h3>A place to pick things up.</h3>
            <p>
              Look up a job above, or choose a recent file. Its progress and download will appear
              here.
            </p>
          </div>
        ) : null}
      </div>
      <RecentJobs onSelect={id => void check(id)} selected={selected} />
    </div>
  );
}
