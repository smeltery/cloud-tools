import { useState, useEffect } from 'react';

export type SystemStatus = 'operational' | 'degraded' | 'down' | 'checking';

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>('checking');
  const [isLoading, setIsLoading] = useState(true);

  const checkSystemStatus = async () => {
    try {
      setIsLoading(true);

      // Check all key services
      const [healthCheck, localStackCheck] = await Promise.allSettled([
        fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        }),
        fetch('/api/localstack-health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        }),
      ]);

      // Check if basic health endpoint is working
      const isHealthy = healthCheck.status === 'fulfilled' && healthCheck.value.ok;

      // Check LocalStack services
      let localStackServicesHealthy = false;
      if (localStackCheck.status === 'fulfilled' && localStackCheck.value.ok) {
        try {
          const healthData = await localStackCheck.value.json();
          const services = healthData.services || {};

          // Check key services: S3, DynamoDB, SQS
          const s3Status = services.s3;
          const dynamodbStatus = services.dynamodb;
          const sqsStatus = services.sqs;

          const keyServicesRunning =
            [s3Status, dynamodbStatus, sqsStatus].filter(
              serviceStatus => serviceStatus === 'running' || serviceStatus === 'available'
            ).length >= 2; // At least 2 out of 3 key services must be running

          localStackServicesHealthy = keyServicesRunning;
        } catch (error) {
          console.error('Error parsing LocalStack health data:', error);
          localStackServicesHealthy = false;
        }
      }

      // Determine overall status
      if (isHealthy && localStackServicesHealthy) {
        setStatus('operational');
      } else if (isHealthy || localStackServicesHealthy) {
        setStatus('degraded');
      } else {
        setStatus('down');
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      setStatus('down');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return { status, isLoading, refetch: checkSystemStatus };
}

export function getStatusColor(status: SystemStatus): string {
  switch (status) {
    case 'operational':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'down':
      return 'bg-red-500';
    case 'checking':
    default:
      return 'bg-gray-400 animate-pulse';
  }
}
