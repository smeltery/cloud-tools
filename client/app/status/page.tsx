import StatusDashboard from '@/components/status-dashboard';
export const metadata = {
  title: 'System status',
  description: 'Check the current health reported by this Cloud Tools installation.',
};
export default function StatusPage() {
  return (
    <div className="wrap status-page">
      <header className="editorial-hero">
        <p className="eyebrow">A LOOK BEHIND THE TOOLBOX</p>
        <h1>
          How are things <em>running?</em>
        </h1>
        <p>
          A current view of this installation. Check what’s reachable, see what isn’t verified, and
          find your next step.
        </p>
      </header>
      <StatusDashboard />
    </div>
  );
}
