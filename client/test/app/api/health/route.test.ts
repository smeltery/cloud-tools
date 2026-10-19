import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, OPTIONS } from '@/app/api/health/route';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock process object with proper typing
const mockProcess = {
  uptime: vi.fn(),
  memoryUsage: vi.fn(() => ({
    rss: 50 * 1024 * 1024,
    heapTotal: 40 * 1024 * 1024,
    heapUsed: 30 * 1024 * 1024,
    external: 5 * 1024 * 1024,
    arrayBuffers: 2 * 1024 * 1024,
  })),
  version: 'v24.6.0',
  platform: 'darwin',
  arch: 'arm64',
};

// Store original process methods
const originalProcess = {
  uptime: process.uptime,
  memoryUsage: process.memoryUsage,
};

describe('/api/health', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Replace process methods with mocks
    process.uptime = mockProcess.uptime;
    process.memoryUsage = mockProcess.memoryUsage as any;

    // Set default mock implementations
    mockProcess.uptime.mockReturnValue(3661); // 1 hour, 1 minute, 1 second
    mockProcess.memoryUsage.mockReturnValue({
      rss: 50 * 1024 * 1024, // 50 MB
      heapTotal: 40 * 1024 * 1024, // 40 MB
      heapUsed: 30 * 1024 * 1024, // 30 MB
      external: 5 * 1024 * 1024, // 5 MB
      arrayBuffers: 2 * 1024 * 1024, // 2 MB
    });
  });

  afterEach(() => {
    // Restore original process methods
    process.uptime = originalProcess.uptime;
    process.memoryUsage = originalProcess.memoryUsage;
  });

  describe('GET', () => {
    it('should return healthy status with LocalStack connected', async () => {
      // Mock successful LocalStack health check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            services: {
              s3: 'available',
              dynamodb: 'available',
              sqs: 'available',
            },
          }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        version: '1.0.0',
        environment: 'test',
        services: {
          api: 'operational',
          localstack: 'connected',
          s3: 'available',
          dynamodb: 'available',
          sqs: 'available',
        },
        system: {
          uptime: '1h 1m',
          uptimeSeconds: 3661,
          memory: {
            used: 30, // 30 MB
            total: 40, // 40 MB
            rss: 50, // 50 MB
            external: 5, // 5 MB
          },
          nodejs: {
            version: expect.any(String), // Don't hardcode version
            platform: expect.any(String), // Don't hardcode platform
            arch: expect.any(String), // Don't hardcode architecture
          },
        },
        localstack: {
          status: 'connected',
          services: {
            s3: 'available',
            dynamodb: 'available',
            sqs: 'available',
          },
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4566/_localstack/health',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should return healthy status with LocalStack unreachable', async () => {
      // Mock LocalStack returning non-OK response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        services: {
          api: 'operational',
          localstack: 'unreachable',
        },
        localstack: {
          status: 'unreachable',
          services: {},
        },
      });
    });

    it('should return healthy status with LocalStack down', async () => {
      // Mock LocalStack connection failure
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        services: {
          api: 'operational',
          localstack: 'down',
        },
        localstack: {
          status: 'down',
          services: {},
        },
      });
    });

    it('should format uptime correctly for different durations', async () => {
      // Test different uptime scenarios
      const testCases = [
        { uptime: 30, expected: '0m' },
        { uptime: 120, expected: '2m' },
        { uptime: 3600, expected: '1h 0m' },
        { uptime: 3661, expected: '1h 1m' },
        { uptime: 90061, expected: '1d 1h 1m' },
        { uptime: 176461, expected: '2d 1h 1m' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ services: {} }),
      });

      for (const testCase of testCases) {
        mockProcess.uptime.mockReturnValue(testCase.uptime);

        const response = await GET();
        const data = await response.json();

        expect(data.system.uptime).toBe(testCase.expected);
        expect(data.system.uptimeSeconds).toBe(testCase.uptime);
      }
    });

    it('should handle memory usage correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: {} }),
      });

      mockProcess.memoryUsage.mockReturnValue({
        rss: 100 * 1024 * 1024, // 100 MB
        heapTotal: 80 * 1024 * 1024, // 80 MB
        heapUsed: 60 * 1024 * 1024, // 60 MB
        external: 10 * 1024 * 1024, // 10 MB
        arrayBuffers: 5 * 1024 * 1024, // 5 MB (not used in response)
      });

      const response = await GET();
      const data = await response.json();

      expect(data.system.memory).toEqual({
        used: 60, // heapUsed in MB
        total: 80, // heapTotal in MB
        rss: 100, // rss in MB
        external: 10, // external in MB
      });
    });

    it('should handle unexpected errors during health check', async () => {
      // Mock a critical error that causes the entire function to fail
      mockProcess.uptime.mockImplementation(() => {
        throw new Error('System error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: 'System error',
      });
    });

    it('should handle LocalStack timeout', async () => {
      // Mock LocalStack timeout (AbortError)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.localstack.status).toBe('down');
    });

    it('should handle LocalStack invalid JSON response', async () => {
      // Mock LocalStack returning invalid JSON
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.localstack.status).toBe('down');
    });
  });

  describe('OPTIONS', () => {
    it('should return CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });
});
