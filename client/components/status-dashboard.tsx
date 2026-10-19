'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Cloud,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  CircleHelp,
  AlertCircle,
} from 'lucide-react';
type Health = {
  status: string;
  system?: { uptime?: string };
  localstack?: { status?: string; services?: Record<string, string> };
};
const services = [
  {
    key: 'api',
    title: 'Application API',
    description: 'Receives requests from the toolbox.',
    icon: Server,
  },
  {
    key: 's3',
    title: 'File storage',
    description: 'Holds uploaded files and processed results.',
    icon: Cloud,
  },
  {
    key: 'dynamodb',
    title: 'Job records',
    description: 'Keeps track of processing progress.',
    icon: Database,
  },
  {
    key: 'sqs',
    title: 'Processing queue',
    description: 'Passes work to the conversion worker.',
    icon: Activity,
  },
];
export default function StatusDashboard() {
  const [snapshot, setSnapshot] = useState<{ health: Health; latency: number; time: Date } | null>(
    null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [automatic, setAutomatic] = useState(true);
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    setLoading(true);
    const started = performance.now();
    try {
      const response = await fetch('/api/health', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`Health check returned HTTP ${response.status}.`);
      const health: Health = await response.json();
      if (!health || typeof health.status !== 'string')
        throw new Error('The health response could not be read.');
      setSnapshot({ health, latency: Math.round(performance.now() - started), time: new Date() });
      setError('');
    } catch (cause) {
      if (request.current === controller)
        setError(
          controller.signal.aborted
            ? 'The health check timed out. Try again in a moment.'
            : cause instanceof Error
              ? cause.message
              : 'The health check could not complete.'
        );
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    void refresh();
    return () => {
      const current = request.current;
      request.current = null;
      current?.abort();
    };
  }, [refresh]);
  useEffect(() => {
    if (!automatic) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30000);
    return () => clearInterval(timer);
  }, [automatic, refresh]);
  const reported = services.map(service => {
    const value =
      !error && snapshot
        ? service.key === 'api'
          ? snapshot.health.status
          : snapshot.health.localstack?.services?.[service.key]
        : undefined;
    const state =
      !snapshot && loading
        ? 'checking'
        : !value
          ? 'unknown'
          : ['healthy', 'running', 'available'].includes(value)
            ? 'available'
            : 'attention';
    return { ...service, state };
  });
  const available = reported.filter(service => service.state === 'available').length;
  const title =
    loading && !snapshot
      ? 'Checking this installation…'
      : error
        ? 'We couldn’t complete the check.'
        : available === 4
          ? 'Reported services are available.'
          : 'Some services aren’t verified.';
  return (
    <div className="status-dashboard">
      <section className="status-summary" aria-label="Current health">
        <div>
          <p className="eyebrow">CURRENT SNAPSHOT</p>
          <h2 aria-live="polite">{title}</h2>
          <p>
            {error ||
              (available === 4
                ? 'The API and local service probes responded. A completed conversion is still the best end-to-end check.'
                : 'The app may be reachable even when local service telemetry is unavailable. This does not confirm an outage in an AWS deployment.')}
          </p>
        </div>
        <button className="primary-link" disabled={loading} onClick={() => void refresh()}>
          <RefreshCw size={16} className={loading ? 'status-refreshing' : ''} />
          {loading ? 'Checking…' : 'Check again'}
        </button>
      </section>
      <div className="status-toolbar">
        <p>
          {snapshot ? (
            <>
              Last successful check{' '}
              <time dateTime={snapshot.time.toISOString()}>
                {snapshot.time.toLocaleTimeString()}
              </time>
              {error && ' · results are stale'}
            </>
          ) : (
            'No successful check yet'
          )}
        </p>
        <label>
          <input
            type="checkbox"
            checked={automatic}
            onChange={e => setAutomatic(e.target.checked)}
          />{' '}
          Refresh every 30 seconds
        </label>
      </div>
      <div className="status-services">
        {reported.map(service => {
          const Icon = service.icon;
          const StateIcon =
            service.state === 'available'
              ? CheckCircle2
              : service.state === 'attention'
                ? AlertCircle
                : CircleHelp;
          return (
            <article key={service.key}>
              <Icon size={22} />
              <div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <span className={`service-state ${service.state}`}>
                <StateIcon size={15} />
                {
                  {
                    available: 'Available',
                    unknown: 'Not verified',
                    attention: 'Needs attention',
                    checking: 'Checking',
                  }[service.state]
                }
              </span>
            </article>
          );
        })}
      </div>
      <dl className="status-facts">
        <div>
          <dt>API round trip</dt>
          <dd>
            {snapshot && !error ? `${snapshot.latency} ms` : 'Not available'}
            <p>Measured from this browser.</p>
          </dd>
        </div>
        <div>
          <dt>API process uptime</dt>
          <dd>
            {snapshot && !error
              ? snapshot.health.system?.uptime || 'Not reported'
              : 'Not available'}
            <p>Resets when the server process restarts.</p>
          </dd>
        </div>
        <div>
          <dt>Available service reports</dt>
          <dd>
            {available} <span>/ 4</span>
            <p>A snapshot, not historical availability.</p>
          </dd>
        </div>
      </dl>
      <div className="guide-grid status-guidance">
        <article>
          <h3>A file isn’t moving?</h3>
          <p>
            Check its job first. A healthy API doesn’t guarantee that a worker is running or that a
            file can be converted.
          </p>
          <Link className="text-link" href="/jobs">
            Check your jobs
          </Link>
        </article>
        <article>
          <h3>Running your own setup?</h3>
          <p>
            Storage, database, and queue reports come from LocalStack. Production AWS health needs
            separate operator monitoring.
          </p>
          <Link className="text-link" href="/docs/troubleshooting">
            Troubleshoot your setup
          </Link>
        </article>
      </div>
    </div>
  );
}
