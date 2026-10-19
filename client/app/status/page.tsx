'use client';

import { PageTransition } from '@/components/page-transition';
import StatusDashboard from '@/components/status-dashboard';

export default function StatusPage() {
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">System Status</h1>
            <p className="text-muted-foreground">
              Real-time status and performance metrics for Cloud Tools services
            </p>
          </div>

          <StatusDashboard />

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              This page shows the operational status of all Cloud Tools services. Status is updated
              in real-time and refreshed automatically.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
