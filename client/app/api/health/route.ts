import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check LocalStack connectivity
    let localStackStatus = 'unknown';
    let localStackServices = {};

    try {
      const localStackResponse = await fetch('http://localhost:4566/_localstack/health', {
        signal: AbortSignal.timeout(3000),
      });
      if (localStackResponse.ok) {
        const health = await localStackResponse.json();
        localStackServices = health.services;
        localStackStatus = 'connected';
      } else {
        localStackStatus = 'unreachable';
      }
    } catch {
      localStackStatus = 'down';
    }

    // Calculate uptime in a more readable format
    const uptimeSeconds = process.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / 86400);
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptimeMins = Math.floor((uptimeSeconds % 3600) / 60);

    let uptimeString = '';
    if (uptimeDays > 0) uptimeString += `${uptimeDays}d `;
    if (uptimeHours > 0) uptimeString += `${uptimeHours}h `;
    uptimeString += `${uptimeMins}m`;

    const memUsage = process.memoryUsage();
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'operational',
        localstack: localStackStatus,
        ...localStackServices,
      },
      system: {
        uptime: uptimeString,
        uptimeSeconds,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        nodejs: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
      localstack: {
        status: localStackStatus,
        services: localStackServices,
      },
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
